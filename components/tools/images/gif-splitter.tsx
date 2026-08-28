"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Trash2, Upload } from "lucide-react";
import GIF from "gif.js";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// ---------------------------------------------------------------------------
// Minimal GIF89a parser (original Tools123 implementation).
// Reads the binary layout described by the public GIF89a specification:
// header, logical screen descriptor, global/local colour tables, graphic
// control extensions and image descriptors, then LZW-decodes each frame.
// ---------------------------------------------------------------------------

interface ParsedFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  indices: Uint8Array;
  palette: [number, number, number][];
  delay: number; // ms
  disposal: number;
  transparent: number | null;
  interlace: boolean;
}

interface ParsedGif {
  width: number;
  height: number;
  frames: ParsedFrame[];
}

interface RenderedFrame {
  id: number;
  data: ImageData;
  delay: number; // ms
  thumb: string;
}

function readU16(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}

function readPalette(b: Uint8Array, o: number, size: number): [number, number, number][] {
  const pal: [number, number, number][] = [];
  for (let i = 0; i < size; i++) {
    pal.push([b[o + i * 3], b[o + i * 3 + 1], b[o + i * 3 + 2]]);
  }
  return pal;
}

/** LZW decode of a GIF image-data stream (indices into the frame palette). */
function lzwDecode(minCodeSize: number, data: Uint8Array): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let dict = new Map<number, number[]>();
  let nextCode = endCode + 1;
  let prev: number[] | null = null;
  const out: number[] = [];
  let buffer = 0;
  let bitCount = 0;
  let pos = 0;

  const readCode = (): number => {
    while (bitCount < codeSize) {
      if (pos >= data.length) return -1;
      buffer |= data[pos++] << bitCount;
      bitCount += 8;
    }
    const code = buffer & ((1 << codeSize) - 1);
    buffer >>= codeSize;
    bitCount -= codeSize;
    return code;
  };

  while (true) {
    const code = readCode();
    if (code === -1 || code === endCode) break;
    if (code === clearCode) {
      dict = new Map();
      nextCode = endCode + 1;
      codeSize = minCodeSize + 1;
      prev = null;
      continue;
    }
    let entry: number[];
    if (dict.has(code)) {
      entry = dict.get(code)!;
      if (prev) dict.set(nextCode++, [...prev, entry[0]]);
    } else if (prev) {
      // "KwKwK" case: the first new code references the just-built sequence.
      if (code > nextCode) throw new Error("lzw");
      entry = [...prev, prev[0]];
      dict.set(nextCode++, entry);
    } else {
      if (code >= clearCode) throw new Error("lzw");
      entry = [code];
    }
    for (const v of entry) out.push(v);
    prev = entry;
    if (nextCode === 1 << codeSize && codeSize < 12) codeSize++;
  }
  return new Uint8Array(out);
}

function deinterlace(indices: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(indices.length);
  const passes: [number, number][] = [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ];
  let row = 0;
  for (const [start, step] of passes) {
    for (let y = start; y < h && row < h; y += step) {
      for (let x = 0; x < w; x++) out[y * w + x] = indices[row * w + x];
      row++;
    }
  }
  return out;
}

function parseGif(buf: Uint8Array): ParsedGif {
  if (buf.length < 14) throw new Error("notgif");
  const header = String.fromCharCode(buf[0], buf[1], buf[2], buf[3], buf[4], buf[5]);
  if (header !== "GIF87a" && header !== "GIF89a") throw new Error("notgif");
  let pos = 6;
  const width = readU16(buf, pos);
  pos += 2;
  const height = readU16(buf, pos);
  pos += 2;
  const packed = buf[pos++];
  const gctSize = packed & 0x80 ? 2 << (packed & 0x07) : 0;
  pos += 2; // background colour index + pixel aspect ratio
  let globalPalette: [number, number, number][] = [];
  if (gctSize > 0) {
    globalPalette = readPalette(buf, pos, gctSize);
    pos += gctSize * 3;
  }
  const frames: ParsedFrame[] = [];
  let delay = 100;
  let disposal = 0;
  let transparent: number | null = null;

  while (pos < buf.length) {
    const block = buf[pos++];
    if (block === 0x3b) break; // trailer
    if (block === 0x21) {
      const label = buf[pos++];
      if (label === 0xf9) {
        // Graphic Control Extension: [size][packed][delay lo][delay hi][transparent][terminator]
        pos += 1; // block size (4)
        const gce = buf[pos++];
        disposal = (gce >> 2) & 0x07;
        transparent = gce & 0x01 ? buf[pos + 2] : null;
        delay = Math.max(1, readU16(buf, pos)) * 10;
        pos += 4;
      } else {
        // Comment / plain text / application — skip sub-blocks.
        while (true) {
          const len = buf[pos++];
          if (len === 0) break;
          pos += len;
        }
      }
      continue;
    }
    if (block === 0x2c) {
      // Image Descriptor
      const left = readU16(buf, pos);
      const top = readU16(buf, pos + 2);
      const fw = readU16(buf, pos + 4);
      const fh = readU16(buf, pos + 6);
      const imgPacked = buf[pos + 8];
      pos += 9;
      let palette = globalPalette;
      if (imgPacked & 0x80) {
        const size = 2 << (imgPacked & 0x07);
        palette = readPalette(buf, pos, size);
        pos += size * 3;
      }
      const interlace = (imgPacked & 0x40) !== 0;
      if (pos >= buf.length) throw new Error("corrupt");
      const minCodeSize = buf[pos++];
      const chunks: number[] = [];
      while (true) {
        const len = buf[pos++];
        if (len === 0) break;
        for (let i = 0; i < len; i++) chunks.push(buf[pos + i]);
        pos += len;
      }
      let indices = lzwDecode(minCodeSize, new Uint8Array(chunks));
      if (indices.length < fw * fh) throw new Error("corrupt");
      indices = indices.slice(0, fw * fh);
      if (interlace) indices = deinterlace(indices, fw, fh);
      frames.push({ left, top, width: fw, height: fh, indices, palette, delay, disposal, transparent, interlace });
      delay = 100;
      disposal = 0;
      transparent = null;
      continue;
    }
    break; // Unknown block — stop parsing defensively.
  }
  if (frames.length === 0) throw new Error("noframes");
  return { width, height, frames };
}

function makeThumb(data: ImageData): string {
  const scale = Math.min(1, 80 / Math.max(data.width, data.height));
  const w = Math.max(1, Math.round(data.width * scale));
  const h = Math.max(1, Math.round(data.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const tmp = document.createElement("canvas");
  tmp.width = data.width;
  tmp.height = data.height;
  tmp.getContext("2d")?.putImageData(data, 0, 0);
  ctx.drawImage(tmp, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

/** Composits frames (handling disposal methods) into full-size ImageData snapshots. */
function composeFrames(gif: ParsedGif, nextId: () => number): RenderedFrame[] {
  const { width, height } = gif;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const out: RenderedFrame[] = [];
  let saved: ImageData | null = null;
  let prevDisposal = 0;
  let prevRect: { x: number; y: number; w: number; h: number } | null = null;

  for (const f of gif.frames) {
    if (prevDisposal === 2 && prevRect) ctx.clearRect(prevRect.x, prevRect.y, prevRect.w, prevRect.h);
    else if (prevDisposal === 3 && saved) ctx.putImageData(saved, 0, 0);

    if (f.disposal === 3) saved = ctx.getImageData(0, 0, width, height);

    const img = ctx.createImageData(f.width, f.height);
    for (let i = 0; i < f.width * f.height; i++) {
      const idx = f.indices[i];
      const pal = f.palette[idx] ?? [0, 0, 0];
      img.data[i * 4] = pal[0];
      img.data[i * 4 + 1] = pal[1];
      img.data[i * 4 + 2] = pal[2];
      img.data[i * 4 + 3] = f.transparent !== null && idx === f.transparent ? 0 : 255;
    }
    ctx.putImageData(img, f.left, f.top);
    const snap = ctx.getImageData(0, 0, width, height);
    out.push({ id: nextId(), data: snap, delay: f.delay, thumb: makeThumb(snap) });
    prevDisposal = f.disposal;
    prevRect = { x: f.left, y: f.top, w: f.width, h: f.height };
  }
  return out;
}

const SPEEDS = ["0.25", "0.5", "0.75", "1", "1.5", "2", "3", "4"];

export default function GifSplitter() {
  const { text: t } = useLanguage();
  const [frames, setFrames] = useState<RenderedFrame[]>([]);
  const [fileName, setFileName] = useState("");
  const [speed, setSpeed] = useToolState("gif-splitter:speed", "1");
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const idRef = useRef(0);
  const playRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (exportUrl) URL.revokeObjectURL(exportUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the current frame into the playback canvas.
  useEffect(() => {
    const canvas = playRef.current;
    if (!canvas || frames.length === 0) return;
    canvas.width = frames[0].data.width;
    canvas.height = frames[0].data.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = Math.min(playIndex, frames.length - 1);
    ctx.putImageData(frames[idx].data, 0, 0);
  }, [frames, playIndex]);

  // Playback loop.
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    let raf = 0;
    let last = performance.now();
    let idx = Math.min(playIndex, frames.length - 1);
    const mult = Number(speed) || 1;
    const tick = (now: number) => {
      const frame = frames[idx];
      if (frame && now - last >= Math.max(20, frame.delay * mult)) {
        idx = (idx + 1) % frames.length;
        last = now;
        setPlayIndex(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frames, speed]);

  function handleFile(file: File) {
    setError("");
    setFrames([]);
    setPlaying(false);
    setPlayIndex(0);
    setExportUrl(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onerror = () => setError(t("Could not read the file.", "មិនអាចអានឯកសារបានទេ។"));
    reader.onload = () => {
      try {
        const buf = new Uint8Array(reader.result as ArrayBuffer);
        const gif = parseGif(buf);
        const rendered = composeFrames(gif, () => idRef.current++);
        if (rendered.length === 0) {
          setError(t("No frames found in this GIF.", "រកមិនឃើញស៊ុមក្នុង GIF នេះទេ។"));
          return;
        }
        setFrames(rendered);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "notgif") {
          setError(t("This file is not a GIF.", "ឯកសារនេះមិនមែនជា GIF ទេ។"));
        } else {
          setError(t("Could not parse this GIF (it may be corrupted).", "មិនអាចញែក GIF នេះបានទេ (អាចខូច)។"));
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function removeFrame(id: number) {
    setFrames((prev) => prev.filter((f) => f.id !== id));
    setPlayIndex(0);
  }

  function resetAll() {
    setFrames([]);
    setFileName("");
    setExportUrl(null);
    setPlaying(false);
    setPlayIndex(0);
    setError("");
  }

  function exportGif() {
    if (frames.length === 0) return;
    setBusy(true);
    setError("");
    setExportUrl(null);
    try {
      const gif = new GIF({
        workers: 2,
        workerScript: "/gif.worker.js",
        width: frames[0].data.width,
        height: frames[0].data.height,
      });
      const mult = Number(speed) || 1;
      for (const f of frames) {
        gif.addFrame(f.data, { delay: Math.max(20, Math.round(f.delay * mult)) });
      }
      let done = false;
      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        setBusy(false);
        setError(t("The GIF encoding timed out.", "ការអ៊ិនកូដ GIF អស់ពេល។"));
      }, 30000);
      gif.on("finished", (blob: Blob) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        setExportUrl(URL.createObjectURL(blob));
        setBusy(false);
      });
      gif.render();
    } catch {
      setBusy(false);
      setError(t("Could not re-encode the GIF.", "មិនអាចបង្កើត GIF ឡើងវិញបានទេ។"));
    }
  }

  return (
    <ToolShell
      title="GIF Splitter / Speed Changer"
      khmerTitle="បំបែក GIF / ប្តូរល្បឿន"
      description="Decode a GIF in your browser: extract every frame with its own delay, drop frames, change playback speed, then re-encode a new GIF."
      descriptionKm="ញែក GIF នៅក្នុងកម្មវិធីរុករក៖ ដកស្រង់ស៊ុមនីមួយៗជាមួយពេលផ្ទាល់ខ្លួន លុបស៊ុម ប្តូរល្បឿន រួចបង្កើត GIF ថ្មីឡើងវិញ។"
    >
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/gif,.gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-8 text-center transition hover:border-[var(--gold)]/40"
        >
          <Upload size={28} className="text-[var(--ink-dim)]" />
          <span className="text-sm font-semibold text-[var(--ink)]">{t("Upload a GIF", "ផ្ទុក GIF ឡើង")}</span>
          <span className="text-xs text-[var(--ink-dim)]">{t("Decoded entirely in your browser — nothing is uploaded", "ញែកទាំងស្រុងក្នុងកម្មវិធីរុករក — គ្មានអ្វីត្រូវផ្ទុកឡើងទេ")}</span>
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {frames.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div>
                <div className="text-xs text-[var(--ink-dim)]">
                  {t("Frames", "ចំនួនស៊ុម")}: {frames.length} · {frames[0].data.width} × {frames[0].data.height} px
                </div>
              </div>
              <Button type="button" onClick={resetAll}>
                <RotateCcw size={14} className="mr-1.5 inline" />
                {t("Reset", "កំណត់ឡើងវិញ")}
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <canvas ref={playRef} className="mx-auto max-h-72 max-w-full" />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:opacity-90"
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />}
                  {playing ? t("Pause", "ផ្អាក") : t("Play", "ចាក់")}
                </button>
                <span className="font-mono-ui text-xs text-[var(--ink-dim)]">
                  {playIndex + 1} / {frames.length}
                </span>
              </div>
            </div>

            <Field label={t("Playback / export speed", "ល្បឿនចាក់ / នាំចេញ")}>
              <Select value={speed} onChange={(e) => setSpeed(e.target.value)}>
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>{s}×</option>
                ))}
              </Select>
            </Field>

            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Frame strip", "បន្ទះស៊ុម")}
              </div>
              <div className="flex flex-wrap gap-2">
                {frames.map((f, i) => (
                  <div key={f.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumb} alt={`${t("Frame", "ស៊ុម")} ${i + 1}`} className="h-20 w-20 rounded-md border border-[var(--ground-line)] object-contain" />
                    <div className="mt-0.5 text-center font-mono-ui text-[10px] text-[var(--ink-dim)]">{f.delay} ms</div>
                    <button
                      type="button"
                      onClick={() => removeFrame(f.id)}
                      aria-label={t("Remove frame", "លុបស៊ុម")}
                      className="absolute -right-1.5 -top-1.5 rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1 text-[var(--ink-dim)] transition hover:text-[var(--danger)]"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="button" onClick={exportGif} disabled={busy} className="w-full">
              <Download size={15} className="mr-1.5 inline" />
              {busy ? t("Encoding…", "កំពុងអ៊ិនកូដ…") : t("Re-encode GIF", "បង្កើត GIF ឡើងវិញ")}
            </Button>

            {exportUrl && (
              <a
                href={exportUrl}
                download="edited.gif"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:opacity-90"
              >
                <Download size={15} />
                {t("Download edited GIF", "ទាញយក GIF ដែលបានកែ")}
              </a>
            )}
          </>
        )}

        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
          <ul className="list-inside list-disc space-y-0.5">
            <li>
              {t("GIF decoder (LZW + frame compositing):", "កម្មវិធីញែក GIF (LZW + ការផ្សំស៊ុម):")}{" "}
              {t("original Tools123 implementation", "ការសរសេរដើមរបស់ Tools123")}
            </li>
            <li>
              GIF89a specification —{" "}
              <a className="underline" href="https://www.w3.org/Graphics/GIF/spec-gif89a.txt" target="_blank" rel="noreferrer">w3.org/Graphics/GIF</a>{" "}
              ({t("public specification", "លក្ខណៈបច្ចេកទេសសាធារណៈ")})
            </li>
            <li>
              {t("GIF encoder:", "កម្មវិធីអ៊ិនកូដ GIF:")}{" "}
              <a className="underline" href="https://github.com/jnordberg/gif.js" target="_blank" rel="noreferrer">gif.js</a>{" "}
              — Johan Nordberg ({t("MIT license", "អាជ្ញាប័ណ្ណ MIT")})
            </li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}

"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Hide a text payload in the RGB LSB of each pixel (1 bit per channel). */
function encode(canvas: HTMLCanvasElement, payload: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no context");
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  // Use a 4-byte length header + UTF-8 bytes.
  const bytes = new TextEncoder().encode(payload);
  const header = new Uint8Array(4);
  new DataView(header.buffer).setUint32(0, bytes.length, false);
  const all = new Uint8Array(4 + bytes.length);
  all.set(header, 0);
  all.set(bytes, 4);

  const totalBits = all.length * 8;
  const maxBits = Math.floor(data.length / 3);
  if (totalBits > maxBits) {
    throw new Error(`Payload too large for this image (fits ~${Math.floor(maxBits / 8)} bytes).`);
  }

  let bit = 0;
  for (let i = 0; i < data.length && bit < totalBits; i += 4) {
    // LSB of R, G, B (skip alpha at i+3).
    for (let ch = 0; ch < 3 && bit < totalBits; ch++) {
      const byteIndex = all[bit >> 3];
      const mask = 0x80 >> (bit & 7);
      const bitVal = (byteIndex & mask) !== 0 ? 1 : 0;
      data[i + ch] = (data[i + ch] & 0xfe) | bitVal;
      bit++;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Read the hidden payload back out of an image (returns null if none found). */
function decode(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  // Read the LSB stream: 1 bit per RGB channel, skipping alpha.
  const bits: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      bits.push(data[i + ch] & 1);
    }
  }

  // Read 32-bit length (MSB first), then the payload.
  let length = 0;
  for (let k = 0; k < 32; k++) {
    length = (length << 1) | bits[k];
  }
  if (length <= 0 || length > 100_000) return null;
  const payloadBits = bits.slice(32, 32 + length * 8);
  if (payloadBits.length < length * 8) return null;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | payloadBits[i * 8 + b];
    }
    bytes[i] = byte;
  }
  return new TextDecoder().decode(bytes);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("load failed"));
    im.src = src;
  });
}

export default function LsbSteganographyTool() {
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [payload, setPayload] = useState("Secret hidden message");
  const [mode, setMode] = useToolState<"encode" | "decode">("lsb-stego:mode", "encode");
  const [extracted, setExtracted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onFile(f: File | null) {
    if (!f) return;
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    setFile(f);
    setResultUrl(null);
    setExtracted("");
    setError("");
    setSrcUrl(URL.createObjectURL(f));
  }

  async function doEncode() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no context");
      ctx.drawImage(img, 0, 0);
      encode(canvas, payload);
      const blob = await canvasToBlob(canvas);
      if (blob) setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Encode failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doDecode() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no context");
      ctx.drawImage(img, 0, 0);
      const out = decode(canvas);
      setExtracted(out ?? "(no hidden message found)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decode failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Invisible Text Steganography"
      description="Hide a secret message inside an image's pixels (LSB steganography) or read one back. No file leaves your browser — it's invisible to the eye and survives saving as PNG."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>

      <Field label="Mode">
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setMode("encode")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "encode" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
          >
            Hide a message
          </button>
          <button
            type="button"
            onClick={() => setMode("decode")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "decode" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
          >
            Read a message
          </button>
        </div>
      </Field>

      {mode === "encode" ? (
        <>
          <Field label="Secret message">
            <TextArea value={payload} onChange={(e) => setPayload(e.target.value)} rows={4} />
          </Field>
          <Button onClick={doEncode} disabled={!file || busy || !payload}>
            {busy ? "Encoding…" : "Hide & preview PNG"}
          </Button>
          {resultUrl && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Result" className="max-h-72 w-full rounded-md border border-[var(--ground-line)] object-contain" />
              <a href={resultUrl} download="hidden.png" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download
              </a>
            </div>
          )}
        </>
      ) : (
        <>
          <Button onClick={doDecode} disabled={!file || busy}>{busy ? "Reading…" : "Read hidden message"}</Button>
          <Output label="Hidden message" value={extracted} mono={false} />
        </>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </ToolShell>
  );
}

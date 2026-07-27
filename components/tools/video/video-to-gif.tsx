"use client";
import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Settings {
  fps: number;
  width: number;
  quality: number; // 1 (best) .. 20 (worst) — gif.js scale
}

export default function VideoToGifTool() {
  const [s, setS] = useToolState<Settings>("video-to-gif", { fps: 10, width: 480, quality: 10 });
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [trim, setTrim] = useState({ start: 0, end: 1 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"start" | "end" | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setTrim({ start: 0, end: 1 });
    setResultUrl(null);
    setError(null);
  }

  function onBarPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = barRef.current!.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    dragRef.current = Math.abs(frac - trim.start) < Math.abs(frac - trim.end) ? "start" : "end";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e: PointerEvent) {
    if (!dragRef.current || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setTrim((prev) => {
      if (dragRef.current === "start") return { ...prev, start: Math.min(frac, prev.end - 0.01) };
      return { ...prev, end: Math.max(frac, prev.start + 0.01) };
    });
  }
  function onUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  async function build() {
    const video = videoRef.current;
    if (!video || !duration) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setProgress(0);
    try {
      const GIF = (await import("gif.js")).default;
      const startT = trim.start * duration;
      const endT = trim.end * duration;
      const scale = s.width / video.videoWidth;
      const w = s.width;
      const h = Math.round(video.videoHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      const gif = new GIF({ workers: 2, quality: s.quality, width: w, height: h, workerScript: "/gif.worker.js" });

      const frameCount = Math.max(1, Math.round((endT - startT) * s.fps));
      const delay = 1000 / s.fps;

      for (let i = 0; i < frameCount; i++) {
        const t = startT + i / s.fps;
        await new Promise<void>((resolve) => {
          const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
          video.addEventListener("seeked", onSeeked);
          video.currentTime = Math.min(t, endT);
        });
        ctx.drawImage(video, 0, 0, w, h);
        gif.addFrame(ctx, { copy: true, delay });
        setProgress(((i + 1) / frameCount) * 0.6);
      }

      gif.on("progress", (p: unknown) => setProgress(0.6 + (p as number) * 0.4));
      const blob: Blob = await new Promise((resolve) => {
        gif.on("finished", (b: Blob) => resolve(b));
        gif.render();
      });

      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError("Could not build the GIF — try a shorter clip or lower resolution.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  const fmt = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
  const estFrames = duration ? Math.max(1, Math.round((trim.end - trim.start) * duration * s.fps)) : 0;

  return (
    <ToolShell
      title="Video → GIF"
      description="Turn a clip of a video into a looping animated GIF — trim the range, pick a frame rate and size, and export. Rendered entirely in your browser."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose a video"}</span>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {fileUrl && (
        <>
          <video ref={videoRef} src={fileUrl} controls onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} className="max-h-72 w-full rounded-md border border-[var(--ground-line)]" />

          {duration > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--ink-dim)]">
                <span>Drag the handles to select the clip</span>
                <span className="text-[var(--ink-faint)]">{((trim.end - trim.start) * duration).toFixed(1)}s · ~{estFrames} frames</span>
              </div>
              <div ref={barRef} onPointerDown={onBarPointerDown} className="relative h-8 cursor-ew-resize rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
                <div className="absolute inset-y-0 bg-[var(--gold)]/25" style={{ left: `${trim.start * 100}%`, right: `${(1 - trim.end) * 100}%` }} />
                <div className="absolute inset-y-0 w-1 bg-[var(--gold)]" style={{ left: `${trim.start * 100}%` }} />
                <div className="absolute inset-y-0 w-1 bg-[var(--gold)]" style={{ left: `${trim.end * 100}%` }} />
              </div>
            </div>
          )}

          <Row>
            <Field label="Frame rate" hint={`${s.fps} fps`}>
              <input type="range" min={4} max={20} value={s.fps} onChange={(e) => update({ fps: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Width (px)">
              <Select value={s.width} onChange={(e) => update({ width: Number(e.target.value) })}>
                <option value={240}>240px</option>
                <option value={320}>320px</option>
                <option value={480}>480px</option>
                <option value={640}>640px</option>
              </Select>
            </Field>
          </Row>

          <Button onClick={build} disabled={busy || duration === 0}>
            {busy ? `Building… ${Math.round(progress * 100)}%` : "Build GIF"}
          </Button>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          {resultUrl && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Result GIF" className="max-h-72 w-full rounded-md border border-[var(--ground-line)] object-contain" />
              <a href={resultUrl} download="clip.gif" className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download GIF — {fmt(resultSize)}
              </a>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}

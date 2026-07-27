"use client";
import { useRef, useState } from "react";
import { Download, Scissors } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Settings {
  quality: "high" | "medium" | "low";
}

const BITRATES: Record<Settings["quality"], number> = { high: 8_000_000, medium: 4_000_000, low: 1_500_000 };

function pickMimeType() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

export default function VideoTrimmerTool() {
  const [s, setS] = useToolState<Settings>("video-trimmer", { quality: "high" });
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [trim, setTrim] = useState({ start: 0, end: 1 }); // fraction
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<"start" | "end" | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

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

  async function exportTrim() {
    const video = videoRef.current;
    if (!video || !duration) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setProgress(0);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const captureStream = (video as any).captureStream || (video as any).mozCaptureStream;
      if (!captureStream) throw new Error("Your browser doesn't support in-browser video capture.");
      const startT = trim.start * duration;
      const endT = trim.end * duration;

      video.muted = true;
      await new Promise<void>((resolve) => {
        const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = startT;
      });

      const stream: MediaStream = captureStream.call(video);
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATES[s.quality] });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const done = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

      recorder.start(250);
      await video.play();

      await new Promise<void>((resolve) => {
        const onTime = () => {
          setProgress(Math.min(1, (video.currentTime - startT) / (endT - startT)));
          if (video.currentTime >= endT) {
            video.removeEventListener("timeupdate", onTime);
            video.pause();
            resolve();
          }
        };
        video.addEventListener("timeupdate", onTime);
      });

      recorder.stop();
      await done;

      const blob = new Blob(chunks, { type: mimeType });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not trim this video.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  const fmt = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

  return (
    <ToolShell
      title="Video Trimmer"
      description="Cut a video down to the segment you need, right in your browser — no upload, re-encoded locally using your browser's native video pipeline and exported as WebM."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose a video"}</span>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {fileUrl && (
        <>
          <video
            ref={videoRef}
            src={fileUrl}
            controls
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            className="max-h-72 w-full rounded-md border border-[var(--ground-line)]"
          />

          {duration > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--ink-dim)]">
                <span>Drag the handles to trim</span>
                <span className="text-[var(--ink-faint)]">{((trim.end - trim.start) * duration).toFixed(1)}s of {duration.toFixed(1)}s</span>
              </div>
              <div ref={barRef} onPointerDown={onBarPointerDown} className="relative h-8 cursor-ew-resize rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
                <div className="absolute inset-y-0 bg-[var(--gold)]/25" style={{ left: `${trim.start * 100}%`, right: `${(1 - trim.end) * 100}%` }} />
                <div className="absolute inset-y-0 w-1 bg-[var(--gold)]" style={{ left: `${trim.start * 100}%` }} />
                <div className="absolute inset-y-0 w-1 bg-[var(--gold)]" style={{ left: `${trim.end * 100}%` }} />
              </div>
            </div>
          )}

          <Row>
            <Field label="Export quality">
              <Select value={s.quality} onChange={(e) => setS((prev) => ({ ...prev, quality: e.target.value as Settings["quality"] }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low (smaller file)</option>
              </Select>
            </Field>
          </Row>

          <Button onClick={exportTrim} disabled={busy || duration === 0}>
            <Scissors size={13} className="mr-1.5 inline" />
            {busy ? `Trimming… ${Math.round(progress * 100)}%` : "Trim & export"}
          </Button>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          {resultUrl && (
            <div className="space-y-2">
              <video src={resultUrl} controls className="max-h-72 w-full rounded-md border border-[var(--ground-line)]" />
              <a href={resultUrl} download="trimmed.webm" className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download WebM — {fmt(resultSize)}
              </a>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}

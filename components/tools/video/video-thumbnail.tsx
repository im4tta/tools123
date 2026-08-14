"use client";
import { useRef, useState } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

export default function VideoThumbnailTool() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(1);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setFileUrl(URL.createObjectURL(file));
    setThumbUrl(null);
    setDuration(null);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const target = Math.min(Math.max(0, timestamp), video.duration || timestamp);

    function onSeeked() {
      const ctx = canvas!.getContext("2d");
      if (!ctx || !video) return;
      canvas!.width = video.videoWidth;
      canvas!.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      setThumbUrl(canvas!.toDataURL("image/png"));
      video.removeEventListener("seeked", onSeeked);
    }
    video.addEventListener("seeked", onSeeked);
    video.currentTime = target;
  }

  return (
    <ToolShell
      title="Video Thumbnail Grabber"
      description="Pick a video file, choose a timestamp, and capture that frame as a downloadable PNG — all done locally in your browser."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{fileName ?? "Click to choose a video"}</span>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {fileUrl && (
        <video
          ref={videoRef}
          src={fileUrl}
          controls
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="max-h-64 w-full rounded-md border border-[var(--ground-line)]"
        />
      )}

      <Field label="Timestamp (seconds)" hint={duration ? `duration ≈ ${duration.toFixed(1)}s` : undefined}>
        <TextInput type="number" min={0} step={0.1} value={timestamp} onChange={(e) => setTimestamp(Number(e.target.value))} className="w-40" />
      </Field>

      <Button onClick={capture} disabled={!fileUrl}>
        Capture Frame
      </Button>

      <canvas ref={canvasRef} className="hidden" />

      {thumbUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbUrl} alt="Captured frame" className="max-h-64 rounded-md border border-[var(--ground-line)] object-contain" />
          <a
            href={thumbUrl}
            download="thumbnail.png"
            onClick={async (e) => {
              e.preventDefault();
              const watermarked = await watermarkImageDataUrl(thumbUrl, "image/png");
              const a = document.createElement("a");
              a.href = watermarked;
              a.download = "thumbnail.png";
              a.click();
              recordExport();
            }}
            className="mt-2 inline-block rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
          >
            Download PNG
          </a>
        </div>
      )}
    </ToolShell>
  );
}

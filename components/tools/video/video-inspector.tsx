"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoInspectorTool() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeLabel, setSizeLabel] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setSizeLabel(formatBytes(file.size));
    setMimeType(file.type || "unknown");
    setFileUrl(URL.createObjectURL(file));
    setSummary(null);
  }

  return (
    <ToolShell
      title="Video File Inspector"
      description="Check a video file's duration, resolution, frame aspect ratio, and file size before uploading it anywhere — read locally, nothing leaves your browser."
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
          src={fileUrl}
          controls
          className="max-h-64 w-full rounded-md border border-[var(--ground-line)]"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            const w = v.videoWidth;
            const h = v.videoHeight;
            const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
            const g = gcd(w, h) || 1;
            setSummary(
              [
                `File: ${fileName}`,
                `Size: ${sizeLabel}`,
                `Type: ${mimeType}`,
                `Duration: ${formatDuration(v.duration)}`,
                `Resolution: ${w} × ${h}`,
                `Aspect ratio: ${w / g}:${h / g}`,
              ].join("\n")
            );
          }}
        />
      )}
      {summary && <Output label="File info" value={summary} mono={false} />}
    </ToolShell>
  );
}

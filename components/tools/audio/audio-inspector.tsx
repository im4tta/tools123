"use client";
import { useRef, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

interface Info {
  fileName: string;
  sizeLabel: string;
  duration: string;
  sampleRate: number;
  channels: number;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return `${m}:${sec.padStart(5, "0")}`;
}

export default function AudioInspectorTool() {
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      setInfo({
        fileName: file.name,
        sizeLabel: formatBytes(file.size),
        duration: formatDuration(audioBuffer.duration),
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
      });

      const canvas = canvasRef.current;
      if (canvas) {
        const data = audioBuffer.getChannelData(0);
        const width = canvas.width;
        const height = canvas.height;
        const cctx = canvas.getContext("2d");
        if (cctx) {
          cctx.clearRect(0, 0, width, height);
          cctx.fillStyle = "rgba(201, 162, 75, 0.8)";
          const step = Math.max(1, Math.floor(data.length / width));
          for (let x = 0; x < width; x++) {
            let min = 1;
            let max = -1;
            for (let j = 0; j < step; j++) {
              const idx = x * step + j;
              if (idx >= data.length) break;
              const v = data[idx];
              if (v < min) min = v;
              if (v > max) max = v;
            }
            const y1 = ((1 - max) / 2) * height;
            const y2 = ((1 - min) / 2) * height;
            cctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
          }
        }
      }
      ctx.close();
    } finally {
      setBusy(false);
    }
  }

  const summary = info
    ? `File: ${info.fileName}\nSize: ${info.sizeLabel}\nDuration: ${info.duration}\nSample rate: ${info.sampleRate.toLocaleString()} Hz\nChannels: ${info.channels}`
    : "";

  return (
    <ToolShell
      title="Audio File Inspector"
      description="Drop in an audio file to see its duration, sample rate, and channel count, plus a quick waveform preview — decoded entirely in your browser."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{busy ? "Decoding…" : "Click to choose an audio file"}</span>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>
      <canvas ref={canvasRef} width={640} height={120} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]" />
      {info && <Output label="File info" value={summary} mono={false} />}
    </ToolShell>
  );
}

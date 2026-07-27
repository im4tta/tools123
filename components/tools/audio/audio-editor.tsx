"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Settings {
  fadeIn: number; // seconds
  fadeOut: number;
  gain: number; // 0..2
}

const initial: Settings = { fadeIn: 0, fadeOut: 0, gain: 1 };
const WAVE_W = 720;
const WAVE_H = 140;

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const arrBuf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrBuf);

  function writeStr(offset: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([arrBuf], { type: "audio/wav" });
}

export default function AudioEditorTool() {
  const [s, setS] = useToolState<Settings>("audio-editor", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));

  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [trim, setTrim] = useState({ start: 0, end: 1 }); // fraction of duration
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const dragRef = useRef<"start" | "end" | null>(null);

  function getCtx() {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  }

  async function handleFile(f: File) {
    setBusy(true);
    setResultUrl(null);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const audioBuffer = await getCtx().decodeAudioData(arrayBuffer);
      setFile(f);
      setBuffer(audioBuffer);
      setTrim({ start: 0, end: 1 });
    } finally {
      setBusy(false);
    }
  }

  // draw waveform + trim handles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, WAVE_W, WAVE_H);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / WAVE_W);
    ctx.fillStyle = "#3ea08c";
    for (let x = 0; x < WAVE_W; x++) {
      let min = 1;
      let max = -1;
      for (let i = 0; i < step; i++) {
        const idx = x * step + i;
        if (idx >= data.length) break;
        const v = data[idx];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = ((1 + min) / 2) * WAVE_H;
      const y2 = ((1 + max) / 2) * WAVE_H;
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }

    const sx = trim.start * WAVE_W;
    const ex = trim.end * WAVE_W;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, sx, WAVE_H);
    ctx.fillRect(ex, 0, WAVE_W - ex, WAVE_H);
    ctx.fillStyle = "#c9a24b";
    ctx.fillRect(sx - 1, 0, 2, WAVE_H);
    ctx.fillRect(ex - 1, 0, 2, WAVE_H);
  }, [buffer, trim]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    dragRef.current = Math.abs(frac - trim.start) < Math.abs(frac - trim.end) ? "start" : "end";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }
  function onPointerMove(e: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas || !dragRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setTrim((prev) => {
      if (dragRef.current === "start") return { ...prev, start: Math.min(frac, prev.end - 0.01) };
      return { ...prev, end: Math.max(frac, prev.start + 0.01) };
    });
  }
  function onPointerUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }

  function preview() {
    if (!buffer) return;
    const ctx = getCtx();
    sourceRef.current?.stop();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = s.gain;
    src.connect(gainNode).connect(ctx.destination);
    const startT = trim.start * buffer.duration;
    const durT = (trim.end - trim.start) * buffer.duration;
    src.start(0, startT, durT);
    src.onended = () => setPlaying(false);
    sourceRef.current = src;
    setPlaying(true);
  }
  function stopPreview() {
    sourceRef.current?.stop();
    setPlaying(false);
  }

  async function exportWav() {
    if (!buffer) return;
    setBusy(true);
    try {
      const startSample = Math.floor(trim.start * buffer.length);
      const endSample = Math.floor(trim.end * buffer.length);
      const len = Math.max(1, endSample - startSample);
      const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      const offline = new OfflineCtx(buffer.numberOfChannels, len, buffer.sampleRate);
      const trimmed = offline.createBuffer(buffer.numberOfChannels, len, buffer.sampleRate);
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        trimmed.getChannelData(c).set(buffer.getChannelData(c).subarray(startSample, endSample));
      }
      const src = offline.createBufferSource();
      src.buffer = trimmed;
      const gainNode = offline.createGain();
      const dur = len / buffer.sampleRate;
      gainNode.gain.setValueAtTime(0, 0);
      gainNode.gain.linearRampToValueAtTime(s.gain, Math.min(s.fadeIn, dur));
      gainNode.gain.setValueAtTime(s.gain, Math.max(0, dur - s.fadeOut));
      gainNode.gain.linearRampToValueAtTime(0, dur);
      if (s.fadeIn === 0 && s.fadeOut === 0) {
        gainNode.gain.cancelScheduledValues(0);
        gainNode.gain.setValueAtTime(s.gain, 0);
      }
      src.connect(gainNode).connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      const blob = encodeWav(rendered);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } finally {
      setBusy(false);
    }
  }

  const durationLabel = buffer ? `${((trim.end - trim.start) * buffer.duration).toFixed(2)}s of ${buffer.duration.toFixed(2)}s` : "";

  return (
    <ToolShell
      title="Audio Editor"
      description="Trim, fade, and adjust the volume of an audio clip, then export as WAV — decoded, edited, and re-encoded entirely in your browser. Accepts MP3, WAV, OGG, and M4A."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{busy && !buffer ? "Decoding…" : file ? file.name : "Click to choose an audio file"}</span>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {buffer && (
        <>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--ink-dim)]">
              <span>Drag the gold handles to trim</span>
              <span className="text-[var(--ink-faint)]">{durationLabel}</span>
            </div>
            <canvas
              ref={canvasRef}
              width={WAVE_W}
              height={WAVE_H}
              onPointerDown={onPointerDown}
              className="w-full cursor-ew-resize rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={playing ? stopPreview : preview} className="!px-3 !py-1.5">
              {playing ? <Pause size={13} className="mr-1 inline" /> : <Play size={13} className="mr-1 inline" />}
              {playing ? "Stop" : "Preview trim"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Fade in" hint={`${s.fadeIn.toFixed(1)}s`}>
              <input type="range" min={0} max={5} step={0.1} value={s.fadeIn} onChange={(e) => update({ fadeIn: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Fade out" hint={`${s.fadeOut.toFixed(1)}s`}>
              <input type="range" min={0} max={5} step={0.1} value={s.fadeOut} onChange={(e) => update({ fadeOut: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Gain" hint={`${Math.round(s.gain * 100)}%`}>
              <input type="range" min={0} max={2} step={0.05} value={s.gain} onChange={(e) => update({ gain: Number(e.target.value) })} className="w-full" />
            </Field>
          </div>

          <Button onClick={exportWav} disabled={busy}>{busy ? "Rendering…" : "Export WAV"}</Button>

          {resultUrl && (
            <div className="space-y-2">
              <audio controls src={resultUrl} className="w-full" />
              <a href={resultUrl} download="edited.wav" className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download WAV — {(resultSize / 1024 / 1024).toFixed(2)} MB
              </a>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}

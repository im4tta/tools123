"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, Music } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const WAVE_W = 900;
const WAVE_H = 190;

type Mode = "bars" | "wave" | "bars+wave" | "radial" | "rings";

// Preset gradient palettes (two-stop) for a modern look.
const THEMES = [
  { id: "neon", label: "Neon", a: "#00f0ff", b: "#ff00e0" },
  { id: "sunset", label: "Sunset", a: "#ff6a00", b: "#ff3d8b" },
  { id: "ocean", label: "Ocean", a: "#0ea5e9", b: "#22c55e" },
  { id: "matrix", label: "Matrix", a: "#22c55e", b: "#a3e635" },
  { id: "flame", label: "Flame", a: "#f97316", b: "#eab308" },
  { id: "ice", label: "Ice", a: "#38bdf8", b: "#a5b4fc" },
  { id: "mono", label: "Mono", a: "#e5e7eb", b: "#9ca3af" },
  // Cambodian places
  { id: "angkor", label: "Angkor", a: "#d4a94e", b: "#8a5a1f" },
  { id: "tonlesap", label: "Tonlé Sap", a: "#46b5cf", b: "#1c6ea4" },
  { id: "mekong", label: "Mekong", a: "#52b788", b: "#2a6e4f" },
  { id: "kohrong", label: "Koh Rong", a: "#2ec4b6", b: "#f2e6c8" },
  { id: "preahvihear", label: "Preah Vihear", a: "#9d8cd8", b: "#57487f" },
  { id: "kampot", label: "Kampot", a: "#d99a4e", b: "#7a4a12" },
  { id: "battambang", label: "Battambang", a: "#cf7a54", b: "#82432a" },
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// Interpolate a gradient in RGB space for two-colour bars.
function gradCss(t: number, a: [number, number, number], b: [number, number, number]): string {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

export default function AudioVisualizerPlayer() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const [mode, setMode] = useToolState<Mode>("avp:mode", "bars");
  const [themeId, setThemeId] = useToolState("avp:theme", "neon");
  const [glow, setGlow] = useToolState("avp:glow", true);
  const [animate, setAnimate] = useToolState("avp:animate", true); // animate the hue

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef(0);

  const theme = THEMES.find((x) => x.id === themeId) ?? THEMES[0];
  // Keep a ref of the latest theme/animate so the draw loop reads fresh values.
  const cfgRef = useRef({ mode, theme, glow, animate });
  useEffect(() => { cfgRef.current = { mode, theme, glow, animate }; }, [mode, theme, glow, animate]);

  function cleanup() { cancelAnimationFrame(rafRef.current); }

  useEffect(() => {
    if (!fileUrl) return;
    const audio = new Audio(fileUrl);
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    audio.muted = muted;
    audioRef.current = audio;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    const gain = ctx.createGain();
    gain.gain.value = muted ? 0 : volume;
    src.connect(analyser).connect(gain).connect(ctx.destination);
    analyserRef.current = analyser;
    gainRef.current = gain;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrent(audio.currentTime));
    audio.addEventListener("ended", () => setPlaying(false));

    return () => {
      cleanup();
      audio.pause();
      src.disconnect();
      analyser.disconnect();
      gain.disconnect();
      void ctx.close();
      audioRef.current = null;
      ctxRef.current = null;
      analyserRef.current = null;
      gainRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // Apply volume/mute live.
  useEffect(() => {
    if (audioRef.current) { audioRef.current.volume = volume; audioRef.current.muted = muted; }
    if (gainRef.current) gainRef.current.gain.value = muted ? 0 : volume;
  }, [volume, muted]);

  // Main animation loop.
  useEffect(() => {
    if (!playing) return;
    let raf = rafRef.current;
    const canvas = canvasRef.current;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cfg = cfgRef.current;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const a = hexToRgb(cfg.theme.a);
      const b = hexToRgb(cfg.theme.b);

      // Animate the palette by shifting the mix position over time.
      if (cfg.animate) hueRef.current = (hueRef.current + 0.004) % 1;
      const mixT = cfg.animate ? hueRef.current : 0.5;
      const aM: [number, number, number] = [lerp(a[0], b[0], mixT), lerp(a[1], b[1], mixT), lerp(a[2], b[2], mixT)];
      const bM: [number, number, number] = [lerp(b[0], a[0], mixT), lerp(b[1], a[1], mixT), lerp(b[2], a[2], mixT)];

      const col = (tt: number) => gradCss(tt, aM, bM);
      ctx.shadowBlur = cfg.glow ? 18 : 0;

      if (cfg.mode === "wave" || cfg.mode === "bars+wave") {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        ctx.lineWidth = 2.5;
        ctx.shadowColor = gradCss(0.5, aM, bM);
        ctx.strokeStyle = col(0.5);
        ctx.beginPath();
        const slice = W / data.length;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128;
          const y = (v * H) / 2;
          const x = i * slice;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (cfg.mode === "bars" || cfg.mode === "bars+wave") {
        const freq = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq);
        const bars = 72;
        const gap = 3;
        const bw = (W - gap * (bars - 1)) / bars;
        for (let i = 0; i < bars; i++) {
          const v = freq[Math.floor((i / bars) * freq.length * 0.9)] / 255;
          const bh = Math.max(2, v * (H * 0.92));
          const x = i * (bw + gap);
          const tt = i / bars;
          ctx.fillStyle = col(tt);
          ctx.shadowColor = col(tt);
          // Rounded-top bars.
          const r = Math.min(bw / 2, 4);
          ctx.beginPath();
          ctx.moveTo(x, H);
          ctx.lineTo(x, H - bh + r);
          ctx.quadraticCurveTo(x, H - bh, x + r, H - bh);
          ctx.lineTo(x + bw - r, H - bh);
          ctx.quadraticCurveTo(x + bw, H - bh, x + bw, H - bh + r);
          ctx.lineTo(x + bw, H);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (cfg.mode === "radial") {
        const freq = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq);
        const cx = W / 2, cy = H / 2;
        const radius = Math.min(W, H) * 0.26;
        const N = freq.length / 2;
        ctx.lineWidth = 3;
        for (let i = 0; i < N; i += 2) {
          const v = freq[i] / 255;
          const r = radius + v * radius * 0.9;
          const ang = (i / N) * Math.PI * 2;
          ctx.strokeStyle = col(i / N);
          ctx.shadowColor = col(i / N);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
          ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
          ctx.stroke();
        }
      }

      if (cfg.mode === "rings") {
        const freq = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq);
        const cx = W / 2, cy = H / 2;
        const rings = 8;
        for (let ring = 0; ring < rings; ring++) {
          const base = ring / rings;
          let energy = 0; let cnt = 0;
          const from = Math.floor(base * freq.length * 0.85);
          const to = Math.floor(((ring + 1) / rings) * freq.length * 0.85);
          for (let i = from; i < to; i++) { energy += freq[i]; cnt++; }
          const v = cnt ? (energy / cnt) / 255 : 0;
          const r = (base + 0.12) * (Math.min(W, H) * 0.46) + v * Math.min(W, H) * 0.12;
          ctx.lineWidth = 3 + v * 5;
          ctx.strokeStyle = col(base);
          ctx.shadowColor = col(base);
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(6, r), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
    };
    draw();
    return () => { cancelAnimationFrame(raf); rafRef.current = 0; };
  }, [playing]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { void audio.play(); setPlaying(true); }
  }
  function reset() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setCurrent(0);
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = frac * duration;
  }
  function onFile(f: File | null) {
    if (!f) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f);
    setDuration(0);
    setCurrent(0);
    setPlaying(false);
    setFileUrl(URL.createObjectURL(f));
  }

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <ToolShell
      title="Audio Visualizer Player"
      khmerTitle="អ្នកចាក់សំឡេងជាមួយរូបភាព"
      description="A modern audio player with live, animated visualizers — gradient spectrum bars, waveform, radial and rings — plus seek, volume, and glow effects. Everything stays in your browser."
      descriptionKm="អ្នកចាក់សំឡេងទំនើបដែលមានរូបភាពចលនាផ្ទាល់ — របារស្ពែកទ្រុមពណ៌ជម្រាល រលកសំឡេង រ៉ាឌីល និងរង្វង់ — ព្រមទាំងការស្វែងរកពេលវេលា កម្រិតសំឡេង និងពន្លឺ។ អ្វីៗស្ថិតក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-7 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <Music size={16} className="text-[var(--ink-faint)]" />
        <span>{file ? file.name : t("Click to choose an audio file", "ចុចដើម្បីជ្រើសរើសឯកសារសំឡេង")}</span>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <canvas ref={canvasRef} width={WAVE_W} height={WAVE_H} className="w-full rounded-md border border-[var(--ground-line)] bg-black/25" style={{ height: "auto", minHeight: 160 }} />

        {/* Seek bar */}
        <div className="group mt-3 cursor-pointer" onClick={seek} role="slider" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} tabIndex={0}>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--ground)]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.a}, ${theme.b})` }} />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-mono-ui text-sm text-[var(--ink-dim)]">{fmt(current)} / {fmt(duration)}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? t("Unmute", "បើកសំឡេង") : t("Mute", "បិទសំឡេង")} className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
              {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }} className="w-24" aria-label={t("Volume", "កម្រិតសំឡេង")} />
            <button type="button" onClick={togglePlay} disabled={!file} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)] disabled:opacity-40">
              {playing ? <Pause size={15} /> : <Play size={15} />}
              {playing ? t("Pause", "ឈប់") : t("Play", "ចាក់")}
            </button>
            <Button onClick={reset} disabled={!file}>
              <RotateCcw size={14} className="mr-1 inline" />
              {t("Reset", "កំណត់ឡើងវិញ")}
            </Button>
          </div>
        </div>
      </div>

      <Field label={t("Visualizer mode", "ប្រភេទរូបភាព")}>
        <div className="flex flex-wrap gap-2 pt-1">
          {(["bars", "wave", "bars+wave", "radial", "rings"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-md px-3 py-2 text-sm font-medium transition ${mode === m ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>
              {m === "bars" ? t("Bars", "របារ") : m === "wave" ? t("Waveform", "រលក") : m === "bars+wave" ? t("Bars + Wave", "របារ + រលក") : m === "radial" ? t("Radial", "រ៉ាឌីល") : t("Rings", "រង្វង់")}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("Color theme", "ពណ៌")}>
        <div className="flex flex-wrap gap-2 pt-1">
          {THEMES.map((x) => (
            <button key={x.id} type="button" onClick={() => setThemeId(x.id)} title={x.label} className={`h-8 w-12 rounded-md border-2 transition ${themeId === x.id ? "scale-105 border-[var(--gold)]" : "border-[var(--ground-line)]"}`} style={{ background: `linear-gradient(90deg, ${x.a}, ${x.b})` }} />
          ))}
        </div>
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
          <input type="checkbox" checked={glow} onChange={(e) => setGlow(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
          {t("Glow", "ពន្លឺ")}
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
          <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
          {t("Animate colors", "ចលនាពណ៌")}
        </label>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Decoding and rendering happen entirely in your browser via the Web Audio API — no upload, no file leaves your device.", "ការដោះស្រាយ និងបង្ហាញធ្វើឡើងទាំងស្រុងក្នុងកម្មវិធីរុករកតាម Web Audio API — គ្មានការបញ្ចូល និងគ្មានឯកសារចាកចេញពីឧបករណ៍របស់អ្នកឡើយ។")}
      </p>
    </ToolShell>
  );
}

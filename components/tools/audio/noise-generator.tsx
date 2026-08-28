"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, Square } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const RATE = 44100;

function encodeWavMono(data: Float32Array): Blob {
  const dataSize = data.length * 2;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([out], { type: "audio/wav" });
}

// White: uniform random samples. Pink: Paul Kellet's refined filter
// (public domain, https://www.firstpr.com.au/dsp/pink-noise/).
// Brown: integrated white noise, a standard DSP definition.
function generate(type: "white" | "pink" | "brown", seconds: number): Float32Array {
  const n = Math.max(1, Math.floor(seconds * RATE));
  const out = new Float32Array(n);
  if (type === "white") {
    for (let i = 0; i < n; i++) out[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < n; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      out[i] = last * 3.5;
    }
  }
  return out;
}

type NoiseType = "white" | "pink" | "brown";

export default function NoiseGeneratorTool() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState<NoiseType>("noise:type", "white");
  const [duration, setDuration] = useToolState("noise:duration", "5");
  const [volume, setVolume] = useToolState("noise:volume", "50");
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);
  const playIdRef = useRef(0);

  const seconds = Math.min(60, Math.max(1, Number(duration) || 5));
  const vol = Math.min(100, Math.max(0, Number(volume) || 0)) / 100;

  function getCtx() {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  }

  function play() {
    const ctx = getCtx();
    if (ctx.state === "suspended") void ctx.resume();
    const old = sourceRef.current;
    if (old) {
      playIdRef.current++; // invalidate the old source's onended
      try {
        old.stop();
      } catch {
        /* already stopped */
      }
    }
    const data = generate(type, seconds);
    const buffer = ctx.createBuffer(1, data.length, RATE);
    buffer.getChannelData(0).set(data);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain).connect(ctx.destination);
    const myId = ++playIdRef.current;
    src.onended = () => {
      if (playIdRef.current !== myId) return;
      setPlaying(false);
      offsetRef.current = 0;
      setPos(0);
    };
    src.start(0, Math.min(offsetRef.current, seconds - 0.01));
    sourceRef.current = src;
    gainRef.current = gain;
    startedAtRef.current = ctx.currentTime;
    setPlaying(true);
  }

  function pause() {
    if (!sourceRef.current) return;
    playIdRef.current++;
    offsetRef.current = Math.min(seconds, offsetRef.current + (ctxRef.current?.currentTime ?? 0) - startedAtRef.current);
    try {
      sourceRef.current.stop();
    } catch {
      /* noop */
    }
    sourceRef.current = null;
    setPlaying(false);
  }

  function stop() {
    pause();
    offsetRef.current = 0;
    setPos(0);
  }

  function download() {
    const blob = encodeWavMono(generate(type, seconds));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-noise.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Volume is adjustable live while playing.
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = vol;
  }, [vol]);

  // Position ticker while playing.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPos(Math.min(seconds, offsetRef.current + (ctxRef.current?.currentTime ?? 0) - startedAtRef.current));
    }, 200);
    return () => clearInterval(id);
  }, [playing, seconds]);

  useEffect(
    () => () => {
      playIdRef.current++;
      try {
        sourceRef.current?.stop();
      } catch {
        /* noop */
      }
      void ctxRef.current?.close();
    },
    []
  );

  return (
    <ToolShell
      title="Noise Generator"
      khmerTitle="បង្កើតសំឡេង Noise"
      description="Generate white, pink, or brown noise with a chosen duration and volume, play it back, and download it as a WAV file — all in your browser."
      descriptionKm="បង្កើតសំឡេង white, pink ឬ brown noise ជាមួយរយៈពេល និងកម្រិតសំឡេងតាមជម្រើស ចាក់ស្តាប់ និងទាញយកជាឯកសារ WAV — ទាំងអស់ក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <Row>
        <Field label={t("Noise type", "ប្រភេទ Noise")}>
          <Select value={type} onChange={(e) => setType(e.target.value as NoiseType)}>
            <option value="white">{t("White noise", "សំឡេងស")}</option>
            <option value="pink">{t("Pink noise", "សំឡេងផ្កាឈូក")}</option>
            <option value="brown">{t("Brown noise", "សំឡេងត្នោត")}</option>
          </Select>
        </Field>
        <Field label={t("Duration (seconds)", "រយៈពេល (វិនាទី)")} hint={`${seconds}s`}>
          <input type="range" min={1} max={60} step={1} value={seconds} onChange={(e) => setDuration(e.target.value)} className="w-full" />
        </Field>
        <Field label={t("Volume", "កម្រិតសំឡេង")} hint={`${Math.round(vol * 100)}%`}>
          <input type="range" min={0} max={100} step={1} value={volume} onChange={(e) => setVolume(e.target.value)} className="w-full" />
        </Field>
      </Row>

      <div className="flex flex-wrap items-center gap-2">
        {playing ? (
          <Button type="button" onClick={pause}>
            <Pause size={15} className="mr-1 inline" />
            {t("Pause", "ផ្អាក")}
          </Button>
        ) : (
          <Button type="button" onClick={play}>
            <Play size={15} className="mr-1 inline" />
            {t("Play", "លេង")}
          </Button>
        )}
        <button
          type="button"
          onClick={stop}
          className="flex items-center rounded-md border border-[var(--ground-line)] px-4 py-2 text-sm font-medium text-[var(--ink-dim)] hover:bg-[var(--ground-raised)]"
        >
          <Square size={13} className="mr-1 inline" />
          {t("Stop", "បញ្ឈប់")}
        </button>
        <Button type="button" onClick={download}>
          <Download size={15} className="mr-1 inline" />
          {t("Download WAV", "ទាញយក WAV")}
        </Button>
      </div>

      {playing && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
          <div className="h-full rounded-full bg-[var(--gold)] transition-[width]" style={{ width: `${(pos / seconds) * 100}%` }} />
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Noise is generated locally in your browser — nothing is uploaded. Pink noise uses Paul Kellet's refined filter (public domain, firstpr.com.au/dsp/pink-noise); brown noise is integrated white noise. WAV output is mono PCM 16-bit at 44.1 kHz.",
          "សំឡេង noise ត្រូវបានបង្កើតក្នុងកម្មវិធីរុករករបស់អ្នក — គ្មានអ្វីត្រូវបានផ្ទុកឡើយ។ Pink noise ប្រើក្បួនចម្រោះរបស់ Paul Kellet (public domain, firstpr.com.au/dsp/pink-noise); brown noise គឺជា white noise ដែលបញ្ចូលគ្នា។ ទិន្នផល WAV ជា mono PCM 16-bit នៅ 44.1 kHz។"
        )}
      </p>
    </ToolShell>
  );
}

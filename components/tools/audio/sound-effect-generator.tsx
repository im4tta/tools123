"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Play, Square } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Simple attack/release gain envelope, fully silent outside [t0, t0 + dur]. */
function env(ctx: BaseAudioContext, t0: number, dur: number, peak: number): GainNode {
  const g = ctx.createGain();
  const p = Math.max(0.0002, peak);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(p, t0 + 0.01);
  g.gain.setValueAtTime(p, Math.max(t0 + 0.01, t0 + dur - 0.04));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);
  return g;
}

/** Schedules one synthesized effect into an offline context (also used live). */
function scheduleEffect(
  ctx: BaseAudioContext,
  out: AudioNode,
  type: string,
  start: number,
  end: number,
  dur: number
) {
  const t0 = 0.02;
  switch (type) {
    case "sweep-up":
    case "sweep-down": {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const from = type === "sweep-up" ? start : end;
      const to = type === "sweep-up" ? end : start;
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
      const g = env(ctx, t0, dur, 0.9);
      osc.connect(g);
      g.connect(out);
      osc.start(t0);
      osc.stop(t0 + dur + 0.08);
      break;
    }
    case "siren": {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime((start + end) / 2, t0);
      const lfo = ctx.createOscillator();
      lfo.type = "triangle";
      lfo.frequency.value = clamp(4 / Math.max(0.5, dur), 0.2, 8);
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = Math.max(1, (end - start) / 2);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      const g = env(ctx, t0, dur, 0.7);
      osc.connect(g);
      g.connect(out);
      osc.start(t0);
      lfo.start(t0);
      osc.stop(t0 + dur + 0.08);
      lfo.stop(t0 + dur + 0.08);
      break;
    }
    case "chirp": {
      const burst = 0.09;
      const count = Math.max(1, Math.round(dur / burst));
      for (let i = 0; i < count; i++) {
        const bt = t0 + i * burst;
        const f0 = start + ((end - start) * i) / count;
        const f1 = start + ((end - start) * (i + 1)) / count;
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(f0, bt);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), bt + burst * 0.7);
        const g = env(ctx, bt, burst * 0.7, 0.35);
        osc.connect(g);
        g.connect(out);
        osc.start(bt);
        osc.stop(bt + burst * 0.75 + 0.05);
      }
      break;
    }
    case "laser": {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(start, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), t0 + dur);
      const trem = ctx.createOscillator();
      trem.frequency.value = 14;
      const tremDepth = ctx.createGain();
      tremDepth.gain.value = 0.25;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 0.75;
      const g = env(ctx, t0, dur, 0.9);
      trem.connect(tremDepth);
      tremDepth.connect(tremGain.gain);
      osc.connect(tremGain);
      tremGain.connect(g);
      g.connect(out);
      osc.start(t0);
      trem.start(t0);
      osc.stop(t0 + dur + 0.08);
      trem.stop(t0 + dur + 0.08);
      break;
    }
    case "phone-ring": {
      const tone = 0.4;
      const gap = 0.15;
      let tt = t0;
      let useStart = true;
      while (tt < t0 + dur) {
        const f = useStart ? start : end;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const trem = ctx.createOscillator();
        trem.frequency.value = 18;
        const tremDepth = ctx.createGain();
        tremDepth.gain.value = 0.3;
        const tremGain = ctx.createGain();
        tremGain.gain.value = 0.7;
        const g = env(ctx, tt, tone, 0.6);
        trem.connect(tremDepth);
        tremDepth.connect(tremGain.gain);
        osc.connect(tremGain);
        tremGain.connect(g);
        g.connect(out);
        osc.start(tt);
        trem.start(tt);
        osc.stop(tt + tone + 0.05);
        trem.stop(tt + tone + 0.05);
        tt += tone + gap;
        useStart = !useStart;
      }
      break;
    }
    case "alarm": {
      const on = 0.28;
      const off = 0.22;
      let tt = t0;
      let useStart = true;
      while (tt < t0 + dur) {
        const f = useStart ? start : end;
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = f;
        const g = env(ctx, tt, on, 0.5);
        osc.connect(g);
        g.connect(out);
        osc.start(tt);
        osc.stop(tt + on + 0.05);
        tt += on + off;
        useStart = !useStart;
      }
      break;
    }
  }
}

/** Encodes a rendered AudioBuffer as 16-bit PCM mono WAV. */
function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length;
  const sampleRate = buffer.sampleRate;
  const blockAlign = numCh * 2;
  const dataSize = len * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

export default function SoundEffectGenerator() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState("sfx:type", "sweep-up");
  const [startFreq, setStartFreq] = useToolState("sfx:start", "400");
  const [endFreq, setEndFreq] = useToolState("sfx:end", "1200");
  const [duration, setDuration] = useToolState("sfx:duration", "1.5");
  const [volume, setVolume] = useToolState<number>("sfx:volume", 0.6);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wavUrl, setWavUrl] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const wavUrlRef = useRef<string | null>(null);

  const stop = () => {
    srcRef.current?.stop();
    srcRef.current = null;
    setPlaying(false);
  };

  const playBuffer = (buf: AudioBuffer) => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    stop();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => setPlaying(false);
    src.start();
    srcRef.current = src;
    setPlaying(true);
  };

  const render = async (play: boolean) => {
    const dur = clamp(Number(duration) || 1, 0.2, 8);
    const start = clamp(Number(startFreq) || 440, 40, 12000);
    const end = clamp(Number(endFreq) || 880, 40, 12000);
    setBusy(true);
    setError(null);
    try {
      const ctx = new OfflineAudioContext(1, Math.ceil(44100 * (dur + 0.2)), 44100);
      const master = ctx.createGain();
      master.gain.value = clamp(volume, 0, 1);
      master.connect(ctx.destination);
      scheduleEffect(ctx, master, type, start, end, dur);
      const buf = await ctx.startRendering();
      bufferRef.current = buf;
      if (wavUrlRef.current) URL.revokeObjectURL(wavUrlRef.current);
      const url = URL.createObjectURL(encodeWav(buf));
      wavUrlRef.current = url;
      setWavUrl(url);
      if (play) playBuffer(buf);
    } catch {
      setError(t("Could not render this sound in your browser.", "មិនអាចបង្កើតសំឡេងនេះក្នុងកម្មវិធីរុករករបស់អ្នកបានទេ។"));
    } finally {
      setBusy(false);
    }
  };

  const onPlay = () => {
    if (playing) {
      stop();
      return;
    }
    if (bufferRef.current && !busy) {
      playBuffer(bufferRef.current);
      return;
    }
    void render(true);
  };

  useEffect(() => () => {
    srcRef.current?.stop();
    if (wavUrlRef.current) URL.revokeObjectURL(wavUrlRef.current);
    void ctxRef.current?.close();
  }, []);

  return (
    <ToolShell
      title="Sound Effect Generator"
      khmerTitle="បង្កើតបែបផែនសំឡេង"
      description="Synthesize classic sound effects — sweeps, sirens, chirps, lasers, phone rings and alarms — with the Web Audio API, then play or download them as WAV."
      descriptionKm="បង្កើតសំឡេងបែបផែនបុរាណ — ស្វីប ស៊ីរ៉ែន ឈីប ឡាស៊ែរ សំឡេងទូរស័ព្ទ និងសំឡេងរោទិ៍ — ជាមួយ Web Audio API រួចលេង ឬទាញយកជា WAV។"
    >
      <Row>
        <Field label={t("Effect", "បែបផែន")}>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="sweep-up">{t("Sweep up", "ស្វីបឡើង")}</option>
            <option value="sweep-down">{t("Sweep down", "ស្វីបចុះ")}</option>
            <option value="siren">{t("Siren", "ស៊ីរ៉ែន")}</option>
            <option value="chirp">{t("Chirp", "ឈីប")}</option>
            <option value="laser">{t("Laser", "ឡាស៊ែរ")}</option>
            <option value="phone-ring">{t("Phone ring", "សំឡេងទូរស័ព្ទ")}</option>
            <option value="alarm">{t("Alarm", "សំឡេងរោទិ៍")}</option>
          </Select>
        </Field>
        <Field label={t("Duration (s)", "រយៈពេល (វិនាទី)")}>
          <TextInput inputMode="decimal" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field label={t("Start frequency (Hz)", "ប្រេកង់ចាប់ផ្ដើម (Hz)")}>
          <TextInput inputMode="numeric" value={startFreq} onChange={(e) => setStartFreq(e.target.value)} />
        </Field>
        <Field label={t("End frequency (Hz)", "ប្រេកង់បញ្ចប់ (Hz)")}>
          <TextInput inputMode="numeric" value={endFreq} onChange={(e) => setEndFreq(e.target.value)} />
        </Field>
      </Row>

      <Field label={t("Volume", "កម្រិតសំឡេង")} hint={`${Math.round(volume * 100)}%`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onPlay} disabled={busy}>
          {playing ? (
            <>
              <Square size={15} className="mr-1 inline" />
              {t("Stop", "បញ្ឈប់")}
            </>
          ) : (
            <>
              <Play size={15} className="mr-1 inline" />
              {busy ? t("Rendering…", "កំពុងបង្កើត…") : t("Play sound", "លេងសំឡេង")}
            </>
          )}
        </Button>
        {wavUrl && (
          <a
            href={wavUrl}
            download="sound-effect.wav"
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:opacity-90"
          >
            <Download size={13} />
            {t("Download WAV", "ទាញយក WAV")}
          </a>
        )}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Sounds are synthesized entirely in your browser with the Web Audio API and rendered offline. The WAV download is 16-bit PCM mono at 44.1 kHz.",
          "សំឡេងត្រូវបានសំយោគទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នកជាមួយ Web Audio API ហើយបង្ហាញជា offline។ ឯកសារ WAV គឺ PCM mono ១៦-bit នៅ 44.1 kHz។"
        )}
      </p>
    </ToolShell>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Upload } from "lucide-react";
import { ToolShell, Field, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmt(s: number): string {
  const safe = Math.max(0, s);
  const m = Math.floor(safe / 60);
  return `${m}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

export default function TempoChangerTool() {
  const { text: t } = useLanguage();
  const [rate, setRate] = useToolState<number>("tempo:rate", 1);
  const [detune, setDetune] = useToolState<number>("tempo:detune", 0);
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);
  const playIdRef = useRef(0);
  const playingRef = useRef(false);

  function getCtx() {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  }

  function currentTime() {
    const ctx = ctxRef.current;
    if (!ctx) return offsetRef.current;
    return offsetRef.current + (ctx.currentTime - startedAtRef.current);
  }

  function playFrom(offset: number) {
    const ctx = ctxRef.current;
    const buf = bufferRef.current;
    if (!ctx || !buf) return;
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
    const clamped = Math.max(0, Math.min(offset, Math.max(0, buf.duration - 0.05)));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.detune.value = detune * 100;
    src.connect(ctx.destination);
    const myId = ++playIdRef.current;
    src.onended = () => {
      if (playIdRef.current !== myId) return;
      setPlaying(false);
      playingRef.current = false;
      offsetRef.current = 0;
      setPos(0);
    };
    src.start(0, clamped);
    sourceRef.current = src;
    startedAtRef.current = ctx.currentTime;
    offsetRef.current = clamped;
    playingRef.current = true;
    setPlaying(true);
  }

  function pausePlayback() {
    if (!sourceRef.current) return;
    playIdRef.current++;
    offsetRef.current = currentTime();
    try {
      sourceRef.current.stop();
    } catch {
      /* noop */
    }
    sourceRef.current = null;
    playingRef.current = false;
    setPlaying(false);
  }

  function stopPlayback() {
    pausePlayback();
    offsetRef.current = 0;
    setPos(0);
  }

  async function handleFile(f: File) {
    setBusy(true);
    setError(null);
    stopPlayback();
    try {
      const buf = await getCtx().decodeAudioData(await f.arrayBuffer());
      bufferRef.current = buf;
      setBuffer(buf);
      setFile(f);
      setPos(0);
    } catch {
      setError(t("Could not decode this audio file.", "មិនអាចបកស្រាយឯកសារសំឡេងនេះបានទេ។"));
    } finally {
      setBusy(false);
    }
  }

  // Rebuild the playing source when tempo or pitch changes (live update).
  useEffect(() => {
    if (playingRef.current && sourceRef.current) {
      playFrom(currentTime());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, detune]);

  // Position ticker while playing.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const buf = bufferRef.current;
      setPos(buf ? Math.min(buf.duration, currentTime()) : 0);
    }, 200);
    return () => clearInterval(id);
  }, [playing]);

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
      title="Tempo & Pitch Changer"
      khmerTitle="ប្តូរចង្វាក់ និងកម្រិតសំឡេង"
      description="Load an audio file and play it with a different tempo (0.5x–2x) and pitch (up to ±12 semitones) using the Web Audio API — locally, no upload."
      descriptionKm="ផ្ទុកឯកសារសំឡេង ហើយចាក់ជាមួយចង្វាក់ផ្សេង (0.5x–2x) និងកម្រិតសំឡេងផ្សេង (រហូតដល់ ±12 semitone) ដោយប្រើ Web Audio API — ធ្វើក្នុងកម្មវិធីរុករក គ្មានការផ្ទុកឡើយ។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
        <span className="flex items-center gap-2">
          <Upload size={15} />
          {busy && !buffer ? t("Decoding…", "កំពុងបកស្រាយ…") : file ? file.name : t("Click to choose an audio file", "ចុចដើម្បីជ្រើសរើសឯកសារសំឡេង")}
        </span>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {buffer && (
        <>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--ink-dim)]">
              <span>{t("Position", "ទីតាំង")}</span>
              <span className="font-mono-ui">
                {fmt(pos)} / {fmt(buffer.duration)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-[width]"
                style={{ width: `${buffer.duration ? (pos / buffer.duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {playing ? (
              <Button type="button" onClick={pausePlayback}>
                <Pause size={15} className="mr-1 inline" />
                {t("Pause", "ផ្អាក")}
              </Button>
            ) : (
              <Button type="button" onClick={() => playFrom(offsetRef.current)}>
                <Play size={15} className="mr-1 inline" />
                {t("Play", "លេង")}
              </Button>
            )}
            <button
              type="button"
              onClick={stopPlayback}
              className="flex items-center rounded-md border border-[var(--ground-line)] px-4 py-2 text-sm font-medium text-[var(--ink-dim)] hover:bg-[var(--ground-raised)]"
            >
              <Square size={13} className="mr-1 inline" />
              {t("Stop", "បញ្ឈប់")}
            </button>
          </div>

          <Row>
            <Field label={t("Tempo (playback rate)", "ចង្វាក់ (ល្បឿនចាក់)")} hint={`${rate.toFixed(2)}x`}>
              <input type="range" min={0.5} max={2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full" />
            </Field>
            <Field label={t("Pitch (detune)", "កម្រិតសំឡេង (detune)")} hint={`${detune > 0 ? "+" : ""}${detune} st`}>
              <input type="range" min={-12} max={12} step={1} value={detune} onChange={(e) => setDetune(Number(e.target.value))} className="w-full" />
            </Field>
          </Row>

          <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)]">
            <span className="font-semibold">{t("Note:", "ចំណាំ៖")}</span>{" "}
            {t(
              "Changing the playback rate changes tempo and pitch together — this is not a time-stretch effect, so speeding up raises the pitch and slowing down lowers it. There is no quality guarantee for independent tempo/pitch control.",
              "ការផ្លាស់ប្តូរល្បឿនចាក់ធ្វើឱ្យចង្វាក់ និងកម្រិតសំឡេងផ្លាស់ប្តូរជាមួយគ្នា — នេះមិនមែនជាប្រសិទ្ធិភាព time-stretch ទេ ដូច្នេះការបង្កើនល្បឿនធ្វើឱ្យសំឡេងខ្ពស់ ហើយការបន្ថយល្បឿនធ្វើឱ្យសំឡេងទាប។ គ្មានការធានាគុណភាពសម្រាប់ការគ្រប់គ្រងចង្វាក់ និងកម្រិតសំឡេងដោយឡែកពីគ្នាទេ។"
            )}
          </p>

          <p className="text-[11px] leading-relaxed text-[var(--ink-dim)]">
            {t("Only your audio file is used, locally in the browser — nothing is uploaded.", "មានតែឯកសារសំឡេងរបស់អ្នកប៉ុណ្ណោះដែលត្រូវបានប្រើ ក្នុងកម្មវិធីរុករក — គ្មានអ្វីត្រូវបានផ្ទុកឡើយ។")}
          </p>
        </>
      )}
    </ToolShell>
  );
}

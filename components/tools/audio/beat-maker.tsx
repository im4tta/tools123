"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type TrackId = "kick" | "snare" | "hat" | "clap" | "bass";

const STEPS = 16;

const TRACKS: { id: TrackId; label: string; labelKm: string }[] = [
  { id: "kick", label: "Kick", labelKm: "កិក" },
  { id: "snare", label: "Snare", labelKm: "ស្នែរ" },
  { id: "hat", label: "Hi-hat", labelKm: "ហាយហាត" },
  { id: "clap", label: "Clap", labelKm: "ទះដៃ" },
  { id: "bass", label: "Bass", labelKm: "បាស" },
];

type Pattern = boolean[][];

const patternFrom = (rows: number[][]): Pattern =>
  rows.map((row) => {
    const steps = Array<boolean>(STEPS).fill(false);
    for (const s of row) steps[s] = true;
    return steps;
  });

const PRESETS: Record<string, Pattern> = {
  house: patternFrom([
    [0, 4, 8, 12],
    [4, 12],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [8],
    [0, 3, 8, 11],
  ]),
  "hip-hop": patternFrom([
    [0, 7, 10],
    [4, 12],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [12],
    [0, 10],
  ]),
  techno: patternFrom([
    [0, 4, 8, 12],
    [8],
    [2, 6, 10, 14],
    [4, 12],
    [0, 2, 4, 6, 8, 10, 12, 14],
  ]),
  empty: patternFrom([[], [], [], [], []]),
};

export default function BeatMaker() {
  const { text: t } = useLanguage();
  const [bpm, setBpm] = useToolState("beat-maker:bpm", "120");
  const [preset, setPreset] = useToolState("beat-maker:preset", "house");
  const [pattern, setPattern] = useToolState<Pattern>("beat-maker:pattern", PRESETS.house);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const patternRef = useRef<Pattern>(pattern);
  const noiseRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  const getNoise = (ctx: AudioContext) => {
    if (!noiseRef.current) {
      noiseRef.current = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseRef.current.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseRef.current;
  };

  /** Short synthesized drum hit, scheduled at absolute time `t` (seconds). */
  const trigger = (id: TrackId, ctx: AudioContext, t: number) => {
    switch (id) {
      case "kick": {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.34);
        break;
      }
      case "snare": {
        const src = ctx.createBufferSource();
        src.buffer = getNoise(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1800;
        bp.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        src.connect(bp);
        bp.connect(g);
        g.connect(ctx.destination);
        src.start(t);
        src.stop(t + 0.18);
        break;
      }
      case "hat": {
        const src = ctx.createBufferSource();
        src.buffer = getNoise(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 7000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        src.connect(hp);
        hp.connect(g);
        g.connect(ctx.destination);
        src.start(t);
        src.stop(t + 0.08);
        break;
      }
      case "clap": {
        for (const off of [0, 0.015]) {
          const src = ctx.createBufferSource();
          src.buffer = getNoise(ctx);
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = 1200;
          bp.Q.value = 1.5;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + off);
          g.gain.exponentialRampToValueAtTime(0.4, t + off + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.18);
          src.connect(bp);
          bp.connect(g);
          g.connect(ctx.destination);
          src.start(t + off);
          src.stop(t + off + 0.2);
        }
        break;
      }
      case "bass": {
        const osc = ctx.createOscillator();
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 320;
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = 55;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(lp);
        lp.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);
        break;
      }
    }
  };

  const start = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    const b = Math.max(40, Math.min(240, Number(bpm) || 120));
    const stepDur = 60 / b / 4; // sixteenth notes
    stepRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.08;
    setRunning(true);
    timerRef.current = setInterval(() => {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;
      while (nextTimeRef.current < ctx.currentTime + 0.12) {
        const step = stepRef.current;
        TRACKS.forEach((track, ti) => {
          if (patternRef.current[ti]?.[step]) trigger(track.id, ctx, nextTimeRef.current);
        });
        setCurrentStep(step);
        stepRef.current = (stepRef.current + 1) % STEPS;
        nextTimeRef.current += stepDur;
      }
    }, 25);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setCurrentStep(-1);
  };

  const toggle = (ti: number, s: number) => {
    setPattern((prev) =>
      prev.map((row, ri) => (ri === ti ? row.map((on, si) => (si === s ? !on : on)) : row))
    );
  };

  const applyPreset = (id: string) => {
    setPreset(id);
    setPattern(PRESETS[id] ?? PRESETS.empty);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    void ctxRef.current?.close();
  }, []);

  return (
    <ToolShell
      title="Beat Maker / Step Sequencer"
      khmerTitle="ឧបករណ៍វាយចង្វាក់"
      description="Program a 16-step beat with five synthesized drum tracks, pick a pattern preset, and play it live in your browser with the Web Audio API."
      descriptionKm="រៀបចំចង្វាក់ ១៦ ជំហានជាមួយស្គរសំយោគ ៥ បទ ជ្រើសរើសគំរូចង្វាក់ រួចលេងផ្ទាល់ក្នុងកម្មវិធីរុករករបស់អ្នកជាមួយ Web Audio API។"
    >
      <Row>
        <Field label={t("Tempo (BPM)", "ចង្វាក់ (BPM)")}>
          <TextInput inputMode="numeric" value={bpm} onChange={(e) => setBpm(e.target.value)} />
        </Field>
        <Field label={t("Pattern preset", "គំរូចង្វាក់")}>
          <Select value={preset} onChange={(e) => applyPreset(e.target.value)}>
            <option value="house">{t("House", "ហាវស៍")}</option>
            <option value="hip-hop">{t("Hip-hop", "ហ៊ីបហប")}</option>
            <option value="techno">{t("Techno", "តិចណូ")}</option>
            <option value="empty">{t("Empty", "ទទេ")}</option>
          </Select>
        </Field>
      </Row>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        <div className="grid min-w-[460px] grid-cols-[auto_repeat(16,minmax(0,1fr))] gap-1">
          <div />
          {Array.from({ length: STEPS }, (_, s) => (
            <div key={s} className="pb-1 text-center text-[10px] text-[var(--ink-dim)]">
              {s + 1}
            </div>
          ))}
          {TRACKS.map((track, ti) => {
            const row = pattern[ti] ?? Array<boolean>(STEPS).fill(false);
            return (
              <Fragment key={track.id}>
                <div className="flex items-center pr-2 text-xs font-medium text-[var(--ink-dim)]">
                  {t(track.label, track.labelKm)}
                </div>
                {row.map((on, s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    aria-label={t(`${track.label} step ${s + 1}`, `ជំហានទី ${s + 1} ${track.labelKm}`)}
                    onClick={() => toggle(ti, s)}
                    className={`aspect-square rounded-md transition ${
                      on
                        ? "bg-[var(--gold)]"
                        : currentStep === s
                          ? "bg-[var(--gold)]/20"
                          : "bg-[var(--ground-line)]/40 hover:bg-[var(--ground-line)]"
                    }`}
                  />
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>

      {running ? (
        <Button type="button" onClick={stop} className="w-full">
          <Square size={15} className="mr-1 inline" />
          {t("Stop", "បញ្ឈប់")}
        </Button>
      ) : (
        <Button type="button" onClick={start} className="w-full">
          <Play size={15} className="mr-1 inline" />
          {t("Play pattern", "លេងចង្វាក់")}
        </Button>
      )}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Every drum sound is synthesized in your browser with the Web Audio API — nothing is uploaded. While playing, the active step is highlighted.",
          "សំឡេងស្គរទាំងអស់ត្រូវបានសំយោគក្នុងកម្មវិធីរុករករបស់អ្នកជាមួយ Web Audio API — គ្មានអ្វីត្រូវបានផ្ទុកឡើងទេ។ ពេលកំពុងលេង ជំហានសកម្មត្រូវបានបន្លិច។"
        )}
      </p>
    </ToolShell>
  );
}

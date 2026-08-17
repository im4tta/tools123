"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { ToolShell, Field, Select, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function Metronome() {
  const { text: t } = useLanguage();
  const [bpm, setBpm] = useToolState("metronome:bpm", "100");
  const [beats, setBeats] = useToolState("metronome:beats", "4");
  const [running, setRunning] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRef = useRef(0);
  const beatRef = useRef(0);

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
  };

  const beep = (accent: boolean) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = accent ? 1200 : 800;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.4 : 0.25, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.06);
  };

  const start = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    const b = Math.max(20, Math.min(300, Number(bpm) || 100));
    const interval = 60000 / b;
    nextRef.current = ctx.currentTime + 0.05;
    beatRef.current = 0;
    setRunning(true);
    timerRef.current = setInterval(() => {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;
      while (nextRef.current < ctx.currentTime + 0.1) {
        beep(beatRef.current % Math.max(1, Number(beats) || 4) === 0);
        beatRef.current++;
        nextRef.current += interval / 1000;
      }
    }, 25);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    void ctxRef.current?.close();
  }, []);

  return (
    <ToolShell
      title="Metronome"
      khmerTitle="មេត្រូណូម"
      description="An audible metronome with adjustable tempo and time signature."
      descriptionKm="មេត្រូណូមស្ដាប់បាន ជាមួយការកែសម្រួលចង្វាក់ និងចង្វាក់គោះ។"
    >
      <Row>
        <Field label={t("Tempo (BPM)", "ចង្វាក់ (BPM)")}>
          <TextInput inputMode="numeric" value={bpm} onChange={(e) => setBpm(e.target.value)} />
        </Field>
        <Field label={t("Beats per bar", "គោះក្នុងមួយបទ")}>
          <Select value={beats} onChange={(e) => setBeats(e.target.value)}>
            <option value="2">2/4</option>
            <option value="3">3/4</option>
            <option value="4">4/4</option>
            <option value="6">6/8</option>
          </Select>
        </Field>
      </Row>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
        <div className="font-display text-5xl font-semibold text-[var(--ink)]">{bpm || "100"}</div>
        <div className="mt-1 text-sm text-[var(--ink-dim)]">BPM · {beats}/{beats === "6" ? "8" : "4"}</div>
      </div>
      {running ? (
        <Button type="button" onClick={stop} className="w-full">
          <Square size={15} className="mr-1 inline" />
          {t("Stop", "បញ្ឈប់")}
        </Button>
      ) : (
        <Button type="button" onClick={start} className="w-full">
          <Play size={15} className="mr-1 inline" />
          {t("Start", "ចាប់ផ្ដើម")}
        </Button>
      )}
    </ToolShell>
  );
}
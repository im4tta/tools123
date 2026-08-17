"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { ToolShell, Field, TextInput, Row, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function ToneGenerator() {
  const { text: t } = useLanguage();
  const [freq, setFreq] = useToolState("tone:freq", "440");
  const [wave, setWave] = useToolState("tone:wave", "sine");
  const [running, setRunning] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const start = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    const f = Math.max(20, Math.min(20000, Number(freq) || 440));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave as OscillatorType;
    osc.frequency.value = f;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    setRunning(true);
  };

  const stop = () => {
    oscRef.current?.stop();
    oscRef.current = null;
    gainRef.current = null;
    setRunning(false);
  };

  useEffect(() => {
    if (running && oscRef.current) {
      oscRef.current.frequency.value = Math.max(20, Math.min(20000, Number(freq) || 440));
      oscRef.current.type = wave as OscillatorType;
    }
  }, [freq, wave, running]);

  useEffect(() => () => {
    oscRef.current?.stop();
    void ctxRef.current?.close();
  }, []);

  return (
    <ToolShell
      title="Tone Generator"
      khmerTitle="បង្កើតសម្លេង"
      description="Generate a continuous audio tone for tuning, testing, or sound reference."
      descriptionKm="បង្កើតសម្លេងបន្តសម្រាប់ការលៃសំរួល សាកល្បង ឬជាឯកសារយោងសម្លេង។"
    >
      <Row>
        <Field label={t("Frequency (Hz)", "ប្រេកង់ (Hz)")}>
          <TextInput inputMode="numeric" value={freq} onChange={(e) => setFreq(e.target.value)} />
        </Field>
        <Field label={t("Waveform", "រលកសម្លេង")}>
          <Select value={wave} onChange={(e) => setWave(e.target.value)}>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
          </Select>
        </Field>
      </Row>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
        <div className="font-display text-5xl font-semibold text-[var(--ink)]">{freq || "440"}</div>
        <div className="mt-1 text-sm text-[var(--ink-dim)]">Hz</div>
      </div>
      {running ? (
        <Button type="button" onClick={stop} className="w-full">
          <Square size={15} className="mr-1 inline" />
          {t("Stop", "បញ្ឈប់")}
        </Button>
      ) : (
        <Button type="button" onClick={start} className="w-full">
          <Play size={15} className="mr-1 inline" />
          {t("Play", "លេង")}
        </Button>
      )}
    </ToolShell>
  );
}
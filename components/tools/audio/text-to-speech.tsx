"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function TextToSpeech() {
  const { text: t } = useLanguage();
  const [text, setText] = useToolState("text-to-speech:text", "Hello! Welcome to 123 Toolbox.");
  const [voiceUri, setVoiceUri] = useToolState("text-to-speech:voice", "");
  const [rate, setRate] = useToolState("text-to-speech:rate", 1);
  const [pitch, setPitch] = useToolState("text-to-speech:pitch", 1);
  const [volume, setVolume] = useToolState("text-to-speech:volume", 100);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(false);
      return;
    }
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  function speak() {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === voiceUri);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume / 100;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <ToolShell
      title="Text to Speech"
      khmerTitle="អត្ថបទទៅជាសំឡេង"
      description="Read any text aloud using your browser's built-in voices, with rate, pitch, and volume controls."
      descriptionKm="អានអត្ថបទជាសំឡេងដោយប្រើសំឡេងក្នុងកម្មវិធីរុករក ព្រមទាំងគ្រប់គ្រងល្បឿន តុរឹង និងកម្រិតសំឡេង។"
    >
      <div className="space-y-4">
        {!supported && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--ink-dim)]">
            {t("Speech synthesis is not available in this browser.", "ការបង្កើតសំឡេងមិនមានក្នុងកម្មវិធីរុករកនេះទេ។")}
          </p>
        )}

        <Field label={t("Text to speak", "អត្ថបទត្រូវអាន")}>
          <TextArea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>

        <Field label={t("Voice", "សំឡេង")} hint={t("Khmer voices appear here if installed", "សំឡេងខ្មែរនឹងបង្ហាញ បើមានដំឡើង")}>
          <select value={voiceUri} onChange={(e) => setVoiceUri(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
            <option value="">{t("System default", "លំនាំដើមប្រព័ន្ធ")}</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}){v.localService ? "" : " · " + t("online", "អនឡាញ")}
              </option>
            ))}
          </select>
        </Field>

        {([
          ["Rate (0.5–2)", "ល្បឿន (០.៥–២)", rate, setRate, 0.5, 2, 0.1],
          ["Pitch (0–2)", "តុរឹង (០–២)", pitch, setPitch, 0, 2, 0.1],
          ["Volume (%)", "កម្រិតសំឡេង (%)", volume, setVolume, 0, 100, 5],
        ] as [string, string, number, (v: number) => void, number, number, number][]).map(([en, km, value, onChange, min, max, step]) => (
          <div key={en}>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--ink-dim)]">
              <span>{t(en, km)}</span>
              <span className="font-mono-ui text-[var(--ink)]">{value}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 w-full cursor-pointer accent-[var(--gold)]" />
          </div>
        ))}

        <div className="flex gap-2">
          {!speaking ? (
            <button type="button" onClick={speak} disabled={!supported || !text.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
              <Volume2 size={16} />{t("Speak", "អានជាសំឡេង")}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => window.speechSynthesis.pause()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--ground-line)] px-5 py-3 text-sm font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
                <Pause size={16} />{t("Pause", "ផ្អាក")}
              </button>
              <button type="button" onClick={() => window.speechSynthesis.resume()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--ground-line)] px-5 py-3 text-sm font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
                <Play size={16} />{t("Resume", "បន្ត")}
              </button>
              <button type="button" onClick={stop} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--danger)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                <Square size={16} />{t("Stop", "បញ្ឈប់")}
              </button>
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
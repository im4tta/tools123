"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Trash2 } from "lucide-react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

const LANGS = [
  ["en-US", "English (US)"],
  ["km-KH", "ខ្មែរ (Khmer)"],
  ["vi-VN", "Tiếng Việt"],
  ["th-TH", "ไทย (Thai)"],
  ["zh-CN", "中文 (简体)"],
  ["ja-JP", "日本語"],
  ["ko-KR", "한국어"],
  ["fr-FR", "Français"],
] as const;

export default function VoiceDictation() {
  const { text: t } = useLanguage();
  const [text, setText] = useToolState("voice-dictation:text", "");
  const [lang, setLang] = useToolState("voice-dictation:lang", "en-US");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");

  const supported = typeof window !== "undefined" && Boolean((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition);

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    setInterim("");
  }

  function start() {
    setError("");
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as RecognitionCtor | undefined;
    if (!Ctor) {
      setError(t("Speech recognition is not available in this browser. Try Chrome or Edge.", "ការសម្គាល់សំឡេងមិនមានក្នុងកម្មវិធីរុករកនេះទេ។ សូមសាកល្បង Chrome ឬ Edge។"));
      return;
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = text ? text + " " : "";
    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) finalRef.current += transcript.trim() + " ";
        else interimText += transcript;
      }
      setText((finalRef.current + interimText).replace(/\s+/g, " ").trimStart());
      setInterim(interimText);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError(t("Microphone permission was denied.", "ការអនុញ្ញាតមីក្រូហ្វូនត្រូវបានបដិសេធ។"));
        stop();
      } else if (event.error === "no-speech") {
        setError(t("No speech detected — try again.", "រកមិនឃើញសំឡេង — សូមព្យាយាមម្តងទៀត។"));
      }
    };
    rec.onend = () => {
      if (recRef.current === rec) {
        // auto-restart while the user keeps dictation on
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError(t("Could not start listening.", "មិនអាចចាប់ផ្តើមស្តាប់បានទេ។"));
    }
  }

  useEffect(() => () => recRef.current?.stop(), []);

  return (
    <ToolShell
      title="Voice Dictation"
      khmerTitle="សរសេរដោយសំឡេង"
      description="Dictate text with your voice using the browser's speech recognition — supports Khmer where available."
      descriptionKm="សរសេរអត្ថបទដោយសំឡេងរបស់អ្នក តាមការសម្គាល់សំឡេងរបស់កម្មវិធីរុករក — គាំទ្រភាសាខ្មែរ បើមាន។"
    >
      <div className="space-y-4">
        {!supported && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--ink-dim)]">
            {t("Speech recognition is not available in this browser. Try Chrome or Edge.", "ការសម្គាល់សំឡេងមិនមានក្នុងកម្មវិធីរុករកនេះទេ។ សូមសាកល្បង Chrome ឬ Edge។")}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field label={t("Language", "ភាសា")}>
            <Select value={lang} onChange={(e) => { stop(); setLang(e.target.value); }}>
              {LANGS.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end pb-[2px]">
            {listening ? (
              <button type="button" onClick={stop} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--danger)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                <MicOff size={15} />{t("Stop", "បញ្ឈប់")}
              </button>
            ) : (
              <button type="button" onClick={start} disabled={!supported} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
                <Mic size={15} />{t("Start dictating", "ចាប់ផ្តើមនិយាយ")}
              </button>
            )}
          </div>
        </div>

        {listening && (
          <div className="flex items-center gap-2 text-xs text-[var(--teal)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            {t("Listening… speak now.", "កំពុងស្តាប់… សូមនិយាយឥឡូវនេះ។")}
          </div>
        )}

        <TextArea rows={9} value={text} onChange={(e) => { finalRef.current = e.target.value; setText(e.target.value); }} />
        {interim && <p className="text-xs italic text-[var(--ink-faint)]">{interim}</p>}

        <button type="button" onClick={() => { finalRef.current = ""; setText(""); }} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]">
          <Trash2 size={13} />{t("Clear text", "លុបអត្ថបទ")}
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <p className="text-xs text-[var(--ink-faint)]">{t("Audio is processed by your browser's speech service. Say “period” or “comma” for punctuation in English.", "សំឡេងត្រូវបានដំណើរការដោយសេវាកម្មកម្មវិធីរុករក។ និយាយថា period ឬ comma សម្រាប់សញ្ញាវណ្ណយុត្តិជាភាសាអង់គ្លេស។")}</p>
      </div>
    </ToolShell>
  );
}
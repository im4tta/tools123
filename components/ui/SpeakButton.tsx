"use client";
import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { speak, speechSupported } from "@/lib/speech";

const LANG_NAMES: Record<string, { en: string; km: string }> = {
  en: { en: "English", km: "អង់គ្លេស" },
  fr: { en: "French", km: "បារាំង" },
};

/**
 * A small speaker button that reads `text` aloud with the browser's voice for `lang`. Renders nothing where the browser
 * has no speech support, so it never shows a button that cannot work.
 */
export function SpeakButton({ text, lang = "en-US", className = "", size = 18 }: { text: string; lang?: string; className?: string; size?: number }) {
  const { text: t } = useLanguage();
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Feature-detected after mount so the server render and the first client render agree.
  useEffect(() => {
    const id = requestAnimationFrame(() => setSupported(speechSupported()));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => () => { if (speaking) window.speechSynthesis.cancel(); }, [speaking]);

  if (!supported) return null;
  const name = LANG_NAMES[lang.split("-")[0]] ?? { en: lang, km: lang };
  const label = t(`Listen (${name.en})`, `ស្តាប់ (${name.km})`);

  return (
    <button
      type="button"
      onClick={() => {
        if (!speak(text, lang, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) })) setSpeaking(false);
      }}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full p-2 align-middle transition-colors hover:bg-black/5 ${speaking ? "text-[var(--gold-text)]" : "opacity-70 hover:opacity-100"} ${className}`}
    >
      <Volume2 size={size} aria-hidden className={speaking ? "animate-pulse" : ""} />
    </button>
  );
}

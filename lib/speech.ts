// Read a word aloud with the browser's built-in speech (Web Speech API). Runs on the device: no audio files and no
// network, but the voices available depend on the browser and operating system, so callers must handle "unsupported".

/** True when this browser can speak at all (voices may still load a moment later). */
export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * The text to speak for a glossary headword: drops bracketed acronyms and qualifiers ("Indian Ocean Dipole (IOD)" ->
 * "Indian Ocean Dipole"), reads "/" alternatives as "or", and collapses spacing.
 */
export function speakableText(text: string): string {
  return text
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s*\/\s*/g, ", or ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

/** Best voice for a language tag ("en-US"): an exact match first, then the same language, preferring local voices. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const want = lang.toLowerCase();
  const base = want.split("-")[0];
  const rank = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase().replace("_", "-");
    if (l === want) return v.localService ? 0 : 1;
    if (l.split("-")[0] === base) return v.localService ? 2 : 3;
    return 9;
  };
  return [...voices].filter((v) => rank(v) < 9).sort((a, b) => rank(a) - rank(b))[0];
}

/** Speak text in the given language, cancelling anything already speaking. Returns false when speech is unavailable. */
export function speak(text: string, lang = "en-US", hooks: { onStart?: () => void; onEnd?: () => void } = {}): boolean {
  if (!speechSupported()) return false;
  const phrase = speakableText(text);
  if (!phrase) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = lang;
  utterance.rate = 0.92;
  const voice = pickVoice(synth.getVoices(), lang);
  if (voice) utterance.voice = voice;
  utterance.onstart = () => hooks.onStart?.();
  utterance.onend = () => hooks.onEnd?.();
  utterance.onerror = () => hooks.onEnd?.();
  synth.speak(utterance);
  return true;
}

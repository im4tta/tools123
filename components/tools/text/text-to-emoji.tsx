"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const EMOJI_MAP: Record<string, string> = {
  love: "❤️", heart: "❤️", happy: "😀", smile: "😊", sad: "😢", cry: "😭",
  laugh: "😂", lol: "😂", cool: "😎", angry: "😡", mad: "😠", wow: "😮",
  fire: "🔥", hot: "🥵", cold: "🥶", party: "🎉", birthday: "🎂", cake: "🎂",
  food: "🍔", pizza: "🍕", coffee: "☕", tea: "🍵", beer: "🍺", water: "💧",
  cat: "🐱", dog: "🐶", star: "⭐", sun: "☀️", moon: "🌙", rain: "🌧️",
  money: "💰", rich: "🤑", ok: "👌", yes: "✅", no: "❌", thanks: "🙏",
  thank: "🙏", thx: "🙏", hi: "👋", hello: "👋", bye: "👋", good: "👍",
  great: "👍", win: "🏆", trophy: "🏆", music: "🎵", book: "📚", phone: "📱",
  computer: "💻", time: "⏰", clock: "⏰", sleep: "😴", work: "💼", job: "💼",
  travel: "✈️", car: "🚗", house: "🏠", home: "🏠", baby: "👶", king: "👑",
  queen: "👑", strong: "💪", sick: "🤒", doctor: "🩺", prayer: "🙏",
};

function emojify(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token) => {
      const clean = token.toLowerCase().replace(/[^a-z]/g, "");
      const emoji = EMOJI_MAP[clean];
      return emoji ? token.replace(new RegExp(clean, "i"), emoji) : token;
    })
    .join("");
}

export default function TextToEmoji() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("text-to-emoji:input", "I love coffee and my cat");

  const output = useMemo(() => emojify(input), [input]);

  return (
    <ToolShell
      title="Text to Emoji"
      khmerTitle="បំប្លែងអត្ថបទទៅជា Emoji"
      description="Replace common words with matching emoji."
      descriptionKm="ជំនួសពាក្យទូទៅដោយ emoji ដែលត្រូវគ្នា។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label={t("Result", "លទ្ធផល")} value={output} mono={false} />
    </ToolShell>
  );
}

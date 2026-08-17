"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const EMOJI_NAMES: Record<string, string> = {
  "😀": "Grinning face", "😊": "Smiling face with smiling eyes", "😂": "Face with tears of joy",
  "😢": "Crying face", "😭": "Loudly crying face", "😡": "Pouting face", "😍": "Smiling face with heart-eyes",
  "🥰": "Smiling face with hearts", "😘": "Face blowing a kiss", "😎": "Smiling face with sunglasses",
  "🤔": "Thinking face", "🙏": "Folded hands", "👏": "Clapping hands", "👍": "Thumbs up", "👎": "Thumbs down",
  "👌": "OK hand", "✌️": "Victory hand", "❤️": "Red heart", "💔": "Broken heart", "🔥": "Fire",
  "🎉": "Party popper", "🎂": "Birthday cake", "⭐": "Star", "🌟": "Glowing star", "☀️": "Sun",
  "🌙": "Crescent moon", "🌧️": "Cloud with rain", "❄️": "Snowflake", "🌈": "Rainbow", "⚡": "High voltage",
  "🐶": "Dog face", "🐱": "Cat face", "🐟": "Fish", "🐦": "Bird", "🦁": "Lion", "🐼": "Panda",
  "🍎": "Red apple", "🍕": "Pizza", "🍔": "Hamburger", "☕": "Hot beverage", "🍺": "Beer mug",
  "🚗": "Automobile", "✈️": "Airplane", "🏠": "House", "💻": "Laptop", "📱": "Mobile phone",
  "💰": "Money bag", "💵": "Dollar banknote", "🏆": "Trophy", "⚽": "Soccer ball", "🎵": "Musical note",
  "📚": "Books", "💼": "Briefcase", "🎁": "Wrapped gift", "🔑": "Key", "🔒": "Locked",
};

export default function EmojiLookup() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("emoji-lookup:input", "😂 🔥 🐶");

  const result = useMemo(() => {
    if (!input.trim()) return "";
    return [...input]
      .map((ch) => (EMOJI_NAMES[ch] ? `${ch} → ${EMOJI_NAMES[ch]}` : ch))
      .filter((s) => s.trim())
      .join("\n");
  }, [input]);

  return (
    <ToolShell
      title="Emoji Meaning Lookup"
      khmerTitle="ស្វែងរកអត្ថន័យ Emoji"
      description="Paste any emoji to see its official Unicode name."
      descriptionKm="បិទភ្ជាប់ emoji ណាមួយ ដើម្បីមើលឈ្មោះ Unicode ផ្លូវការរបស់វា។"
    >
      <Field label={t("Emoji", "Emoji")}>
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} className="text-lg" />
      </Field>
      <Output label={t("Meaning", "អត្ថន័យ")} value={result} mono={false} />
    </ToolShell>
  );
}

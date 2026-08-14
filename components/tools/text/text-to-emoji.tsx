"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const EMOJI_MAP: Record<string, string> = {
  // feelings
  love: "❤️", heart: "❤️", happy: "😀", smile: "😊", sad: "😢", cry: "😭",
  laugh: "😂", lol: "😂", cool: "😎", angry: "😡", mad: "😠", wow: "😮",
  crazy: "🤪", surprised: "😲", shocked: "😱", tired: "😫", bored: "😐",
  proud: "😌", shy: "😳", love2: "🥰", kiss: "😘", wink: "😉", sad2: "🥺",
  // weather / nature
  fire: "🔥", hot: "🥵", cold: "🥶", sun: "☀️", moon: "🌙", rain: "🌧️",
  snow: "❄️", storm: "⛈️", wind: "💨", rainbow: "🌈", cloud: "☁️",
  star: "⭐", lightning: "⚡", flower: "🌸", tree: "🌳", leaf: "🍃",
  // food & drink
  food: "🍔", burger: "🍔", pizza: "🍕", coffee: "☕", tea: "🍵", beer: "🍺",
  water: "💧", cake: "🎂", icecream: "🍦", ice: "🧊", sushi: "🍣", rice: "🍚",
  noodle: "🍜", bread: "🍞", egg: "🥚", cheese: "🧀", fruit: "🍎", apple: "🍎",
  banana: "🍌", grape: "🍇", orange: "🍊", lemon: "🍋", chicken: "🍗",
  // animals
  cat: "🐱", dog: "🐶", fish: "🐟", bird: "🐦", rabbit: "🐰", mouse: "🐭",
  horse: "🐴", cow: "🐮", pig: "🐷", tiger: "🐯", lion: "🦁", bear: "🐻",
  monkey: "🐵", snake: "🐍", turtle: "🐢", frog: "🐸", chicken2: "🐔",
  whale: "🐳", dolphin: "🐬", shark: "🦈", octopus: "🐙", crab: "🦀",
  elephant: "🐘", giraffe: "🦒", penguin: "🐧", panda: "🐼", bee: "🐝",
  butterfly: "🦋", owl: "🦉", dinosaur: "🦖",
  // objects / things
  money: "💰", rich: "🤑", ok: "👌", yes: "✅", no: "❌", thanks: "🙏",
  thank: "🙏", thx: "🙏", hi: "👋", hello: "👋", bye: "👋", good: "👍",
  great: "👍", win: "🏆", trophy: "🏆", music: "🎵", book: "📚", phone: "📱",
  computer: "💻", time: "⏰", clock: "⏰", sleep: "😴", work: "💼", job: "💼",
  travel: "✈️", car: "🚗", house: "🏠", home: "🏠", baby: "👶", king: "👑",
  queen: "👑", strong: "💪", sick: "🤒", doctor: "🩺", prayer: "🙏",
  gift: "🎁", ball: "⚽", game: "🎮", key: "🔑", lock: "🔒", bell: "🔔",
  camera: "📷", tv: "📺", bed: "🛏️", ship: "🚢", train: "🚆", bus: "🚌",
  bike: "🚲", rocket: "🚀", plane: "✈️", money2: "💵", ring: "💍", crown: "👑",
  party: "🎉", birthday: "🎂", christmas: "🎄", halloween: "🎃", movie: "🎬",
  art: "🎨", sport: "⚽", soccer: "⚽", basketball: "🏀", swim: "🏊",
};

function emojify(text: string): string {
  // Split into word-like tokens; match longest keys first so plurals/compound
  // words still work via their stem (fall back to a simple singular strip).
  return text
    .split(/(\s+)/)
    .map((token) => {
      const clean = token.toLowerCase().replace(/[^a-z]/g, "");
      if (!clean) return token;
      const candidates = [clean, clean.replace(/s$/, ""), clean.replace(/es$/, "")];
      for (const c of candidates) {
        const emoji = EMOJI_MAP[c];
        if (emoji) return token.replace(new RegExp(clean, "i"), emoji);
      }
      return token;
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

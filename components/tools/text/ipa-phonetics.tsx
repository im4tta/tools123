"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * SAMPLE dictionary — common English words with approximate General American
 * IPA transcriptions. This is a small demonstration set written for this
 * tool (word list inspired by the CMU Pronouncing Dictionary); it is NOT a
 * complete dictionary and pronunciations may vary by accent.
 */
const DICT: Record<string, string> = {
  hello: "/həˈloʊ/",
  water: "/ˈwɔːtər/",
  name: "/neɪm/",
  thank: "/θæŋk/",
  please: "/pliːz/",
  love: "/lʌv/",
  time: "/taɪm/",
  day: "/deɪ/",
  work: "/wɜːrk/",
  school: "/skuːl/",
  yes: "/jɛs/",
  no: "/noʊ/",
  good: "/ɡʊd/",
  bad: "/bæd/",
  big: "/bɪɡ/",
  small: "/smɔːl/",
  man: "/mæn/",
  woman: "/ˈwʊmən/",
  child: "/tʃaɪld/",
  family: "/ˈfæməli/",
  friend: "/frɛnd/",
  house: "/haʊs/",
  home: "/hoʊm/",
  car: "/kɑːr/",
  food: "/fuːd/",
  eat: "/iːt/",
  drink: "/drɪŋk/",
  sleep: "/sliːp/",
  run: "/rʌn/",
  walk: "/wɔːk/",
  see: "/siː/",
  look: "/lʊk/",
  hear: "/hɪr/",
  speak: "/spiːk/",
  read: "/riːd/",
  write: "/raɪt/",
  book: "/bʊk/",
  word: "/wɜːrd/",
  letter: "/ˈlɛtər/",
  number: "/ˈnʌmbər/",
  people: "/ˈpiːpəl/",
  world: "/wɜːrld/",
  country: "/ˈkʌntri/",
  city: "/ˈsɪti/",
  town: "/taʊn/",
  street: "/striːt/",
  road: "/roʊd/",
  place: "/pleɪs/",
  thing: "/θɪŋ/",
  way: "/weɪ/",
  life: "/laɪf/",
  hand: "/hænd/",
  eye: "/aɪ/",
  face: "/feɪs/",
  head: "/hɛd/",
  hair: "/hɛr/",
  body: "/ˈbɒdi/",
  heart: "/hɑːrt/",
  foot: "/fʊt/",
  money: "/ˈmʌni/",
  price: "/praɪs/",
  buy: "/baɪ/",
  sell: "/sɛl/",
  open: "/ˈoʊpən/",
  close: "/kloʊz/",
  start: "/stɑːrt/",
  stop: "/stɒp/",
  move: "/muːv/",
  make: "/meɪk/",
  give: "/ɡɪv/",
  take: "/teɪk/",
  have: "/hæv/",
  get: "/ɡɛt/",
  come: "/kʌm/",
  go: "/ɡoʊ/",
  know: "/noʊ/",
  think: "/θɪŋk/",
  say: "/seɪ/",
  tell: "/tɛl/",
  ask: "/æsk/",
  help: "/hɛlp/",
  want: "/wɒnt/",
  need: "/niːd/",
  like: "/laɪk/",
  live: "/lɪv/",
  learn: "/lɜːrn/",
  teach: "/tiːtʃ/",
  study: "/ˈstʌdi/",
  music: "/ˈmjuːzɪk/",
  song: "/sɔːŋ/",
  color: "/ˈkʌlər/",
  red: "/rɛd/",
  blue: "/bluː/",
  green: "/ɡriːn/",
  black: "/blæk/",
  white: "/waɪt/",
  yellow: "/ˈjɛloʊ/",
  morning: "/ˈmɔːrnɪŋ/",
  night: "/naɪt/",
  today: "/təˈdeɪ/",
  tomorrow: "/təˈmɔːroʊ/",
  yesterday: "/ˈjɛstərdeɪ/",
  week: "/wiːk/",
  month: "/mʌnθ/",
  year: "/jɪr/",
  happy: "/ˈhæpi/",
  sad: "/sæd/",
  hot: "/hɒt/",
  cold: "/koʊld/",
  new: "/nuː/",
  old: "/oʊld/",
  young: "/jʌŋ/",
  goodbye: "/ˌɡʊdˈbaɪ/",
  sorry: "/ˈsɒri/",
  excuse: "/ɪkˈskjuːz/",
  welcome: "/ˈwɛlkəm/",
  computer: "/kəmˈpjuːtər/",
  phone: "/foʊn/",
  internet: "/ˈɪntərnɛt/",
  weather: "/ˈwɛðər/",
  sun: "/sʌn/",
  rain: "/reɪn/",
  sky: "/skaɪ/",
  tree: "/triː/",
  flower: "/ˈflaʊər/",
  animal: "/ˈænɪməl/",
  dog: "/dɒɡ/",
  cat: "/kæt/",
  bird: "/bɜːrd/",
  fish: "/fɪʃ/",
};

/** Greedy letter-to-phoneme fallback rules (rough approximation). */
const GRAPHEMES: [string, string][] = [
  ["tion", "ʃən"], ["sion", "ʒən"], ["ture", "tʃər"], ["igh", "aɪ"], ["sh", "ʃ"],
  ["ch", "tʃ"], ["th", "θ"], ["ph", "f"], ["wh", "w"], ["ck", "k"], ["ng", "ŋ"],
  ["qu", "kw"], ["ee", "iː"], ["oo", "uː"], ["ea", "iː"], ["ai", "eɪ"], ["ay", "eɪ"],
  ["ou", "aʊ"], ["ow", "aʊ"], ["oi", "ɔɪ"], ["oy", "ɔɪ"], ["er", "ɜːr"], ["ar", "ɑːr"],
  ["or", "ɔːr"],
];
const LETTERS: Record<string, string> = {
  a: "æ", b: "b", c: "k", d: "d", e: "ɛ", f: "f", g: "ɡ", h: "h", i: "ɪ", j: "dʒ",
  k: "k", l: "l", m: "m", n: "n", o: "ɒ", p: "p", q: "kw", r: "r", s: "s", t: "t",
  u: "ʌ", v: "v", w: "w", x: "ks", y: "j", z: "z",
};

function fallbackWord(word: string): string {
  const lower = word.toLowerCase();
  if (DICT[lower]) return DICT[lower];
  let rest = lower;
  let out = "";
  while (rest.length > 0) {
    const match = GRAPHEMES.find(([g]) => rest.startsWith(g));
    if (match) {
      out += match[1];
      rest = rest.slice(match[0].length);
    } else {
      const ch = rest[0];
      out += LETTERS[ch] ?? ch;
      rest = rest.slice(1);
    }
  }
  return `/${out.split("").join("·")}/`;
}

function toIpa(phrase: string): string {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words.map((w) => fallbackWord(w.replace(/[^\p{L}\p{N}']/gu, ""))).join(" ");
}

export default function IpaPhonetics() {
  const { text: t } = useLanguage();
  const [word, setWord] = useToolState("ipa:word", "hello");

  const ipa = useMemo(() => toIpa(word), [word]);
  const entries = useMemo(() => Object.entries(DICT), []);

  return (
    <ToolShell
      title="English → IPA Phonetics"
      khmerTitle="បម្លែងអង់គ្លេស → IPA"
      description="Convert English words to International Phonetic Alphabet (IPA) using a small bundled sample dictionary with a letter-to-phoneme fallback."
      descriptionKm="បម្លែងពាក្យអង់គ្លេសទៅជាអក្សរសូរសព្ទអន្តរជាតិ (IPA) ដោយប្រើវចនានុក្រមគំរូតូចមួយដែលភ្ជាប់មកជាមួយ និងច្បាប់អក្សរទៅសូរ។"
    >
      <Field label={t("Word or phrase", "ពាក្យ ឬឃ្លា")}>
        <TextInput value={word} onChange={(e) => setWord(e.target.value)} className="font-mono-ui" />
      </Field>

      <Output label="IPA" value={ipa || t("Enter a word.", "សូមបញ្ចូលពាក្យ។")} />

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Sample dictionary", "វចនានុក្រមគំរូ")}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "The built-in dictionary is a SAMPLE of about 120 common words with approximate General American pronunciations for demonstration only — it is not a complete dictionary and may differ from other accents.",
            "វចនានុក្រមដែលភ្ជាប់មកគឺជាគំរូប្រហែល ១២០ ពាក្យធម្មតា ជាមួយការបញ្ចេញសំឡេងបែបអាមេរិកប្រហាក់ប្រហែល សម្រាប់បង្ហាញតែប៉ុណ្ណោះ — មិនមែនជាវចនានុក្រមពេញលេញទេ ហើយអាចខុសពីសំនៀងដទៃ។"
          )}
        </p>
        <div className="mt-3 grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-auto sm:grid-cols-3">
          {entries.map(([w, ip]) => (
            <button
              key={w}
              type="button"
              onClick={() => setWord(w)}
              className="flex items-baseline justify-between gap-2 rounded px-1.5 py-0.5 text-left text-sm text-[var(--ink)] hover:bg-[var(--ground-line)]"
            >
              <span className="font-medium">{w}</span>
              <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{ip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "This tool is an original implementation. The word list was inspired by the CMU Pronouncing Dictionary (Carnegie Mellon University, cmusphinx/cmudict, BSD-style license); the bundled IPA transcriptions are approximate sample renderings written for this tool and are not taken from CMU data. IPA notation follows the International Phonetic Alphabet.",
            "ឧបករណ៍នេះជាការអនុវត្តដើម។ បញ្ជីពាក្យត្រូវបានបំផុសគំនិតពី CMU Pronouncing Dictionary (Carnegie Mellon University, cmusphinx/cmudict, អាជ្ញាបណ្ណបែប BSD)។ ការចម្លង IPA គឺជាគំរូប្រហាក់ប្រហែលដែលសរសេរសម្រាប់ឧបករណ៍នេះ មិនមែនយកពីទិន្នន័យ CMU ទេ។"
          )}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <span className="font-semibold text-[var(--ink)]">CMU Pronouncing Dictionary</span> — cmusphinx/cmudict ·{" "}
            <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              github.com/cmusphinx/cmudict
            </a>
          </li>
          <li>
            <span className="font-semibold text-[var(--ink)]">International Phonetic Alphabet</span> —{" "}
            <a href="https://www.internationalphoneticassociation.org" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              internationalphoneticassociation.org
            </a>
          </li>
        </ul>
      </div>
    </ToolShell>
  );
}

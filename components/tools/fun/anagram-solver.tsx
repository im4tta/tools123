"use client";
import { useMemo } from "react";
import { MousePointerClick, SearchX } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useClipboard } from "@/components/ClipboardProvider";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Curated list of common short English words (3–9 letters). This is a small
// built-in reference list for quick anagram play — deliberately NOT a full
// dictionary, so rare or specialised words may be missing.
const WORDS_3 = [
  "ace", "act", "add", "age", "ago", "aid", "aim", "air", "all", "and",
  "ant", "any", "ape", "arc", "are", "arm", "art", "ask", "ate", "axe",
  "bad", "bag", "ban", "bar", "bat", "bay", "bed", "bee", "beg", "bet",
  "big", "bit", "bow", "box", "boy", "bus", "but", "buy", "cab", "can",
  "cap", "car", "cat", "cow", "cry", "cup", "cut", "day", "die", "dig",
  "dip", "dog", "dot", "dry", "ear", "eat", "egg", "end", "eye", "fan",
  "far", "fat", "fee", "few", "fig", "fit", "fix", "fly", "fog", "for",
];
const WORDS_4 = [
  "able", "acid", "also", "area", "army", "atom", "aunt", "auto", "away", "baby",
  "back", "ball", "band", "bank", "bare", "base", "bath", "beam", "bean", "bear",
  "beat", "bell", "belt", "bend", "best", "bike", "bill", "bird", "bite", "blow",
  "blue", "boat", "body", "bold", "bond", "bone", "book", "boom", "boot", "born",
  "boss", "both", "bowl", "burn", "busy", "cafe", "cake", "calm", "camp", "card",
  "care", "cart", "case", "cash", "cast", "cave", "cell", "cent", "chat", "chef",
  "chin", "chip", "city", "club", "coal", "coat", "code", "coin", "cold", "comb",
  "come", "cook", "cool", "cord", "core", "corn", "cost", "crab", "crew", "crop",
];
const WORDS_5 = [
  "about", "above", "actor", "adapt", "admit", "adopt", "adult", "after", "again", "agent",
  "agree", "ahead", "alarm", "album", "alert", "alien", "alike", "alive", "allow", "alone",
  "along", "angel", "anger", "angle", "angry", "ankle", "apart", "apple", "apply", "apron",
  "argue", "arise", "armor", "aroma", "array", "arrow", "aside", "asset", "audio", "avoid",
  "awake", "award", "aware", "bacon", "badge", "baker", "basic", "beach", "beard", "beast",
  "begin", "being", "below", "bench", "berry", "birth", "black", "blade", "blame", "blank",
  "blast", "bleed", "blend", "bless", "blind", "block", "bloom", "board", "boost", "bound",
  "brain", "brake", "brand", "brave", "bread", "break", "brick", "bride", "brief", "bring",
  "broad", "broke", "brook", "brown", "brush", "build", "built", "bunch", "burst", "buyer",
  "cabin", "cable", "candy", "canoe", "cargo", "carry", "carve", "catch", "cause", "chain",
];
const WORDS_6 = [
  "abroad", "accept", "across", "action", "active", "actual", "advice", "advise", "afford", "afraid",
  "agency", "agenda", "almost", "always", "amount", "animal", "annual", "answer", "anyone", "anyway",
  "appeal", "appear", "around", "arrive", "artist", "asleep", "aspect", "assist", "assume", "attend",
  "author", "autumn", "basket", "battle", "beauty", "became", "become", "before", "behave", "behind",
  "belong", "beside", "better", "beyond", "billion", "border", "borrow", "bother", "bottle", "bottom",
  "branch", "breath", "bridge", "bright", "broken", "budget", "butter", "button", "camera", "campus",
  "cancel", "carbon", "career", "carpet", "castle", "casual", "caught", "center", "cereal", "certain",
  "chance", "change", "charge", "choice", "choose", "church", "circle", "client", "clinic", "coffee",
  "college", "column", "combat", "comedy", "common", "corner", "cotton", "council", "course", "cousin",
];
const WORDS_7 = [
  "ability", "absence", "academy", "account", "achieve", "acquire", "address", "advance", "against", "airline",
  "airport", "alcohol", "already", "amazing", "ancient", "another", "anxiety", "anybody", "applied", "approve",
  "arrival", "article", "attempt", "attract", "average", "balance", "banking", "bargain", "barrier", "battery",
  "bearing", "bedroom", "believe", "beneath", "benefit", "besides", "bicycle", "biggest", "biology", "blanket",
  "brother", "builder", "burning", "cabinet", "calling", "capital", "captain", "capture", "careful", "carrier",
  "cartoon", "ceiling", "century", "certain", "chamber", "channel", "chapter", "charity", "chicken", "circuit",
  "citizen", "classic", "cleaner", "clearly", "climate", "collect", "college", "combine", "comfort", "command",
];
const WORDS_8 = [
  "absolute", "abstract", "academic", "accepted", "accident", "accurate", "actually", "addition", "adequate", "advanced",
  "aircraft", "although", "analysis", "announce", "anything", "anywhere", "apparent", "approach", "approved", "argument",
  "attached", "attitude", "audience", "available", "behavior", "boundary", "business", "campaign", "capacity", "captured",
  "category", "cautious", "ceremony", "chairman", "champion", "changing", "chemical", "children", "circular", "civilian",
  "clothing", "complete", "computer", "concrete", "confused", "congress", "consumer", "continue", "contract", "convince",
  "corporate", "creative", "creature", "criminal", "critical", "cultural", "currency", "customer", "database", "daughter",
];
const WORDS_9 = [
  "adventure", "afternoon", "agreement", "apartment", "beautiful", "breakfast", "candidate", "celebrate", "character", "chocolate",
  "committee", "community", "condition", "confident", "dangerous", "determine", "different", "direction", "discovery", "education",
  "effective", "emergency", "encourage", "equipment", "establish", "exception", "expensive", "extension", "fantastic", "following",
];
const WORDS = Array.from(new Set<string>([...WORDS_3, ...WORDS_4, ...WORDS_5, ...WORDS_6, ...WORDS_7, ...WORDS_8, ...WORDS_9]));
const LENGTH_OPTIONS = ["3", "4", "5", "6", "7", "8", "9"];

function canForm(word: string, pool: string): boolean {
  const counts: Record<string, number> = {};
  for (const ch of pool) counts[ch] = (counts[ch] ?? 0) + 1;
  for (const ch of word) {
    const left = counts[ch];
    if (!left) return false;
    counts[ch] = left - 1;
  }
  return true;
}

interface Group {
  len: number;
  words: string[];
}

export default function AnagramSolver() {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const [letters, setLetters] = useToolState("anagram:letters", "");
  const [pattern, setPattern] = useToolState("anagram:pattern", "");
  const [minLen, setMinLen] = useToolState("anagram:min", "3");
  const [maxLen, setMaxLen] = useToolState("anagram:max", "9");

  const groups = useMemo<Group[]>(() => {
    const pool = letters.toLowerCase().replace(/[^a-z]/g, "");
    const pat = pattern.toLowerCase().replace(/[^a-z_?]/g, "").replace(/\?/g, "_");
    if (!pool) return [];
    const min = Math.min(Number(minLen) || 3, 9);
    const max = Math.max(Number(maxLen) || 9, min);
    const byLen = new Map<number, string[]>();
    for (const w of WORDS) {
      if (pat) {
        if (w.length !== pat.length) continue;
        let ok = true;
        for (let i = 0; i < w.length; i++) {
          const pc = pat[i];
          if (pc !== "_" && pc !== w[i]) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
      } else {
        if (w.length < min || w.length > max) continue;
      }
      if (!canForm(w, pool)) continue;
      const arr = byLen.get(w.length) ?? [];
      arr.push(w);
      byLen.set(w.length, arr);
    }
    return [...byLen.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([len, ws]) => ({ len, words: ws.sort() }));
  }, [letters, pattern, minLen, maxLen]);

  const total = groups.reduce((n, g) => n + g.words.length, 0);
  const hasLetters = letters.replace(/[^a-z]/gi, "").length > 0;

  return (
    <ToolShell
      title="Anagram Solver"
      khmerTitle="រកពាក្យពីអក្សរ"
      description="Find dictionary words you can make from a set of letters, with optional min/max length and a wildcard pattern such as a__le."
      descriptionKm="ស្វែងរកពាក្យដែលអាចបង្កើតចេញពីសំណុំអក្សរ ជាមួយជម្រើសកំណត់ប្រវែង និងលំនាំដូចជា a__le។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Type your letters, then set the length range — or add a pattern where _ or ? stands for any letter. Tap any word to copy it.", "វាយអក្សររបស់អ្នក រួចកំណត់ប្រវែង — ឬបន្ថែមលំនាំដែល _ ឬ ? តំណាងអក្សរណាមួយ។ ចុចពាក្យណាមួយដើម្បីចម្លង។")}
      </div>

      <Field label={t("Your letters", "អក្សររបស់អ្នក")}>
        <TextInput
          value={letters}
          onChange={(e) => setLetters(e.target.value)}
          placeholder={t("e.g. aplpe or a p p l e", "ឧ. aplpe ឬ a p p l e")}
          maxLength={40}
        />
      </Field>

      <Row>
        <Field label={t("Min length", "ប្រវែងតិចបំផុត")}>
          <Select
            value={minLen}
            onChange={(e) => {
              setMinLen(e.target.value);
              if (Number(e.target.value) > Number(maxLen)) setMaxLen(e.target.value);
            }}
          >
            {LENGTH_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Max length", "ប្រវែងច្រើនបំផុត")}>
          <Select
            value={maxLen}
            onChange={(e) => {
              setMaxLen(e.target.value);
              if (Number(e.target.value) < Number(minLen)) setMinLen(e.target.value);
            }}
          >
            {LENGTH_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Field
        label={t("Pattern (optional)", "លំនាំ (ស្រេចចិត្ត)")}
        hint="_ or ? = unknown; sets exact length"
        hintKm="_ ឬ ? = អក្សរណាមួយ; កំណត់ប្រវែងពិតប្រាកដ"
      >
        <TextInput
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder={t("e.g. a__le", "ឧ. a__le")}
          maxLength={20}
          className="font-mono-ui"
        />
      </Field>

      {!hasLetters ? (
        <div className="rounded-md border border-dashed border-[var(--ground-line)] p-6 text-center text-sm text-[var(--ink-faint)]">
          {t("Start typing letters to see anagrams here.", "ចាប់ផ្ដើមវាយអក្សរ ដើម្បីមើលពាក្យនៅទីនេះ។")}
        </div>
      ) : total === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] p-6 text-center text-sm text-[var(--ink-dim)]">
          <SearchX size={18} className="mx-auto shrink-0 text-[var(--ink-faint)]" />
          <span>{t("No words match — try different letters or a shorter pattern.", "គ្មានពាក្យត្រូវទេ — សាកល្បងអក្សរផ្សេង ឬលំនាំខ្លីជាង។")}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--gold)]">
              {t("Found", "បានរកឃើញ")}: {total} {t("word(s)", "ពាក្យ")}
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]">
              <MousePointerClick size={13} /> {t("tap a word to copy", "ចុចពាក្យដើម្បីចម្លង")}
            </span>
          </div>
          {groups.map((g) => (
            <div key={g.len}>
              <div className="mb-2 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-1">
                <span className="font-display text-sm font-semibold text-[var(--ink)]">{g.len} {t("letters", "អក្សរ")}</span>
                <span className="text-xs text-[var(--ink-faint)]">({g.words.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.words.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => void copyText(w)}
                    title={t("Copy", "ចម្លង")}
                    className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          `Uses a small built-in reference list of ${WORDS.length} common English words (3–9 letters) — not a full dictionary, so rare words may be missing.`,
          `ប្រើបញ្ជីពាក្យយោងតូចដែលភ្ជាប់មកជាមួយចំនួន ${WORDS.length} ពាក្យអង់គ្លេសទូទៅ (ប្រវែង ៣–៩ អក្សរ) — មិនមែនជាវចនានុក្រមពេញលេញទេ ដូច្នេះពាក្យកម្រអាចនឹងអវត្តមាន។`
        )}
      </p>
    </ToolShell>
  );
}

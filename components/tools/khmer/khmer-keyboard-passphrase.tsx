"use client";
import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { convertKhmerToLatin, convertLatinToKhmer } from "@/lib/khmer-keyboard-niida";
import { passphraseBits, uniformIndex } from "@/lib/khmer-learning";

// Only words that can be typed on the base/Shift layers of the NIDA layout and
// convert back exactly, so the Latin keystrokes always reproduce the Khmer word.
const POOL: string[] = [...new Set((khmerWords as string[]).filter((w) => {
  if (!/^[ក-៿]+$/.test(w) || [...w].length < 2) return false;
  const keys = convertKhmerToLatin(w);
  return !/[ក-៿]/.test(keys) && convertLatinToKhmer(keys) === w;
}))];

type Sep = "none" | "dash" | "digit";

function cryptoWord(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

function strengthLabel(bits: number): [string, string] {
  if (bits < 40) return ["Weak — add words", "ខ្សោយ — បន្ថែមពាក្យ"];
  if (bits < 60) return ["Fair", "មធ្យម"];
  if (bits < 80) return ["Strong", "ខ្លាំង"];
  return ["Very strong", "ខ្លាំងណាស់"];
}

export default function KhmerKeyboardPassphrase() {
  const { text: t } = useLanguage();
  const [count, setCount] = useToolState("khmer-passphrase:count", 5);
  const [sep, setSep] = useToolState<Sep>("khmer-passphrase:sep", "dash");
  // Passphrases are never persisted — they live only in this component's memory.
  const [picked, setPicked] = useState<string[]>([]);
  const [digits, setDigits] = useState<number[]>([]);

  const generate = () => {
    setPicked(Array.from({ length: count }, () => POOL[uniformIndex(POOL.length, cryptoWord)]));
    setDigits(Array.from({ length: count }, () => uniformIndex(10, cryptoWord)));
  };

  const result = useMemo(() => {
    if (picked.length === 0) return null;
    const keys = picked.map(convertKhmerToLatin);
    const join = (parts: string[], km: boolean) => parts.map((p, i) => {
      if (i === parts.length - 1 || sep === "none") return p;
      if (sep === "dash") return `${p}-`;
      return `${p}${km ? "០១២៣៤៥៦៧៨៩"[digits[i]] : digits[i]}`;
    }).join("");
    return { khmer: join(picked, true), keys: join(keys, false) };
  }, [picked, sep, digits]);

  const bits = passphraseBits(POOL.length, picked.length || count) + (sep === "digit" ? ((picked.length || count) - 1) * Math.log2(10) : 0);
  const [strengthEn, strengthKm] = strengthLabel(bits);

  return (
    <ToolShell
      title="Khmer Keyboard Passphrase Generator"
      khmerTitle="ឧបករណ៍បង្កើតពាក្យសម្ងាត់តាមក្ដារចុចខ្មែរ"
      description="Generate a strong password you can actually remember: a few random Khmer words, plus the exact keys you'd press to type them on the standard NIDA Khmer keyboard with the English layout switched on. You memorise “ផ្កា-ទន្លេ-…”, but the password stored is Latin keystrokes that work on any site, even ones that reject Khmer characters. Words are chosen with your browser's cryptographic random generator and nothing is saved or sent."
      descriptionKm="បង្កើតពាក្យសម្ងាត់ខ្លាំងដែលអ្នកអាចចងចាំបាន៖ ពាក្យខ្មែរចៃដន្យពីរបី ព្រមទាំងគ្រាប់ចុចពិតប្រាកដដែលអ្នកនឹងចុចដើម្បីវាយវានៅលើក្ដារចុចខ្មែរស្តង់ដារ NIDA ពេលប្លង់អង់គ្លេសបើក។ អ្នកចងចាំ «ផ្កា-ទន្លេ-…» ប៉ុន្តែពាក្យសម្ងាត់ដែលរក្សាទុកគឺគ្រាប់ចុចឡាតាំងដែលដំណើរការលើគេហទំព័រណាក៏ដោយ សូម្បីតែគេហទំព័រដែលមិនទទួលអក្សរខ្មែរ។ ពាក្យត្រូវជ្រើសដោយម៉ាស៊ីនបង្កើតលេខចៃដន្យគ្រីបតូរបស់កម្មវិធីរុករក ហើយគ្មានអ្វីត្រូវរក្សាទុក ឬផ្ញើទេ។"
    >
      <PillGroup label={t("Number of words", "ចំនួនពាក្យ")}>
        {[3, 4, 5, 6, 7].map((n) => <Pill key={n} active={count === n} onClick={() => setCount(n)}>{t(String(n), "០១២៣៤៥៦៧៨៩"[n])}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Between words", "រវាងពាក្យ")}>
        <Pill active={sep === "dash"} onClick={() => setSep("dash")}>{t("Dash -", "សញ្ញា -")}</Pill>
        <Pill active={sep === "digit"} onClick={() => setSep("digit")}>{t("Random digit", "លេខចៃដន្យ")}</Pill>
        <Pill active={sep === "none"} onClick={() => setSep("none")}>{t("Nothing", "គ្មាន")}</Pill>
      </PillGroup>

      <Button onClick={generate} className="flex items-center gap-2"><KeyRound size={15} />{t("Generate passphrase", "បង្កើតពាក្យសម្ងាត់")}</Button>

      {result ? (
        <div className="space-y-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Remember this (Khmer)", "ចងចាំនេះ (ខ្មែរ)")}</p>
            <p lang="km" className="mt-1 break-words font-khmer text-2xl text-[var(--ink)]">{result.khmer}</p>
          </div>
          <div className="rounded-md border border-[var(--gold)]/60 bg-[var(--ground-raised)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Type this as your password (English layout)", "វាយនេះជាពាក្យសម្ងាត់ (ប្លង់អង់គ្លេស)")}</p>
                <p className="mt-1 break-all font-mono-ui text-xl text-[var(--gold)]">{result.keys}</p>
              </div>
              <CopyButton text={result.keys} compact className="shrink-0" />
            </div>
          </div>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {picked.map((w, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span lang="km" className="font-khmer text-[var(--ink)]">{w}</span>
                <span className="text-[var(--ink-faint)]">→</span>
                <code className="font-mono-ui text-[var(--ink-dim)]">{convertKhmerToLatin(w)}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Press Generate to create a passphrase. Nothing is generated until you do.", "ចុច «បង្កើត» ដើម្បីបង្កើតពាក្យសម្ងាត់។ គ្មានអ្វីត្រូវបង្កើតរហូតដល់អ្នកចុច។")}</p>
      )}

      <p className="text-sm text-[var(--ink-dim)]">
        {t(
          `Strength: ≈${Math.round(bits)} bits (${strengthEn}) — ${picked.length || count} words from a pool of ${POOL.length}${sep === "digit" ? " plus random digits" : ""}, assuming an attacker knows exactly how it was made.`,
          `កម្លាំង៖ ≈${Math.round(bits)} ប៊ីត (${strengthKm}) — ${picked.length || count} ពាក្យពីបណ្តុំ ${POOL.length}${sep === "digit" ? " បូកលេខចៃដន្យ" : ""} ដោយសន្មតថាអ្នកវាយប្រហារដឹងច្បាស់ពីរបៀបបង្កើត។`,
        )}
      </p>

      <SourceCredits>
        <p>{t(
          "Words come from the app's offline Khmer word list (Chuon Nath & Headley dictionary data and the common-word POS lexicon), filtered to those that type on the base and Shift layers of the NIDA Khmer layout and convert back exactly. Keystrokes use the same NIDA mapping as the Khmer Keyboard Layout tool (Microsoft “Khmer (NIDA)” tables and Keyman's Khmer Angkor documentation). Picks use crypto.getRandomValues with rejection sampling so every word is equally likely. The idea of memorable random-word passphrases follows Diceware (Arnold Reinhold, 1995); this Khmer-keyboard twist is an original Tools123 implementation. Entropy is an estimate; use a password manager where you can.",
          "ពាក្យមកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (ទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា) ដែលត្រងយកតែពាក្យវាយបានលើស្រទាប់មូលដ្ឋាន និង Shift នៃប្លង់ខ្មែរ NIDA ហើយបម្លែងត្រឡប់វិញបានត្រឹមត្រូវ។ គ្រាប់ចុចប្រើការផ្គូផ្គង NIDA ដូចឧបករណ៍ប្លង់ក្ដារចុចខ្មែរ (តារាង Microsoft «Khmer (NIDA)» និងឯកសារ Khmer Angkor របស់ Keyman)។ ការជ្រើសប្រើ crypto.getRandomValues ជាមួយការបដិសេធគំរូ ដូច្នេះពាក្យនីមួយៗមានឱកាសស្មើគ្នា។ គំនិតពាក្យសម្ងាត់ពាក្យចៃដន្យដែលងាយចងចាំធ្វើតាម Diceware (Arnold Reinhold, ១៩៩៥) ការកែច្នៃតាមក្ដារចុចខ្មែរនេះជាការអនុវត្តដើមរបស់ Tools123។ Entropy ជាការប៉ាន់ស្មាន សូមប្រើកម្មវិធីគ្រប់គ្រងពាក្យសម្ងាត់ពេលអាច។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}

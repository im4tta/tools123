"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Output } from "@/components/ui/Output";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// Reads numbers one digit at a time (phone numbers, OTPs, reference codes) —
// distinct from spelling out a whole value. The Khmer words for 0–9 are the
// standard cardinal numerals; the romanisation is approximate (UNGEGN-ish) and
// labelled as such.
const DIGIT_WORDS: Record<string, { km: string; roman: string }> = {
  "0": { km: "សូន្យ", roman: "saun" },
  "1": { km: "មួយ", roman: "muoy" },
  "2": { km: "ពីរ", roman: "pii" },
  "3": { km: "បី", roman: "bei" },
  "4": { km: "បួន", roman: "buon" },
  "5": { km: "ប្រាំ", roman: "pram" },
  "6": { km: "ប្រាំមួយ", roman: "pram-muoy" },
  "7": { km: "ប្រាំពីរ", roman: "pram-pii" },
  "8": { km: "ប្រាំបី", roman: "pram-bei" },
  "9": { km: "ប្រាំបួន", roman: "pram-buon" },
};
const KHMER_TO_ARABIC: Record<string, string> = { "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4", "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9" };
const ARABIC_TO_KHMER: Record<string, string> = Object.fromEntries(Object.entries(KHMER_TO_ARABIC).map(([k, v]) => [v, k]));

function normalizeDigit(ch: string): string | null {
  if (ch in DIGIT_WORDS) return ch;
  if (ch in KHMER_TO_ARABIC) return KHMER_TO_ARABIC[ch];
  return null;
}

export default function KhmerDigitReader() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-digit-reader:input", "012 345 678");

  const out = useMemo(() => {
    const kmGroups: string[] = [];
    const romanGroups: string[] = [];
    let kmCurrent: string[] = [];
    let romanCurrent: string[] = [];
    let arabic = "";
    let khmer = "";
    const flush = () => {
      if (kmCurrent.length) { kmGroups.push(kmCurrent.join(" ")); romanGroups.push(romanCurrent.join(" ")); }
      kmCurrent = []; romanCurrent = [];
    };
    for (const ch of input) {
      const d = normalizeDigit(ch);
      if (d) {
        kmCurrent.push(DIGIT_WORDS[d].km);
        romanCurrent.push(DIGIT_WORDS[d].roman);
        arabic += d;
        khmer += ARABIC_TO_KHMER[d];
      } else if (/\s|[-.]/.test(ch)) {
        flush();
        arabic += ch === "-" || ch === "." ? ch : " ";
        khmer += ch === "-" || ch === "." ? ch : " ";
      }
    }
    flush();
    return {
      km: kmGroups.join("  ·  "),
      roman: romanGroups.join("  ·  "),
      arabic: arabic.trim(),
      khmer: khmer.trim(),
      digitCount: arabic.replace(/[^0-9]/g, "").length,
    };
  }, [input]);

  return (
    <ToolShell
      title="Khmer Digit-by-Digit Reader"
      khmerTitle="ឧបករណ៍អានលេខម្តងមួយខ្ទង់ជាភាសាខ្មែរ"
      description="Read phone numbers, OTPs, and reference codes aloud one digit at a time in Khmer — the way numbers are spoken over the phone, not as a single value."
      descriptionKm="អានលេខទូរស័ព្ទ លេខ OTP និងលេខកូដម្តងមួយខ្ទង់ជាភាសាខ្មែរ — តាមរបៀបនិយាយតាមទូរស័ព្ទ មិនមែនជាតម្លៃតែមួយទេ។"
    >
      <Field label="Number, phone, or code" labelKm="លេខ ទូរស័ព្ទ ឬកូដ">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui text-base" placeholder="012 345 678" />
      </Field>

      <Output label={t("Khmer reading", "ការអានជាភាសាខ្មែរ")} value={out.km} mono={false} />
      <Output label={t("Romanisation (approximate)", "អក្សរឡាតាំង (ប្រហាក់ប្រហែល)")} value={out.roman} mono={false} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Khmer numerals", "លេខខ្មែរ")}</div>
          <div className="mt-1 font-khmer text-lg text-[var(--ink)]">{out.khmer || "—"}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Digits", "ខ្ទង់លេខ")}</div>
          <div className="mt-1 font-mono-ui text-lg text-[var(--ink)]">{out.digitCount}</div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Both Western (0–9) and Khmer (០–៩) digits are accepted; spaces and dashes group the reading. The Khmer number words are standard; the romanisation is an approximate pronunciation guide.",
          "ទទួលយកទាំងលេខលោកខាងលិច (0–9) និងលេខខ្មែរ (០–៩); ដកឃ្លា និងសញ្ញាដាច់ជួយបែងចែកការអាន។ ពាក្យលេខខ្មែរជាស្តង់ដារ; អក្សរឡាតាំងជាការណែនាំការបញ្ចេញសំឡេងប្រហាក់ប្រហែល។"
        )}
      </p>
    </ToolShell>
  );
}

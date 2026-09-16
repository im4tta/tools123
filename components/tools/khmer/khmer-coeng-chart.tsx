"use client";

// Khmer Subscript (Coeng) Chart — a reference for the subscript form (ជើងអក្សរ)
// of every Khmer consonant. Each consonant can be stacked below another with an
// invisible Coeng sign (U+17D2); this shows that form attached to a base of your
// choice, with its name, romanization, and series, and lets you copy the exact
// "្ + consonant" sequence. Consonant/subscript data is reused from the shared
// Khmer romanization dataset; the stacked glyphs are rendered by the Khmer font.

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS, KHMER_SUBSCRIPTS } from "@/lib/data/khmer-romanization";

const COENG = "្"; // Khmer sign Coeng, forms the following consonant as a subscript

interface Entry {
  seq: string; // "្" + consonant, e.g. "្ក"
  base: string; // the consonant the subscript is formed from, e.g. "ក"
  roman: string;
  name: string;
  series: 1 | 2 | null;
}

const ENTRIES: Entry[] = Object.entries(KHMER_SUBSCRIPTS).map(([seq, sub]) => {
  const base = seq.slice(COENG.length);
  const cons = KHMER_CONSONANTS[base];
  return { seq, base, roman: sub.roman, name: sub.name, series: cons ? cons.series : null };
});

const CONSONANTS = Object.keys(KHMER_CONSONANTS);

export default function KhmerCoengChart() {
  const { text: t } = useLanguage();
  const [demoBase, setDemoBase] = useToolState("khmer-coeng-chart:base", "ក");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENTRIES;
    return ENTRIES.filter(
      (e) => e.roman.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.base === query.trim() || e.seq.includes(query.trim()),
    );
  }, [query]);

  const copy = async (seq: string) => {
    try {
      await navigator.clipboard.writeText(seq);
      setCopied(seq);
      setTimeout(() => setCopied((c) => (c === seq ? null : c)), 1200);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore silently.
    }
  };

  return (
    <ToolShell
      title="Khmer Subscript (Coeng) Chart"
      khmerTitle="តារាងជើងអក្សរ (ខ្មែរ)"
      description="See the subscript (coeng) form of every Khmer consonant — the stacked letter written below another with the invisible Coeng sign (U+17D2). Pick any base consonant to preview how each subscript stacks under it, and click to copy the exact ្+consonant sequence for typing clusters like ស្ត or ក្ន."
      descriptionKm="មើលទម្រង់ជើងអក្សរ (coeng) នៃព្យញ្ជនៈខ្មែរនីមួយៗ — អក្សរដែលសរសេរនៅក្រោមអក្សរមួយទៀតដោយសញ្ញា Coeng ដែលមើលមិនឃើញ (U+17D2)។ ជ្រើសព្យញ្ជនៈគោលណាមួយ ដើម្បីមើលពីរបៀបជើងអក្សរនីមួយៗតម្រួតនៅក្រោមវា ហើយចុចដើម្បីចម្លងលំដាប់ ្+ព្យញ្ជនៈ ត្រឹមត្រូវសម្រាប់វាយបន្សំដូចជា ស្ត ឬ ក្ន។"
    >
      <Field label="Base consonant" labelKm="ព្យញ្ជនៈគោល" hint="Preview subscripts under this letter" hintKm="មើលជើងអក្សរនៅក្រោមអក្សរនេះ">
        <div className="flex flex-wrap gap-1.5">
          {CONSONANTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDemoBase(c)}
              aria-pressed={demoBase === c}
              className={`font-khmer h-9 w-9 rounded-md border text-lg transition ${
                demoBase === c
                  ? "border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--ink)]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Filter" labelKm="ត្រង" hint="By romanization, name, or letter" hintKm="តាមអក្សរឡាតាំង ឈ្មោះ ឬតួអក្សរ">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} />
      </Field>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("No subscripts match that filter.", "គ្មានជើងអក្សរត្រូវនឹងការត្រងនេះទេ។")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((e) => (
            <button
              key={e.seq}
              type="button"
              onClick={() => copy(e.seq)}
              title={t("Copy ្+consonant sequence", "ចម្លងលំដាប់ ្+ព្យញ្ជនៈ")}
              className="group flex flex-col items-center gap-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center transition hover:border-[var(--gold-dim)]"
            >
              <span className="font-khmer text-3xl leading-none text-[var(--ink)]">{demoBase + e.seq}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--ink)]">
                <span className="font-khmer text-base">{e.base}</span>
                <span className="text-[var(--ink-dim)]">{e.roman}</span>
              </span>
              <span className="text-[10px] text-[var(--ink-faint)]">
                {e.name}
                {e.series ? ` · ${t("series", "ស៊េរី")} ${e.series}` : ""}
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[var(--ink-faint)] group-hover:text-[var(--gold)]">
                {copied === e.seq ? <Check size={11} /> : <Copy size={11} />}
                {copied === e.seq ? t("Copied", "ចម្លងរួច") : t("Copy", "ចម្លង")}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t(
          "A subscript is written as the Coeng sign (U+17D2) followed by a consonant; the font renders it stacked below the previous letter. Consonant names, romanization, and series are from this tool set's Khmer romanization reference. ឡ has no subscript form.",
          "ជើងអក្សរសរសេរដោយសញ្ញា Coeng (U+17D2) បន្តដោយព្យញ្ជនៈ ហើយពុម្ពអក្សរបង្ហាញវាតម្រួតនៅក្រោមអក្សរមុន។ ឈ្មោះព្យញ្ជនៈ អក្សរឡាតាំង និងស៊េរី យកតាមឯកសារយោងខ្មែររបស់ឧបករណ៍នេះ។ ឡ គ្មានទម្រង់ជើងអក្សរទេ។",
        )}
      </p>
    </ToolShell>
  );
}

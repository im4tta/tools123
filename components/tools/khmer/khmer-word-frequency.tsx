"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextArea, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { useClipboard } from "@/components/ClipboardProvider";

// A token is any run of letters (Latin or Khmer), combining marks (Khmer
// dependent vowels, diacritics and the coeng sign) or numbers — i.e. words are
// split on whitespace and punctuation. Latin letters are lowercased before
// counting; Khmer has no case, so Khmer text is unaffected.
const TOKEN_RE = /[\p{L}\p{M}\p{N}]+/gu;

const SAMPLE =
  "ភាសាខ្មែរ ជាភាសាជាតិ របស់កម្ពុជា។ ភាសាខ្មែរ ជាភាសាផ្លូវការ ហើយ ភាសាខ្មែរ ប្រើប្រាស់ ជារៀងរាល់ថ្ងៃ។";

export default function KhmerWordFrequency() {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const [input, setInput] = useToolState("khmer-word-frequency:input", SAMPLE);
  const [search, setSearch] = useState("");

  const { total, unique, top, max, searchCount } = useMemo(() => {
    const tokens = (input.match(TOKEN_RE) ?? []).map((word) => word.toLowerCase());
    const counts = new Map<string, number>();
    for (const word of tokens) counts.set(word, (counts.get(word) ?? 0) + 1);
    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 20);
    const query = search.trim().toLowerCase();
    return {
      total: tokens.length,
      unique: counts.size,
      top: sorted,
      max: sorted[0]?.[1] ?? 0,
      searchCount: query ? (counts.get(query) ?? 0) : null,
    };
  }, [input, search]);

  return (
    <ToolShell
      title="Khmer Word Frequency"
      khmerTitle="ភាពញឹកញាប់នៃពាក្យខ្មែរ"
      description="Count how often each word appears in Khmer text: total tokens, unique words and a top-20 frequency list. Click any word to copy it."
      descriptionKm="រាប់ថាពាក្យនីមួយៗលេចឡើងប៉ុន្មានដងក្នុងអត្ថបទខ្មែរ៖ ចំនួនពាក្យសរុប ពាក្យផ្សេងគ្នា និងបញ្ជីកំពូល ២០។ ចុចលើពាក្យណាមួយដើម្បីចម្លង។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
          <div className="text-2xl font-semibold text-[var(--gold)]">{total}</div>
          <div className="mt-0.5 text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Total tokens", "ចំនួនពាក្យសរុប")}
          </div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
          <div className="text-2xl font-semibold text-[var(--gold)]">{unique}</div>
          <div className="mt-0.5 text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Unique tokens", "ពាក្យផ្សេងគ្នា")}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Most frequent words (top 20)", "ពាក្យញឹកញាប់បំផុត (កំពូល ២០)")}
          </h2>
          <span className="text-xs text-[var(--ink-faint)]">{t("Click a word to copy it", "ចុចលើពាក្យដើម្បីចម្លង")}</span>
        </div>
        {total === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-faint)]">
            {t("Type or paste text to see word frequency.", "វាយបញ្ចូល ឬបិទភ្ជាប់អត្ថបទ ដើម្បីមើលភាពញឹកញាប់នៃពាក្យ។")}
          </p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {top.map(([word, count]) => (
              <div key={word} className="flex items-center gap-3 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-sm">
                <button
                  type="button"
                  onClick={() => void copyText(word)}
                  title={t("Copy word", "ចម្លងពាក្យ")}
                  className="w-32 shrink-0 truncate text-left font-khmer text-[var(--ink)] transition hover:text-[var(--gold)]"
                >
                  {word}
                </button>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--ground-line)]">
                  <div className="h-full rounded-full bg-[var(--gold)]/60" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-mono-ui text-xs text-[var(--ink-dim)]">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Field
        label={t("Find a word", "ស្វែងរកពាក្យ")}
        hint={t("Count how many times a specific word appears in the text.", "រាប់ចំនួនដងដែលពាក្យណាមួយលេចឡើងក្នុងអត្ថបទ។")}
      >
        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} className="font-khmer" placeholder={t("Search…", "ស្វែងរក…")} />
      </Field>
      {searchCount !== null && (
        <p className="text-sm text-[var(--ink-dim)]">
          {searchCount > 0
            ? t(`“${search.trim()}” appears ${searchCount} time${searchCount === 1 ? "" : "s"}.`, `“${search.trim()}” លេចឡើង ${searchCount} ដង។`)
            : t("No matches for that word in the text.", "មិនមានពាក្យនេះក្នុងអត្ថបទទេ។")}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Note: modern Khmer is normally written with spaces between words. For unspaced or mixed text this tool splits on spaces and punctuation and counts the resulting tokens, so the list is an approximation of real word frequency. Latin letters are lowercased; Khmer has no case.",
          "កំណត់សម្គាល់៖ ភាសាខ្មែរសម័យទំនើប ជាធម្មតាសរសេរដោយដកឃ្លារវាងពាក្យ។ សម្រាប់អត្ថបទដែលគ្មានដកឃ្លា ឬដកឃ្លាមិនទៀងទាត់ ឧបករណ៍នេះបំបែកតាមដកឃ្លា និងវណ្ណយុត្តិ រួចរាប់ចំនួនពាក្យដែលបាន ដូច្នេះបញ្ជីនេះគ្រាន់តែជាការប៉ាន់ស្មានប៉ុណ្ណោះ។ អក្សរឡាតាំងត្រូវបានបម្លែងជាអក្សរតូច ព្រោះខ្មែរគ្មានអក្សរធំទេ។"
        )}
      </p>
    </ToolShell>
  );
}

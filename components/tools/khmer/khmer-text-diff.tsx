"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Row, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Seg = { text: string; status: "same" | "changed" | "added" | "removed" };

// Split a string into Unicode grapheme clusters (Keeps a stacked Khmer syllable —
// base + subscript + vowel — as one placeable unit, so diffs never split it).
function graphemes(text: string): string[] {
  try {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  } catch {
    return Array.from(text);
  }
}

/** Longest-common-subsequence (LCS) diff over grapheme clusters. */
function diffSegments(a: string[], b: string[]): Seg[] {
  const n = a.length, m = b.length;
  // dp[i][j] = LCS length of a[0..i) and b[0..j)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  // Walk back to build the diff.
  let i = n, j = m;
  const rev: Seg[] = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { rev.push({ text: a[i - 1], status: "same" }); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) { rev.push({ text: a[i - 1], status: "removed" }); i--; }
    else { rev.push({ text: b[j - 1], status: "added" }); j--; }
  }
  while (i > 0) { rev.push({ text: a[i - 1], status: "removed" }); i--; }
  while (j > 0) { rev.push({ text: b[j - 1], status: "added" }); j--; }
  return rev.reverse();
}

function statusClass(status: Seg["status"]): string {
  if (status === "added") return "bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 rounded-sm";
  if (status === "removed") return "bg-rose-500/20 text-rose-900 dark:text-rose-200 rounded-sm";
  return "";
}

export default function KhmerTextDiff() {
  const { text: t } = useLanguage();
  const [a, setA] = useToolState("khmer-text-diff:a", "រាជធានីភ្នំពេញ");
  const [b, setB] = useToolState("khmer-text-diff:b", "រាជធានីភ្នំពេញ ជាទីក្រុងធំបំផុត");
  const [mode, setMode] = useToolState<"chars" | "words">("khmer-text-diff:mode", "chars");

  const result = useMemo(() => {
    const segA = mode === "words" ? a.trim().split(/\s+/).filter(Boolean) : graphemes(a);
    const segB = mode === "words" ? b.trim().split(/\s+/).filter(Boolean) : graphemes(b);
    return diffSegments(segA, segB);
  }, [a, b, mode]);

  const added = result.filter((s) => s.status === "added").length;
  const removed = result.filter((s) => s.status === "removed").length;

  return (
    <ToolShell
      title="Khmer Text Diff"
      khmerTitle="ប្រៀបធៀបអត្ថបទខ្មែរ"
      description="Compare two Khmer texts and highlight what changed — at grapheme-cluster level so stacked syllables stay intact, with added/removed counts."
      descriptionKm="ប្រៀបធៀបអត្ថបទខ្មែរពីរ និងបន្លិចអ្វីដែលប្តូរប្រែ — នៅកម្រិតក្រុមអក្សរ ដើម្បីកុំឱ្យព្យាង្គពីរតួដាច់ពីគ្នា ជាមួយចំនួនបន្ថែម/លុប។"
    >
      <Field label={t("Granularity", "កម្រិត")}>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setMode("chars")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "chars" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>{t("Grapheme clusters", "ក្រុមអក្សរ")}</button>
          <button type="button" onClick={() => setMode("words")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "words" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>{t("Words", "ពាក្យ")}</button>
        </div>
      </Field>

      <Row>
        <Field label={t("Original", "អត្ថបទដើម")}>
          <TextArea value={a} onChange={(e) => setA(e.target.value)} rows={5} />
        </Field>
        <Field label={t("Changed", "អត្ថបទផ្លាស់ប្តូរ")}>
          <TextArea value={b} onChange={(e) => setB(e.target.value)} rows={5} />
        </Field>
      </Row>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Result", "លទ្ធផល")}</span>
          <span className="text-xs text-[var(--ink-faint)]">
            <span className="text-emerald-600 dark:text-emerald-300">+{added}</span>
            {" · "}
            <span className="text-rose-600 dark:text-rose-300">−{removed}</span>
          </span>
        </div>
        {result.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--ink-faint)]">{t("Identical text — no changes.", "អត្ថបទដូចគ្នា — គ្មានការប្តូរទេ។")}</p>
        ) : (
          <p lang="km" className="whitespace-pre-wrap break-words font-khmer leading-loose text-[var(--ink)]">
            {result.map((seg, i) => (
              <span key={i} className={statusClass(seg.status)}>{seg.text}</span>
            ))}
          </p>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Added text is green, removed text is red. Uses Unicode grapheme clusters so a base consonant with its subscript and vowel stays one unit.", "អត្ថបទបន្ថែមពណ៌បៃតង លុបពណ៌ក្រហម។ ប្រើក្រុមអក្សរ Unicode ដើម្បីឱ្យព្យញ្ជនៈជាមួយជើង និងស្រៈនៅជាមួយគ្នា។")}
      </p>
    </ToolShell>
  );
}

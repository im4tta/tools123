"use client";

// PDF Compare — find what actually changed between two versions of a document.
// Both files are read with pdf.js, reduced to reading-order lines by the shared
// extractor in lib/pdf-text, then compared page by page with a Myers-style LCS
// diff so unchanged lines stay aligned and only real edits are highlighted.
// This compares the TEXT layer: a scanned page has no text to compare, and
// pages that exist in only one file are reported as added or removed outright.
// Both files stay in your browser. Original Tools123 implementation.

import { useCallback, useMemo, useState } from "react";
import { FileUp, X, ArrowRight } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBytes } from "@/lib/pdfjs";
import { extractPdfPages } from "@/lib/pdf-text";

type OpType = "same" | "add" | "del";
interface DiffOp {
  type: OpType;
  text: string;
}

// Above this many lines on a page the quadratic LCS table is skipped — the page
// is still reported as changed, just without a line-by-line breakdown.
const LCS_LINE_CAP = 1200;

/**
 * Line-level longest-common-subsequence diff. Returns the edit script that turns
 * `a` into `b`, keeping unchanged lines so the two sides stay aligned.
 */
function diffLines(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  if (n > LCS_LINE_CAP || m > LCS_LINE_CAP) {
    return [
      ...a.map((text): DiffOp => ({ type: "del", text })),
      ...b.map((text): DiffOp => ({ type: "add", text })),
    ];
  }
  // dp[i][j] = LCS length of a[i..] and b[j..]
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", text: a[i] });
      i++;
    } else {
      ops.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "del", text: a[i++] });
  while (j < m) ops.push({ type: "add", text: b[j++] });
  return ops;
}

const toLines = (page: string): string[] =>
  page
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

interface Loaded {
  name: string;
  size: number;
  pages: string[];
}

interface PageDiff {
  page: number;
  status: "same" | "changed" | "onlyA" | "onlyB";
  ops: DiffOp[];
  added: number;
  removed: number;
}

function Slot({
  side,
  loaded,
  busy,
  onPick,
  onClear,
}: {
  side: string;
  loaded: Loaded | null;
  busy: boolean;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const { text: t } = useLanguage();
  if (loaded) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{side}</div>
          <div className="truncate text-sm font-semibold text-[var(--ink)]">{loaded.name}</div>
          <div className="text-xs text-[var(--ink-faint)]">
            {loaded.pages.length} {t("pages", "ទំព័រ")} · {formatBytes(loaded.size)}
          </div>
        </div>
        <button onClick={onClear} aria-label={t("Remove file", "ដកឯកសារចេញ")} className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]">
          <X size={15} />
        </button>
      </div>
    );
  }
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center transition hover:border-[var(--gold-dim)]">
      <FileUp size={22} className="text-[var(--ink-faint)]" />
      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{side}</span>
      <span className="text-sm font-medium text-[var(--ink)]">{busy ? t("Reading…", "កំពុងអាន…") : t("Choose a PDF", "ជ្រើសឯកសារ PDF")}</span>
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export default function PdfCompare() {
  const { text: t } = useLanguage();
  const [a, setA] = useState<Loaded | null>(null);
  const [b, setB] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSame, setShowSame] = useState(false);

  const load = useCallback(
    async (f: File, set: (l: Loaded | null) => void) => {
      if (f.type !== "application/pdf") {
        setError(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។"));
        return;
      }
      setBusy(true);
      setError("");
      try {
        const pages = await extractPdfPages(f);
        set({ name: f.name, size: f.size, pages });
      } catch {
        setError(t("Could not read this PDF — it may be corrupted or password-protected.", "មិនអាចអានឯកសារ PDF នេះ — វាប្រហែលខូច ឬបានការពារដោយពាក្យសម្ងាត់។"));
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const diffs = useMemo<PageDiff[]>(() => {
    if (!a || !b) return [];
    const count = Math.max(a.pages.length, b.pages.length);
    const out: PageDiff[] = [];
    for (let p = 0; p < count; p++) {
      const hasA = p < a.pages.length;
      const hasB = p < b.pages.length;
      const linesA = hasA ? toLines(a.pages[p]) : [];
      const linesB = hasB ? toLines(b.pages[p]) : [];
      if (!hasA || !hasB) {
        const ops = (!hasA ? linesB : linesA).map((text): DiffOp => ({ type: !hasA ? "add" : "del", text }));
        out.push({
          page: p + 1,
          status: !hasA ? "onlyB" : "onlyA",
          ops,
          added: !hasA ? linesB.length : 0,
          removed: !hasA ? 0 : linesA.length,
        });
        continue;
      }
      const ops = diffLines(linesA, linesB);
      const added = ops.filter((o) => o.type === "add").length;
      const removed = ops.filter((o) => o.type === "del").length;
      out.push({ page: p + 1, status: added || removed ? "changed" : "same", ops, added, removed });
    }
    return out;
  }, [a, b]);

  const changed = diffs.filter((d) => d.status !== "same");
  const totalAdded = diffs.reduce((n, d) => n + d.added, 0);
  const totalRemoved = diffs.reduce((n, d) => n + d.removed, 0);
  const bothEmpty = a && b && a.pages.every((p) => !p.trim()) && b.pages.every((p) => !p.trim());

  return (
    <ToolShell
      title="PDF Compare"
      khmerTitle="ប្រៀបធៀប PDF"
      description="See exactly what changed between two versions of a PDF. Both files are reduced to their text, lined up page by page, and compared — added lines are shown in green, removed lines in red, and pages that exist in only one file are called out. Useful for contracts, quotes, and revised reports. Both files stay in your browser and are never uploaded."
      descriptionKm="មើលឱ្យច្បាស់ថាអ្វីបានផ្លាស់ប្តូររវាង PDF ពីរជំនាន់។ ឯកសារទាំងពីរត្រូវបានស្រង់អត្ថបទ រៀបតាមទំព័រ រួចប្រៀបធៀប — បន្ទាត់បន្ថែមបង្ហាញពណ៌បៃតង បន្ទាត់ដកចេញពណ៌ក្រហម ហើយទំព័រដែលមានតែក្នុងឯកសារមួយត្រូវបានរាយ។ មានប្រយោជន៍សម្រាប់កិច្ចសន្យា សម្រង់តម្លៃ និងរបាយការណ៍កែសម្រួល។ ឯកសារទាំងពីរនៅក្នុងកម្មវិធីរុករក មិនផ្ទុកឡើងទេ។"
    >
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
        <Slot side={t("Original (A)", "ដើម (A)")} loaded={a} busy={busy} onPick={(f) => void load(f, setA)} onClear={() => setA(null)} />
        <Slot side={t("Revised (B)", "កែសម្រួល (B)")} loaded={b} busy={busy} onPick={(f) => void load(f, setB)} onClear={() => setB(null)} />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {a && b && (
        <>
          {bothEmpty ? (
            <div className="rounded-md border border-[var(--gold-dim)]/50 bg-[var(--gold)]/10 p-3 text-sm text-[var(--ink-dim)]">
              <p className="font-medium text-[var(--ink)]">{t("No text to compare", "គ្មានអត្ថបទត្រូវប្រៀបធៀប")}</p>
              <p className="mt-1">
                {t(
                  "Neither PDF has a text layer — both look like scans. This tool compares text, not pixels, so there is nothing it can line up. Run them through an OCR tool first.",
                  "ឯកសារ PDF ទាំងពីរគ្មានស្រទាប់អត្ថបទ — ទំនងជារូបស្កេនទាំងពីរ។ ឧបករណ៍នេះប្រៀបធៀបអត្ថបទ មិនមែនភីកសែលទេ។ សូមប្រើ OCR ជាមុនសិន។",
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-sm">
                <span className="font-semibold text-[var(--ink)]">
                  {changed.length === 0
                    ? t("No differences found", "រកមិនឃើញភាពខុសគ្នា")
                    : t(`${changed.length} of ${diffs.length} pages differ`, `ទំព័រ ${changed.length} ក្នុងចំណោម ${diffs.length} ខុសគ្នា`)}
                </span>
                {(totalAdded > 0 || totalRemoved > 0) && (
                  <span className="flex items-center gap-3 text-xs">
                    <span className="text-[var(--success)]">+{totalAdded} {t("added", "បន្ថែម")}</span>
                    <span className="text-[var(--danger)]">−{totalRemoved} {t("removed", "ដកចេញ")}</span>
                  </span>
                )}
                {a.pages.length !== b.pages.length && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-faint)]">
                    {a.pages.length} <ArrowRight size={11} /> {b.pages.length} {t("pages", "ទំព័រ")}
                  </span>
                )}
                <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-dim)]">
                  <input type="checkbox" checked={showSame} onChange={(e) => setShowSame(e.target.checked)} className="accent-[var(--gold)]" />
                  {t("Show unchanged lines", "បង្ហាញបន្ទាត់មិនប្តូរ")}
                </label>
              </div>

              <div className="space-y-3">
                {(showSame ? diffs : changed).map((d) => (
                  <div key={d.page} className="overflow-hidden rounded-xl border border-[var(--ground-line)]">
                    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
                      <span className="text-sm font-semibold text-[var(--ink)]">
                        {t("Page", "ទំព័រ")} {d.page}
                      </span>
                      {d.status === "onlyA" && (
                        <span className="rounded-full bg-[var(--danger)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--danger)]">
                          {t("only in A — removed", "មានតែក្នុង A — ដកចេញ")}
                        </span>
                      )}
                      {d.status === "onlyB" && (
                        <span className="rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
                          {t("only in B — added", "មានតែក្នុង B — បន្ថែម")}
                        </span>
                      )}
                      {d.status === "same" && <span className="text-xs text-[var(--ink-faint)]">{t("identical", "ដូចគ្នា")}</span>}
                      {d.status === "changed" && (
                        <span className="text-xs">
                          <span className="text-[var(--success)]">+{d.added}</span> <span className="text-[var(--danger)]">−{d.removed}</span>
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-auto bg-[var(--ground)] p-2">
                      {d.ops.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-[var(--ink-faint)]">{t("This page has no text.", "ទំព័រនេះគ្មានអត្ថបទ។")}</p>
                      ) : (
                        d.ops
                          .filter((o) => showSame || o.type !== "same")
                          .map((o, k) => (
                            <div
                              key={k}
                              lang={/[ក-៿]/.test(o.text) ? "km" : undefined}
                              className={`whitespace-pre-wrap break-words px-2 py-0.5 text-xs leading-relaxed ${
                                o.type === "add"
                                  ? "bg-[var(--success)]/12 text-[var(--success)]"
                                  : o.type === "del"
                                    ? "bg-[var(--danger)]/12 text-[var(--danger)]"
                                    : "text-[var(--ink-dim)]"
                              }`}
                            >
                              <span className="mr-2 select-none opacity-60">{o.type === "add" ? "+" : o.type === "del" ? "−" : " "}</span>
                              {o.text}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Text extraction: pdf.js (Apache-2.0, Mozilla).", "ការស្រង់អត្ថបទ: pdf.js (Apache-2.0, Mozilla)។")}</li>
          <li>{t("Line diff uses a standard longest-common-subsequence algorithm, implemented here by Tools123.", "ការប្រៀបធៀបបន្ទាត់ប្រើក្បួន longest-common-subsequence ស្តង់ដារ សរសេរដោយ Tools123។")}</li>
          <li>{t("Compares the text layer only — it does not detect changes to images or layout. Files are processed locally.", "ប្រៀបធៀបតែស្រទាប់អត្ថបទ — មិនរកឃើញការប្តូររូបភាព ឬប្លង់ទេ។ ឯកសារដំណើរការក្នុងម៉ាស៊ីន។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

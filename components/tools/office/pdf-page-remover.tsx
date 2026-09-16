"use client";

// PDF Page Remover — delete specific pages from a PDF and keep the rest.
// Pick pages to drop either by typing page numbers/ranges (e.g. "1, 3, 5-8")
// or by clicking page thumbnails; the two stay in sync. Kept pages are copied
// with pdf-lib so their original content and rotation are preserved. All local:
// the file is read and rebuilt in the browser with pdf.js + pdf-lib, never
// uploaded. Original Tools123 implementation.

import { useCallback, useState } from "react";
import { FileUp, Trash2, Download, X } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { recordExport } from "@/lib/export";

// Above this page count the thumbnail grid is skipped to stay responsive on
// large documents; the page-number box still works as a text-only fallback.
const THUMB_CAP = 100;

interface PageThumb {
  index: number; // 0-based
  thumb: string;
}

/**
 * Parse a range expression like "1, 3, 5-8, 12" into a Set of 1-based page
 * numbers, clamped to [1, max]. Tolerates spaces, reversed ranges (8-5), and
 * ignores empty or non-numeric tokens.
 */
function parseRanges(text: string, max: number): Set<number> {
  const out = new Set<number>();
  for (const rawTok of text.split(",")) {
    const tok = rawTok.trim();
    if (!tok) continue;
    const range = tok.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      let a = parseInt(range[1], 10);
      let b = parseInt(range[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p++) if (p >= 1 && p <= max) out.add(p);
    } else if (/^\d+$/.test(tok)) {
      const p = parseInt(tok, 10);
      if (p >= 1 && p <= max) out.add(p);
    }
  }
  return out;
}

/** Format 1-based page numbers into a canonical compact expression, e.g. "1, 3, 5-8". */
function formatRanges(nums: Iterable<number>): string {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j + 1;
  }
  return parts.join(", ");
}

export default function PdfPageRemover() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [thumbsHidden, setThumbsHidden] = useState(false);
  const [rangeText, setRangeText] = useState("");
  const [remove, setRemove] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        setError(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។"));
        return;
      }
      setBusy(true);
      setError("");
      setStatus("");
      setPages([]);
      setRemove(new Set());
      setRangeText("");
      setThumbsHidden(false);
      try {
        const pdfjs = await loadPdfJs();
        const buf = await f.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const count = doc.numPages;
        setFile(f);
        setPageCount(count);
        setFileInfo(`${count} ${t("pages", "ទំព័រ")} · ${formatBytes(f.size)}`);
        if (count > THUMB_CAP) {
          setThumbsHidden(true);
        } else {
          const items: PageThumb[] = [];
          for (let i = 1; i <= count; i++) {
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (ctx) await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
            items.push({ index: i - 1, thumb: canvas.toDataURL("image/png") });
          }
          setPages(items);
        }
      } catch {
        setError(t("Could not read this PDF — it may be corrupted or password-protected.", "មិនអាចអានឯកសារ PDF នេះ — វាប្រហែលខូច ឬបានការពារដោយពាក្យសម្ងាត់។"));
        setFile(null);
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const onRangeText = (value: string) => {
    setRangeText(value);
    setRemove(parseRanges(value, pageCount));
    setStatus("");
  };

  const togglePage = (index: number) => {
    const oneBased = index + 1;
    const next = new Set(remove);
    if (next.has(oneBased)) next.delete(oneBased);
    else next.add(oneBased);
    setRemove(next);
    setRangeText(formatRanges(next));
    setStatus("");
  };

  const clearSelection = () => {
    setRemove(new Set());
    setRangeText("");
    setStatus("");
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setRemove(new Set());
    setRangeText("");
    setStatus("");
    setError("");
    setPageCount(0);
    setThumbsHidden(false);
  };

  const removeCount = remove.size;
  const remaining = pageCount - removeCount;

  const exportPdf = useCallback(async () => {
    if (!file || removeCount === 0 || remaining <= 0) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const keepIndices: number[] = [];
      for (let i = 0; i < pageCount; i++) if (!remove.has(i + 1)) keepIndices.push(i);
      const copied = await out.copyPages(src, keepIndices);
      copied.forEach((page) => out.addPage(page));
      const outBytes = await out.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, "")}_pages-removed.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
      setStatus(
        t(
          `Saved — ${keepIndices.length} page(s) kept · ${formatBytes(blob.size)}`,
          `រក្សាទុករួច — រក្សា ${keepIndices.length} ទំព័រ · ${formatBytes(blob.size)}`,
        ),
      );
    } catch {
      setError(t("Could not build the PDF — try again or reload the source file.", "មិនអាចបង្កើត PDF បានទេ — សូមព្យាយាមម្តងទៀត ឬផ្ទុកឯកសារឡើងវិញ។"));
    } finally {
      setBusy(false);
    }
  }, [file, remove, removeCount, remaining, pageCount, t]);

  return (
    <ToolShell
      title="PDF Page Remover"
      khmerTitle="លុបទំព័រ PDF"
      description="Delete specific pages from a PDF and keep the rest. Type the page numbers or ranges to drop (like 1, 3, 5-8), or click page thumbnails to mark them, then download the trimmed file. Kept pages keep their original content and rotation — everything runs locally in your browser and nothing is uploaded."
      descriptionKm="លុបទំព័រជាក់លាក់ចេញពី PDF ហើយរក្សាទំព័រនៅសល់។ វាយលេខទំព័រ ឬចន្លោះដែលត្រូវលុប (ដូចជា 1, 3, 5-8) ឬចុចរូបតូចទំព័រដើម្បីសម្គាល់ រួចទាញយកឯកសារដែលកាត់រួច។ ទំព័រដែលរក្សាទុករក្សាមាតិកា និងទិសដៅដើម — ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក គ្មានការផ្ទុកឡើងទេ។"
    >
      {!file ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{busy ? t("Reading…", "កំពុងអាន…") : t("Choose a PDF", "ជ្រើសឯកសារ PDF")}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void load(f);
                e.target.value = "";
              }}
            />
          </label>
          {error && <p className="mt-3 text-center text-sm text-[var(--danger)]">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--ink)]">{file.name}</div>
              <div className="text-xs text-[var(--ink-faint)]">{fileInfo}</div>
            </div>
            <button onClick={reset} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
              {t("Choose another", "ជ្រើសផ្សេង")}
            </button>
          </div>

          <Field
            label="Pages to remove"
            labelKm="ទំព័រដែលត្រូវលុប"
            hint="e.g. 1, 3, 5-8"
            hintKm="ឧ. 1, 3, 5-8"
          >
            <TextInput value={rangeText} onChange={(e) => onRangeText(e.target.value)} inputMode="numeric" />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-faint)]">
            <span>
              {pageCount} {t("pages", "ទំព័រ")} · {removeCount} {t("to remove", "ត្រូវលុប")} · {Math.max(remaining, 0)} {t("will remain", "នៅសល់")}
            </span>
            {removeCount > 0 && (
              <button onClick={clearSelection} className="flex items-center gap-1 hover:text-[var(--ink)]">
                <X size={11} /> {t("Clear selection", "សម្អាតការជ្រើស")}
              </button>
            )}
          </div>

          {thumbsHidden ? (
            <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-xs text-[var(--ink-dim)]">
              {t(
                `Page previews are hidden for large files (over ${THUMB_CAP} pages). Enter the page numbers to remove above.`,
                `រូបតូចទំព័រត្រូវលាក់សម្រាប់ឯកសារធំ (លើសពី ${THUMB_CAP} ទំព័រ)។ សូមវាយលេខទំព័រដែលត្រូវលុបខាងលើ។`,
              )}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {pages.map((p) => {
                const marked = remove.has(p.index + 1);
                return (
                  <button
                    key={p.index}
                    type="button"
                    onClick={() => togglePage(p.index)}
                    aria-pressed={marked}
                    aria-label={t(`Page ${p.index + 1}`, `ទំព័រ ${p.index + 1}`)}
                    className={`group relative rounded-md border p-1.5 text-left transition ${
                      marked ? "border-[var(--danger)]/60 bg-[var(--danger)]/10" : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold-dim)]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb} alt="" className={`w-full rounded object-contain transition ${marked ? "opacity-40" : ""}`} />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
                      <span>#{p.index + 1}</span>
                      {marked && <Trash2 size={11} className="text-[var(--danger)]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {removeCount > 0 && remaining <= 0 && (
            <p className="text-sm text-[var(--danger)]">{t("You can't remove every page — keep at least one.", "អ្នកមិនអាចលុបគ្រប់ទំព័របានទេ — សូមរក្សាទុកយ៉ាងតិចមួយ។")}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={exportPdf} disabled={busy || removeCount === 0 || remaining <= 0} className="inline-flex items-center gap-2">
              <Download size={15} />
              {busy ? t("Working…", "កំពុងដំណើរការ…") : t(`Remove ${removeCount} page(s) & download`, `លុប ${removeCount} ទំព័រ ហើយទាញយក`)}
            </Button>
            {status && <span className="text-xs text-[var(--ink-dim)]">{status}</span>}
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      )}
    </ToolShell>
  );
}

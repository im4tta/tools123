"use client";

// PDF Text Extractor — pull the real, selectable text out of a PDF.
// Text is read with pdf.js and reassembled into reading-order lines by the
// shared extractor in lib/pdf-text (also used by PDF Compare). A PDF made by
// scanning has no text layer at all — that case is detected and called out
// rather than silently returning an empty box. Runs entirely in your browser.
// Original Tools123 implementation.

import { useCallback, useState } from "react";
import { FileUp, Download, FileText } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBytes } from "@/lib/pdfjs";
import { extractPdfPages } from "@/lib/pdf-text";
import { downloadBlob } from "@/lib/download";
import { recordExport } from "@/lib/export";

interface PageText {
  page: number;
  text: string;
}

export default function PdfTextExtractor() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState("");
  const [pages, setPages] = useState<PageText[]>([]);
  const [markers, setMarkers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        setError(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។"));
        return;
      }
      setBusy(true);
      setError("");
      setPages([]);
      try {
        const texts = await extractPdfPages(f);
        const out: PageText[] = texts.map((text, i) => ({ page: i + 1, text }));
        setFile(f);
        setPages(out);
        setInfo(`${texts.length} ${t("pages", "ទំព័រ")} · ${formatBytes(f.size)}`);
      } catch {
        setError(t("Could not read this PDF — it may be corrupted or password-protected.", "មិនអាចអានឯកសារ PDF នេះ — វាប្រហែលខូច ឬបានការពារដោយពាក្យសម្ងាត់។"));
        setFile(null);
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const joined = pages
    .map((p) => (markers ? `--- ${t("Page", "ទំព័រ")} ${p.page} ---\n${p.text}` : p.text))
    .join("\n\n")
    .trim();

  const charCount = pages.reduce((n, p) => n + p.text.replace(/\s/g, "").length, 0);
  const emptyPages = pages.filter((p) => !p.text.trim()).length;
  const looksScanned = pages.length > 0 && charCount === 0;

  const save = () => {
    if (!joined) return;
    downloadBlob(new Blob([joined], { type: "text/plain;charset=utf-8" }), `${file?.name.replace(/\.pdf$/i, "") ?? "pdf"}.txt`);
    recordExport();
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setError("");
    setInfo("");
  };

  return (
    <ToolShell
      title="PDF Text Extractor"
      khmerTitle="ស្រង់អត្ថបទពី PDF"
      description="Pull the selectable text out of a PDF, page by page, then copy it or download it as a .txt file. Lines are rebuilt in reading order, so Khmer and English come out in the right sequence. If the PDF is a scan with no text layer, the tool says so instead of handing back an empty box. Everything runs in your browser — the file is never uploaded."
      descriptionKm="ស្រង់អត្ថបទដែលអាចជ្រើសបានចេញពី PDF មួយទំព័រម្តងៗ រួចចម្លង ឬទាញយកជាឯកសារ .txt។ បន្ទាត់ត្រូវបានរៀបតាមលំដាប់អាន ដូច្នេះអក្សរខ្មែរ និងអង់គ្លេសចេញមកត្រឹមត្រូវ។ បើ PDF ជារូបស្កេនគ្មានស្រទាប់អត្ថបទ ឧបករណ៍នឹងប្រាប់អ្នក។ ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក — ឯកសារមិនត្រូវផ្ទុកឡើងទេ។"
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
              <div className="text-xs text-[var(--ink-faint)]">{info}</div>
            </div>
            <button onClick={reset} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
              {t("Choose another", "ជ្រើសផ្សេង")}
            </button>
          </div>

          {looksScanned ? (
            <div className="rounded-md border border-[var(--gold-dim)]/50 bg-[var(--gold)]/10 p-3 text-sm text-[var(--ink-dim)]">
              <p className="font-medium text-[var(--ink)]">{t("No text layer found", "រកមិនឃើញស្រទាប់អត្ថបទ")}</p>
              <p className="mt-1">
                {t(
                  "Every page in this PDF is an image, so there is no text to extract. It was most likely produced by a scanner or a photo. Try the Khmer OCR or Screenshot OCR tools to read the characters from the image instead.",
                  "គ្រប់ទំព័រក្នុង PDF នេះសុទ្ធតែជារូបភាព ដូច្នេះគ្មានអត្ថបទត្រូវស្រង់ទេ។ វាទំនងជាបានមកពីម៉ាស៊ីនស្កេន ឬរូបថត។ សូមសាកល្បងឧបករណ៍ Khmer OCR ឬ Screenshot OCR ដើម្បីអានតួអក្សរចេញពីរូបភាពជំនួសវិញ។",
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
                  <input type="checkbox" checked={markers} onChange={(e) => setMarkers(e.target.checked)} className="accent-[var(--gold)]" />
                  {t("Mark page breaks", "សម្គាល់ការបំបែកទំព័រ")}
                </label>
                <span className="text-xs text-[var(--ink-faint)]">
                  {charCount.toLocaleString()} {t("characters", "តួអក្សរ")}
                  {emptyPages > 0 && ` · ${emptyPages} ${t("page(s) with no text", "ទំព័រគ្មានអត្ថបទ")}`}
                </span>
              </div>

              <Output value={joined} label={t("Extracted text", "អត្ថបទដែលស្រង់បាន")} mono={false} />

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={save} disabled={!joined} className="inline-flex items-center gap-2">
                  <Download size={15} /> {t("Download .txt", "ទាញយក .txt")}
                </Button>
                {emptyPages > 0 && emptyPages < pages.length && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-faint)]">
                    <FileText size={12} />
                    {t("Pages with no text are scans — OCR those separately.", "ទំព័រគ្មានអត្ថបទជារូបស្កេន — សូមប្រើ OCR ដោយឡែក។")}
                  </span>
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Text extraction: pdf.js (Apache-2.0, Mozilla).", "ការស្រង់អត្ថបទ: pdf.js (Apache-2.0, Mozilla)។")}</li>
          <li>{t("Line reconstruction is an original Tools123 implementation; files are processed locally and never uploaded.", "ការរៀបបន្ទាត់ឡើងវិញជាការសរសេរដើមរបស់ Tools123; ឯកសារដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

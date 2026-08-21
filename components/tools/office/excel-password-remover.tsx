"use client";
import { useRef, useState } from "react";
import JSZip from "jszip";
import { Download, FileLock2, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

interface SheetHit {
  name: string;
  index: number;
}

interface Scan {
  sheets: SheetHit[];
  workbook: boolean;
  modify: boolean;
}

function stripProtection(xml: string): string {
  return xml
    .replace(/<sheetProtection\b[^>]*\/?>/g, "")
    .replace(/<\/sheetProtection>/g, "")
    .replace(/<workbookProtection\b[^>]*\/?>/g, "")
    .replace(/<\/workbookProtection>/g, "")
    .replace(/<fileSharing\b[^>]*\/?>/g, "")
    .replace(/<\/fileSharing>/g, "")
    .replace(/<writeProtection\b[^>]*\/?>/g, "")
    .replace(/<\/writeProtection>/g, "");
}

export default function ExcelPasswordRemover() {
  const { text: t } = useLanguage();
  const [fileName, setFileName] = useState<string | null>(null);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load(file: File) {
    setBusy(true);
    setError("");
    try {
      const data = await file.arrayBuffer();
      const z = await JSZip.loadAsync(data);

      const wb = (await z.file("xl/workbook.xml")?.async("string")) ?? "";
      const names: string[] = [];
      const nameRe = /<sheet[^>]*\bname="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = nameRe.exec(wb)) !== null) names.push(m[1]);

      const sheets: SheetHit[] = [];
      const sheetPaths = Object.keys(z.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
      for (const p of sheetPaths) {
        const xml = await z.file(p)!.async("string");
        if (xml.includes("<sheetProtection")) {
          const idx = Number(p.match(/sheet(\d+)\.xml/)![1]);
          sheets.push({ name: names[idx - 1] ?? `Sheet ${idx}`, index: idx });
        }
      }

      setZip(z);
      setFileName(file.name);
      setScan({
        sheets,
        workbook: wb.includes("<workbookProtection"),
        modify: wb.includes("<fileSharing") || wb.includes("<writeProtection"),
      });
    } catch {
      setZip(null);
      setFileName(null);
      setScan(null);
      setError(t("Could not read this file — it may be encrypted with a file-open password, or it is not a valid .xlsx/.xlsm file.", "មិនអាចអានឯកសារនេះបាន — វាអាចត្រូវបានអ៊ិនគ្រីបដោយពាក្យសម្ងាត់បើកឯកសារ ឬមិនមែនជាឯកសារ .xlsx/.xlsm ត្រឹមត្រូវ។"));
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!zip) return;
    setBusy(true);
    setError("");
    try {
      const sheetPaths = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
      for (const p of sheetPaths) {
        const xml = await zip.file(p)!.async("string");
        zip.file(p, stripProtection(xml));
      }
      if (zip.file("xl/workbook.xml")) {
        const wb = await zip.file("xl/workbook.xml")!.async("string");
        zip.file("xl/workbook.xml", stripProtection(wb));
      }
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const ext = /\.xlsm$/i.test(fileName ?? "") ? ".xlsm" : ".xlsx";
      const base = (fileName ?? "workbook").replace(/\.(xlsx|xlsm)$/i, "");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}-unprotected${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError(t("Failed to process the file.", "មិនអាចដំណើរការឯកសារបានទេ។"));
    } finally {
      setBusy(false);
    }
  }

  const anyProtected = scan && (scan.sheets.length > 0 || scan.workbook || scan.modify);

  return (
    <ToolShell
      title="Excel Password Remover"
      khmerTitle="ឧបករណ៍ដកពាក្យសម្ងាត់ Excel"
      description="Remove worksheet and workbook protection passwords from an .xlsx or .xlsm file — entirely in your browser."
      descriptionKm="ដកពាក្យសម្ងាត់ការពារសន្លឹក និងសៀវភៅការងារពីឯកសារ .xlsx ឬ .xlsm — ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <input ref={fileRef} type="file" accept=".xlsx,.xlsm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ""; }} />

      <div className="space-y-4">
        {!zip && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-12 text-center transition hover:border-[var(--gold)]/40"
          >
            <Upload size={32} className="text-[var(--ink-faint)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--ink)]">{t("Drop an .xlsx or .xlsm file, or click to browse", "ទម្លាក់ឯកសារ .xlsx ឬ .xlsm ឬចុចដើម្បីជ្រើសរើស")}</div>
              <div className="mt-1 text-xs text-[var(--ink-faint)]">{t("The file is processed locally and never uploaded.", "ឯកសារត្រូវបានដំណើរការក្នុងឧបករណ៍របស់អ្នក ហើយមិនត្រូវបានបញ្ជូនឡើងទេ។")}</div>
            </div>
          </button>
        )}

        {zip && scan && (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <FileSpreadsheet size={22} className="shrink-0 text-[var(--teal)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div>
                <div className="text-xs text-[var(--ink-faint)]">{scan.sheets.length} {t("protected worksheet(s)", "សន្លឹកដែលបានការពារ")}</div>
              </div>
              <button onClick={() => { setZip(null); setScan(null); setFileName(null); }} className="rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
                {t("Change", "ផ្លាស់ប្តូរ")}
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-dim)]">{t("Protected worksheets", "សន្លឹកដែលបានការពារ")}</span>
                <span className="font-mono-ui text-[var(--ink)]">{scan.sheets.length}</span>
              </div>
              {scan.sheets.map((s) => (
                <div key={s.index} className="flex items-center gap-2 text-xs text-[var(--ink-dim)]">
                  <FileLock2 size={13} className="text-[var(--gold)]" />
                  {s.name}
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-dim)]">{t("Workbook structure protection", "ការការពាររចនាសម្ព័ន្ធសៀវភៅ")}</span>
                <span className="font-mono-ui text-[var(--ink)]">{scan.workbook ? t("Yes", "មាន") : t("No", "គ្មាន")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-dim)]">{t("Modify / write password", "ពាក្យសម្ងាត់កែប្រែ / សរសេរ")}</span>
                <span className="font-mono-ui text-[var(--ink)]">{scan.modify ? t("Yes", "មាន") : t("No", "គ្មាន")}</span>
              </div>
            </div>

            {!anyProtected && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 p-4 text-sm text-[var(--ink)]">
                <ShieldCheck size={16} className="text-[var(--teal)]" />
                {t("No protection found — this workbook is already open.", "រកមិនឃើញការការពារ — សៀវភៅនេះបើកចំហរួចហើយ។")}
              </div>
            )}

            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
            >
              <Download size={16} />
              {busy ? t("Processing…", "កំពុងដំណើរការ…") : t("Remove protection & download", "ដកការការពារ និងទាញយក")}
            </button>
          </>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("This removes worksheet and workbook protection passwords by editing the file's XML. It does not remove file-open (AES) encryption, and it does not recover the original password. Use only on files you own or are authorized to modify.", "ឧបករណ៍នេះដកពាក្យសម្ងាត់ការពារសន្លឹក និងសៀវភៅ ដោយកែសម្រួល XML របស់ឯកសារ។ វាមិនដកការអ៊ិនគ្រីបបើកឯកសារ (AES) និងមិនស្តារពាក្យសម្ងាត់ដើមឡើងវិញទេ។ ប្រើតែលើឯកសារដែលអ្នកជាម្ចាស់ ឬមានសិទ្ធិកែប្រែ។")}
        </p>
      </div>
    </ToolShell>
  );
}
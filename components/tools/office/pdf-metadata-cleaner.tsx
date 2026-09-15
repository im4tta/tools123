"use client";

// PDF Metadata & Privacy Cleaner — view, edit, or strip the hidden Info
// metadata (title, author, producer, dates, …) a PDF carries. All local:
// the file is read and rewritten with pdf-lib in the browser, never uploaded.

import { useCallback, useRef, useState } from "react";
import { FileUp, Eraser, Download, ShieldCheck } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBytes } from "@/lib/pdfjs";
import { recordExport } from "@/lib/export";

interface Meta {
  title: string; author: string; subject: string; keywords: string;
  creator: string; producer: string; created: string; modified: string;
}

const EMPTY: Meta = { title: "", author: "", subject: "", keywords: "", creator: "", producer: "", created: "", modified: "" };

function toLocalInput(d: Date | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PdfMetadataCleaner() {
  const { text: t } = useLanguage();
  const [meta, setMeta] = useState<Meta>(EMPTY);
  const [fileName, setFileName] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const bytesRef = useRef<ArrayBuffer | null>(null);

  const set = (k: keyof Meta, v: string) => setMeta((m) => ({ ...m, [k]: v }));

  const load = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setStatus(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។")); return; }
    setBusy(true);
    setStatus("");
    try {
      const bytes = await file.arrayBuffer();
      bytesRef.current = bytes;
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      setMeta({
        title: doc.getTitle() ?? "",
        author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "",
        keywords: doc.getKeywords() ?? "",
        creator: doc.getCreator() ?? "",
        producer: doc.getProducer() ?? "",
        created: toLocalInput(doc.getCreationDate()),
        modified: toLocalInput(doc.getModificationDate()),
      });
      setFileName(file.name);
      setFileInfo(`${doc.getPageCount()} ${t("pages", "ទំព័រ")} · ${formatBytes(file.size)}`);
      setLoaded(true);
    } catch {
      setStatus(t("Could not read this PDF (it may be encrypted).", "មិនអាចអានឯកសារ PDF នេះ (ប្រហែលបានអ៊ិនគ្រីប)។"));
    } finally { setBusy(false); }
  }, [t]);

  const stripAll = () => {
    const now = toLocalInput(new Date());
    setMeta({ ...EMPTY, created: now, modified: now });
    setStatus(t("Cleared — click Save to write the cleaned file.", "សម្អាតរួច — ចុចរក្សាទុកដើម្បីសរសេរឯកសារ។"));
  };

  const save = useCallback(async () => {
    if (!bytesRef.current) return;
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytesRef.current, { ignoreEncryption: true, updateMetadata: false });
      doc.setTitle(meta.title);
      doc.setAuthor(meta.author);
      doc.setSubject(meta.subject);
      doc.setKeywords(meta.keywords ? meta.keywords.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : []);
      doc.setCreator(meta.creator);
      doc.setProducer(meta.producer);
      if (meta.created) doc.setCreationDate(new Date(meta.created));
      if (meta.modified) doc.setModificationDate(new Date(meta.modified));
      const out = await doc.save({ updateFieldAppearances: false });
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}_cleaned.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
      setStatus(t("Saved cleaned PDF.", "រក្សាទុក PDF ស្អាតរួច។"));
    } catch {
      setStatus(t("Could not write the file.", "មិនអាចសរសេរឯកសារបានទេ។"));
    } finally { setBusy(false); }
  }, [meta, fileName, t]);

  const fields: { key: keyof Meta; en: string; km: string; date?: boolean }[] = [
    { key: "title", en: "Title", km: "ចំណងជើង" },
    { key: "author", en: "Author", km: "អ្នកនិពន្ធ" },
    { key: "subject", en: "Subject", km: "ប្រធានបទ" },
    { key: "keywords", en: "Keywords", km: "ពាក្យគន្លឹះ" },
    { key: "creator", en: "Creator app", km: "កម្មវិធីបង្កើត" },
    { key: "producer", en: "Producer", km: "កម្មវិធីផលិត" },
    { key: "created", en: "Created", km: "កាលបរិច្ឆេទបង្កើត", date: true },
    { key: "modified", en: "Modified", km: "កាលបរិច្ឆេទកែ", date: true },
  ];

  return (
    <ToolShell
      title="PDF Metadata Cleaner"
      khmerTitle="សម្អាតទិន្នន័យមេតា PDF"
      description="See and edit the hidden metadata a PDF carries — title, author, the app that made it, creation dates — or strip it all in one click before you share the file. Runs locally; nothing is uploaded."
      descriptionKm="មើល និងកែទិន្នន័យមេតាដែលលាក់ក្នុង PDF — ចំណងជើង អ្នកនិពន្ធ កម្មវិធីបង្កើត កាលបរិច្ឆេទ — ឬលុបចោលទាំងអស់ក្នុងចុចមួយ មុនពេលចែករំលែក។ ដំណើរការក្នុងម៉ាស៊ីន គ្មានការផ្ទុកឡើង។"
    >
      {!loaded ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{t("Choose a PDF", "ជ្រើសឯកសារ PDF")}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
          </label>
          {status && <p className="mt-3 text-center text-sm text-[var(--danger)]">{status}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div><div className="text-xs text-[var(--ink-faint)]">{fileInfo}</div></div>
            <button onClick={() => { setLoaded(false); setStatus(""); bytesRef.current = null; }} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">{t("Choose another", "ជ្រើសផ្សេង")}</button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.key} label={t(f.en, f.km)}>
                {f.date ? (
                  <input type="datetime-local" value={meta[f.key]} onChange={(e) => set(f.key, e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
                ) : (
                  <TextInput value={meta[f.key]} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </Field>
            ))}
          </div>

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--ink-faint)]">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-[var(--success)]" />
            {t("Clears the standard document-info fields. Some PDFs also embed XMP metadata; the core identifying fields above are what's rewritten here.",
              "សម្អាតវាលព័ត៌មានឯកសារស្តង់ដារ។ ឯកសារ PDF ខ្លះមានទិន្នន័យ XMP បន្ថែម; វាលសម្គាល់សំខាន់ខាងលើគឺជាអ្វីដែលត្រូវសរសេរឡើងវិញ។")}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={stripAll} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40"><Eraser size={14} />{t("Strip all metadata", "លុបមេតាទាំងអស់")}</button>
            <Button onClick={save} disabled={busy} className="inline-flex items-center gap-2"><Download size={15} />{busy ? t("Working…", "កំពុងដំណើរការ…") : t("Save cleaned PDF", "រក្សាទុក PDF ស្អាត")}</Button>
            {status && <span className="text-xs text-[var(--ink-dim)]">{status}</span>}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

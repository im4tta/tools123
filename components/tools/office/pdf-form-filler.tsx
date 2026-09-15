"use client";

// PDF Form Filler & Flattener — fill a PDF's interactive AcroForm fields in the
// browser, preview the result live, then optionally flatten so the values are
// baked in and can't be changed. All local (pdf-lib); nothing is uploaded.

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Download, Lock } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { formatBytes } from "@/lib/pdfjs";
import { recordExport } from "@/lib/export";

type FieldType = "text" | "checkbox" | "radio" | "dropdown" | "optionlist";
interface FormField { name: string; type: FieldType; options?: string[]; value: string }

export default function PdfFormFiller() {
  const { text: t } = useLanguage();
  const [fields, setFields] = useState<FormField[]>([]);
  const [flatten, setFlatten] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [noFields, setNoFields] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const prevUrl = useRef<string | null>(null);

  const load = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setStatus(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។")); return; }
    setBusy(true);
    setStatus("");
    try {
      const bytes = await file.arrayBuffer();
      bytesRef.current = bytes;
      const mod = await import("pdf-lib");
      const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } = mod;
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = doc.getForm();
      const out: FormField[] = [];
      for (const f of form.getFields()) {
        const name = f.getName();
        if (f instanceof PDFTextField) out.push({ name, type: "text", value: f.getText() ?? "" });
        else if (f instanceof PDFCheckBox) out.push({ name, type: "checkbox", value: f.isChecked() ? "on" : "" });
        else if (f instanceof PDFRadioGroup) out.push({ name, type: "radio", options: f.getOptions(), value: f.getSelected() ?? "" });
        else if (f instanceof PDFDropdown) out.push({ name, type: "dropdown", options: f.getOptions(), value: f.getSelected()[0] ?? "" });
        else if (f instanceof PDFOptionList) out.push({ name, type: "optionlist", options: f.getOptions(), value: f.getSelected()[0] ?? "" });
      }
      setFields(out);
      setNoFields(out.length === 0);
      setFileName(file.name);
      setFileInfo(`${doc.getPageCount()} ${t("pages", "ទំព័រ")} · ${out.length} ${t("fields", "វាល")} · ${formatBytes(file.size)}`);
      setLoaded(true);
    } catch {
      setStatus(t("Could not read this PDF (it may be encrypted).", "មិនអាចអានឯកសារ PDF នេះ (ប្រហែលបានអ៊ិនគ្រីប)។"));
    } finally { setBusy(false); }
  }, [t]);

  const setValue = (name: string, value: string) => setFields((fs) => fs.map((f) => (f.name === name ? { ...f, value } : f)));

  const buildFilled = useCallback(async (doFlatten: boolean): Promise<Uint8Array | null> => {
    if (!bytesRef.current) return null;
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytesRef.current, { ignoreEncryption: true });
    const form = doc.getForm();
    for (const fd of fields) {
      try {
        if (fd.type === "text") form.getTextField(fd.name).setText(fd.value);
        else if (fd.type === "checkbox") { const cb = form.getCheckBox(fd.name); if (fd.value) cb.check(); else cb.uncheck(); }
        else if (fd.type === "radio" && fd.value) form.getRadioGroup(fd.name).select(fd.value);
        else if (fd.type === "dropdown" && fd.value) form.getDropdown(fd.name).select(fd.value);
        else if (fd.type === "optionlist" && fd.value) form.getOptionList(fd.name).select(fd.value);
      } catch { /* skip a field that won't take this value */ }
    }
    try { form.updateFieldAppearances(); } catch { /* default appearances */ }
    if (doFlatten) { try { form.flatten(); } catch { /* ignore */ } }
    return doc.save();
  }, [fields]);

  // Live preview (debounced): rebuild the filled PDF and show it in an iframe.
  useEffect(() => {
    if (!loaded || noFields) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const out = await buildFilled(flatten);
      if (cancelled || !out) return;
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
      prevUrl.current = url;
      setPreviewUrl(url);
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fields, flatten, loaded, noFields, buildFilled]);

  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); }, []);

  const download = useCallback(async () => {
    setBusy(true);
    try {
      const out = await buildFilled(flatten);
      if (!out) return;
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}_filled.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
    } finally { setBusy(false); }
  }, [buildFilled, flatten, fileName]);

  const reset = () => { setLoaded(false); setFields([]); setNoFields(false); setPreviewUrl(null); setStatus(""); bytesRef.current = null; };

  return (
    <ToolShell
      title="PDF Form Filler"
      khmerTitle="បំពេញទម្រង់ PDF"
      description="Fill a PDF's interactive form fields right in your browser, see the result update live, then optionally flatten the form so the values are locked in and can't be edited. Runs locally with pdf-lib; nothing is uploaded."
      descriptionKm="បំពេញវាលទម្រង់ PDF ក្នុងកម្មវិធីរុករករបស់អ្នក មើលលទ្ធផលផ្ទាល់ រួចជ្រើសបំបែកទម្រង់ដើម្បីចាក់សោតម្លៃកុំឲ្យកែបាន។ ដំណើរការក្នុងម៉ាស៊ីនដោយ pdf-lib; គ្មានការផ្ទុកឡើង។"
    >
      {!loaded ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{busy ? t("Reading…", "កំពុងអាន…") : t("Choose a fillable PDF", "ជ្រើស PDF ដែលអាចបំពេញ")}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
          </label>
          {status && <p className="mt-3 text-center text-sm text-[var(--danger)]">{status}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div><div className="text-xs text-[var(--ink-faint)]">{fileInfo}</div></div>
            <button onClick={reset} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">{t("Choose another", "ជ្រើសផ្សេង")}</button>
          </div>

          {noFields ? (
            <div className="rounded-xl border border-dashed border-[var(--ground-line)] p-8 text-center text-sm text-[var(--ink-dim)]">
              {t("This PDF has no fillable form fields (it isn't an interactive form).", "ឯកសារ PDF នេះគ្មានវាលទម្រង់ដែលអាចបំពេញបានទេ (មិនមែនជាទម្រង់អន្តរកម្ម)។")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {fields.map((f) => (
                    <Field key={f.name} label={f.name}>
                      {f.type === "text" ? (
                        <TextInput value={f.value} onChange={(e) => setValue(f.name, e.target.value)} />
                      ) : f.type === "checkbox" ? (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink)]">
                          <input type="checkbox" checked={f.value === "on"} onChange={(e) => setValue(f.name, e.target.checked ? "on" : "")} className="h-4 w-4 accent-[var(--gold)]" />
                          {t("Checked", "ធីក")}
                        </label>
                      ) : (
                        <Select value={f.value} onChange={(e) => setValue(f.name, e.target.value)}>
                          <option value="">{t("— none —", "— គ្មាន —")}</option>
                          {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                        </Select>
                      )}
                    </Field>
                  ))}
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                  <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
                  <Lock size={13} className="text-[var(--ink-dim)]" />{t("Flatten — lock values so they can't be edited", "បំបែក — ចាក់សោតម្លៃកុំឲ្យកែបាន")}
                </label>
                <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">{t("Text appearances use the form's own font; fields set up for Latin/numbers fill best.", "ការបង្ហាញអក្សរប្រើពុម្ពរបស់ទម្រង់ផ្ទាល់; វាលសម្រាប់ឡាតាំង/លេខបំពេញបានល្អបំផុត។")}</p>
                <Button onClick={download} disabled={busy} className="inline-flex w-full items-center justify-center gap-2"><Download size={15} />{busy ? t("Working…", "កំពុងដំណើរការ…") : t("Download filled PDF", "ទាញយក PDF ដែលបំពេញ")}</Button>
              </div>

              <div className="lg:sticky lg:top-20 lg:self-start">
                <div className="mb-1.5 text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t("Live preview", "មើលផ្ទាល់")}</div>
                {previewUrl ? (
                  <iframe src={`${previewUrl}#toolbar=0&view=FitH`} title="Filled PDF preview" className="h-[540px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
                ) : (
                  <div className="flex h-[540px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">{t("Building…", "កំពុងបង្កើត…")}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}

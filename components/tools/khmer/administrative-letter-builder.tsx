"use client";

import { useMemo, useState } from "react";
import { useClipboard } from "@/components/ClipboardProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, Row, Select, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { CAMBODIA_PROVINCES, provinceLocation } from "@/lib/cambodia-provinces";
import { formatKhmerLunarDate, formatKhmerSolarDate, localIsoToday } from "@/lib/khmer-date";
import { KHMER_LETTER_TEMPLATES, LETTER_CATEGORIES } from "@/lib/khmer-letter-templates";
import { createKhmerLetterDocx, downloadBlob } from "@/lib/khmer-letter-docx";

type DateMode = "solar" | "lunar" | "both";
type LetterState = {
  sender: string; role: string; recipient: string; honorific: string; subject: string; reference: string; body: string;
  location: string; provinceCode: string; date: string; dateMode: DateMode; royalHeader: boolean;
  signatureMode: "single" | "witnesses"; witnesses: string;
};

const firstTemplate = KHMER_LETTER_TEMPLATES[0];

function downloadText(content: string) {
  downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), "khmer-administrative-letter.txt");
}

export default function AdministrativeLetterBuilder() {
  const { text } = useLanguage();
  const { copyText } = useClipboard();
  const [templateId, setTemplateId] = useState(firstTemplate.id);
  const [templateQuery, setTemplateQuery] = useState("");
  const [category, setCategory] = useState<"all" | (typeof LETTER_CATEGORIES)[number]>("all");
  const [exporting, setExporting] = useState(false);
  const [letter, setLetter] = useState<LetterState>({
    sender: "អង្គភាព / ស្ថាប័ន", role: "តួនាទីអ្នកចុះហត្ថលេខា", recipient: "ឯកឧត្តម/លោកជំទាវ/លោក/លោកស្រី",
    honorific: "ជាទីគោរពដ៏ខ្ពង់ខ្ពស់", subject: firstTemplate.subject, reference: "", body: firstTemplate.body,
    location: "រាជធានីភ្នំពេញ", provinceCode: "12", date: localIsoToday(), dateMode: "both", royalHeader: true,
    signatureMode: "single", witnesses: "",
  });
  const update = <K extends keyof LetterState>(key: K, value: LetterState[K]) => setLetter((current) => ({ ...current, [key]: value }));
  const selectedTemplate = KHMER_LETTER_TEMPLATES.find((template) => template.id === templateId) ?? firstTemplate;
  const filteredTemplates = useMemo(() => {
    const needle = templateQuery.trim().toLocaleLowerCase();
    return KHMER_LETTER_TEMPLATES.filter((template) => (category === "all" || template.category === category)
      && (!needle || `${template.label} ${template.labelEn} ${template.subject}`.toLocaleLowerCase().includes(needle)));
  }, [category, templateQuery]);
  const selectableTemplates = filteredTemplates.some((template) => template.id === templateId) ? filteredTemplates : [selectedTemplate, ...filteredTemplates];

  function applyTemplate(id: string) {
    const template = KHMER_LETTER_TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(id);
    setLetter((current) => ({ ...current, subject: template.subject, body: template.body }));
  }

  function chooseProvince(code: string) {
    const province = CAMBODIA_PROVINCES.find((item) => item.code === code);
    update("provinceCode", code);
    if (province) update("location", provinceLocation(province));
  }

  const dateLines = useMemo(() => {
    if (!letter.date) return [];
    const solar = formatKhmerSolarDate(letter.date);
    const lunar = formatKhmerLunarDate(letter.date);
    if (letter.dateMode === "solar") return solar ? [solar] : [];
    if (letter.dateMode === "lunar") return lunar ? [lunar] : [];
    return [solar, lunar].filter((line): line is string => Boolean(line));
  }, [letter.date, letter.dateMode]);

  const plainText = useMemo(() => [
    letter.royalHeader ? "ព្រះរាជាណាចក្រកម្ពុជា\nជាតិ សាសនា ព្រះមហាក្សត្រ" : "", letter.sender,
    `កម្មវត្ថុ៖ ${letter.subject || "—"}`, letter.reference ? `យោង៖ ${letter.reference}` : "",
    `${letter.recipient} ${letter.honorific}`, letter.body, `${letter.location}\n${dateLines.join("\n")}`, letter.role,
    letter.signatureMode === "witnesses" && letter.witnesses ? `សាក្សី៖ ${letter.witnesses}` : "",
  ].filter(Boolean).join("\n\n"), [dateLines, letter]);

  async function exportWord() {
    setExporting(true);
    try {
      const blob = await createKhmerLetterDocx({ ...letter, dateLines });
      downloadBlob(blob, `${templateId}-${letter.date || "letter"}.docx`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <ToolShell title="Khmer Administrative Letter Builder" khmerTitle="កម្មវិធីបង្កើតលិខិតរដ្ឋបាលខ្មែរ" description="Draft from 100 populated Khmer administrative templates with full solar/lunar dates, Cambodia province selection, responsive A4 preview, and genuine Microsoft Word export." descriptionKm="ព្រាងលិខិតរដ្ឋបាលខ្មែរពីគំរូពេញលេញ ១០០ ជាមួយកាលបរិច្ឆេទសុរិយគតិ/ចន្ទគតិពេញលេញ ជម្រើសខេត្ត-រាជធានី ទិដ្ឋភាព A4 និងការនាំចេញ Microsoft Word ពិតប្រាកដ។">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--ink-dim)]">{text("Templates are drafting aids, not official forms. Verify legal, protocol, date, address, and organization-specific wording before use. Word uses Moul and Kantumruy Pro font names; install those fonts on the receiving computer for closest rendering.", "គំរូទាំងនេះជាជំនួយសម្រាប់ព្រាង មិនមែនទម្រង់ផ្លូវការទេ។ សូមផ្ទៀងផ្ទាត់ផ្លូវច្បាប់ ពិធីការ កាលបរិច្ឆេទ អាសយដ្ឋាន និងពាក្យរបស់ស្ថាប័ន មុនប្រើប្រាស់។ ឯកសារ Word ប្រើឈ្មោះពុម្ពអក្សរ Moul និង Kantumruy Pro; សូមដំឡើងពុម្ពអក្សរទាំងនេះលើកុំព្យូទ័រអ្នកទទួល ដើម្បីបង្ហាញបានជិតបំផុត។")}</div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
        <div className="space-y-4">
          <Row><Field label="Search templates" labelKm="ស្វែងរកគំរូ"><TextInput type="search" value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder={text("Name or subject…", "ឈ្មោះ ឬកម្មវត្ថុ…")} /></Field><Field label="Category" labelKm="ប្រភេទ"><Select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="all">{text("All categories", "គ្រប់ប្រភេទ")}</option>{LETTER_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field></Row>
          <Field label={`Template (${filteredTemplates.length} of 100)`} labelKm={`គំរូ (${filteredTemplates.length} ក្នុងចំណោម ១០០)`}><Select value={templateId} onChange={(event) => applyTemplate(event.target.value)}>{selectableTemplates.map((template) => <option key={template.id} value={template.id}>{template.label} — {template.labelEn}</option>)}</Select></Field>
          <Row><Field label="Sender / institution" labelKm="អ្នកផ្ញើ / ស្ថាប័ន"><TextInput value={letter.sender} onChange={(event) => update("sender", event.target.value)} /></Field><Field label="Signer role" labelKm="តួនាទីអ្នកចុះហត្ថលេខា"><TextInput value={letter.role} onChange={(event) => update("role", event.target.value)} /></Field></Row>
          <Row><Field label="Recipient" labelKm="អ្នកទទួល"><TextInput value={letter.recipient} onChange={(event) => update("recipient", event.target.value)} /></Field><Field label="Honorific phrase" labelKm="ពាក្យគោរព"><TextInput value={letter.honorific} onChange={(event) => update("honorific", event.target.value)} /></Field></Row>
          <Field label="Subject" labelKm="កម្មវត្ថុ"><TextInput value={letter.subject} onChange={(event) => update("subject", event.target.value)} /></Field>
          <Field label="Reference (optional)" labelKm="យោង (បើមាន)"><TextInput value={letter.reference} onChange={(event) => update("reference", event.target.value)} /></Field>
          <Field label="Body" labelKm="ខ្លឹមសារ"><TextArea className="font-khmer" rows={10} value={letter.body} onChange={(event) => update("body", event.target.value)} /></Field>

          <Row><Field label="Province / capital" labelKm="ខេត្ត / រាជធានី"><Select value={letter.provinceCode} onChange={(event) => chooseProvince(event.target.value)}>{CAMBODIA_PROVINCES.map((province) => <option key={province.code} value={province.code}>{province.code} — {province.km} / {province.en}</option>)}</Select></Field><Field label="Location wording" labelKm="ពាក្យទីកន្លែង"><TextInput value={letter.location} onChange={(event) => update("location", event.target.value)} /></Field></Row>
          <Row><Field label="Gregorian date" labelKm="កាលបរិច្ឆេទសុរិយគតិ"><TextInput type="date" value={letter.date} onChange={(event) => update("date", event.target.value)} /></Field><Field label="Date display" labelKm="ការបង្ហាញកាលបរិច្ឆេទ"><Select value={letter.dateMode} onChange={(event) => update("dateMode", event.target.value as DateMode)}><option value="both">{text("Full solar + lunar", "សុរិយគតិ + ចន្ទគតិពេញលេញ")}</option><option value="solar">{text("Full solar only", "សុរិយគតិពេញលេញ")}</option><option value="lunar">{text("Full lunar only", "ចន្ទគតិពេញលេញ")}</option></Select></Field></Row>
          <Row><Field label="Signature layout" labelKm="ប្លង់ហត្ថលេខា"><Select value={letter.signatureMode} onChange={(event) => update("signatureMode", event.target.value as LetterState["signatureMode"])}><option value="single">{text("Single signer", "អ្នកចុះហត្ថលេខាម្នាក់")}</option><option value="witnesses">{text("Signer with witnesses", "អ្នកចុះហត្ថលេខា និងសាក្សី")}</option></Select></Field><label className="flex items-center gap-2 self-end rounded-md border border-[var(--ground-line)] p-3 text-sm text-[var(--ink)]"><input type="checkbox" checked={letter.royalHeader} onChange={(event) => update("royalHeader", event.target.checked)} />{text("Show royal header", "បង្ហាញបាវចនាជាតិ")}</label></Row>
          {letter.signatureMode === "witnesses" && <Field label="Witnesses" labelKm="សាក្សី"><TextInput value={letter.witnesses} onChange={(event) => update("witnesses", event.target.value)} /></Field>}
          <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => copyText(plainText)}>{text("Copy text", "ចម្លងអត្ថបទ")}</Button><Button type="button" onClick={() => downloadText(plainText)}>{text("Download text", "ទាញយកអត្ថបទ")}</Button><Button type="button" onClick={() => void exportWord()} disabled={exporting}>{text(exporting ? "Creating Word file…" : "Export Microsoft Word (.docx)", exporting ? "កំពុងបង្កើតឯកសារ Word…" : "នាំចេញ Microsoft Word (.docx)")}</Button><Button type="button" onClick={() => window.print()}>{text("Print A4", "បោះពុម្ព A4")}</Button></div>
        </div>
        <div className="overflow-auto rounded-lg bg-neutral-400/20 p-2 sm:p-4">
          <article id="khmer-letter-preview" lang="km" className="mx-auto min-h-full aspect-[210/297] w-full max-w-[48rem] bg-white px-[7%] py-[6%] text-black shadow-xl">
            {letter.royalHeader && <header className="mb-[7%] text-center"><p className="font-moul text-[clamp(0.8rem,2vw,1.15rem)]">ព្រះរាជាណាចក្រកម្ពុជា</p><p className="font-moul text-[clamp(0.65rem,1.7vw,0.95rem)]">ជាតិ សាសនា ព្រះមហាក្សត្រ</p><div className="mx-auto mt-2 h-px w-20 bg-black" /></header>}
            <p className="font-moul text-center text-[clamp(0.75rem,1.8vw,1rem)]">{letter.sender || "—"}</p>
            <div className="mt-[7%] space-y-[3%] font-khmer text-[clamp(0.65rem,1.55vw,0.95rem)] leading-[1.9]"><p><strong>កម្មវត្ថុ៖</strong> {letter.subject || "—"}</p>{letter.reference && <p><strong>យោង៖</strong> {letter.reference}</p>}<p className="text-center font-semibold">{letter.recipient} {letter.honorific}</p><div className="whitespace-pre-wrap text-justify indent-8">{letter.body || "—"}</div><div className="text-right"><p>{letter.location}</p>{dateLines.map((line) => <p key={line}>{line}</p>)}</div><div className={`mt-[8%] grid gap-8 text-center ${letter.signatureMode === "witnesses" ? "grid-cols-2" : "grid-cols-1 justify-items-end"}`}>{letter.signatureMode === "witnesses" && <div><p>សាក្សី</p><p className="mt-12">{letter.witnesses || "________________"}</p></div>}<div><p>{letter.role || "អ្នកចុះហត្ថលេខា"}</p><p className="mt-12">________________</p></div></div></div>
          </article>
        </div>
      </div>
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #khmer-letter-preview, #khmer-letter-preview * { visibility: visible !important; } #khmer-letter-preview { position: absolute; inset: 0; width: 210mm; min-height: 297mm; max-width: none; box-shadow: none; print-color-adjust: exact; } @page { size: A4 portrait; margin: 0; } }`}</style>
    </ToolShell>
  );
}
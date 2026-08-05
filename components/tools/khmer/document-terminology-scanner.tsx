"use client";

import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { loadPdfJs } from "@/lib/pdfjs";
import { MPTC_TERMS, type MptcTerm } from "@/lib/data/mptc-lexicon";

type Status = "official" | "english" | "inconsistent" | "unknown";
type Occurrence = { term: string; line: number; context: string; status: Status; khmer?: string; english?: string; definition?: string };

const COMMON_TECH_TERMS = ["api", "sdk", "database", "software", "hardware", "machine learning", "blockchain", "cloud computing", "artificial intelligence"];

function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function lineFor(text: string, index: number) {
  const line = text.slice(0, index).split(/\r?\n/).length;
  const sourceLine = text.split(/\r?\n/)[line - 1]?.trim() ?? "";
  return { line, context: sourceLine.length > 180 ? `${sourceLine.slice(0, 180)}…` : sourceLine };
}

function findOccurrences(text: string, term: string, status: Status, metadata?: MptcTerm) {
  const results: Occurrence[] = [];
  const pattern = new RegExp(escapeRegExp(term), /[A-Za-z]/.test(term) ? "gi" : "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const location = lineFor(text, match.index);
    results.push({ term: match[0], ...location, status, khmer: metadata?.km, english: metadata?.en, definition: metadata?.def });
  }
  return results;
}

function scanDocument(text: string) {
  const occurrences: Occurrence[] = [];
  const seen = new Set<string>();
  const officialTerms = new Map<string, MptcTerm>();
  MPTC_TERMS.forEach((term) => {
    const key = term.en.toLowerCase().replace(/\s+/g, " ");
    const previous = officialTerms.get(key);
    if (!previous || term.def.length > previous.def.length) officialTerms.set(key, term);
  });

  for (const term of officialTerms.values()) {
    const englishHits = findOccurrences(text, term.en, "official", term);
    const khmerHits = findOccurrences(text, term.km.split("/")[0].trim(), "official", term);
    if (englishHits.length || khmerHits.length) {
      const combined = [...englishHits, ...khmerHits];
      const hasBoth = englishHits.length > 0 && khmerHits.length > 0;
      combined.forEach((hit) => occurrences.push({ ...hit, status: hasBoth ? "inconsistent" : "official" }));
    }
  }

  for (const term of COMMON_TECH_TERMS) {
    if (officialTermsHas(officialTerms, term)) continue;
    findOccurrences(text, term, "english").forEach((hit) => occurrences.push(hit));
  }

  const unknownTokens = [...text.matchAll(/\b[A-Z][A-Z0-9+.#-]{1,}\b/g)].map((match) => match[0]);
  for (const token of new Set(unknownTokens)) {
    if (token === "MPTC" || officialTermsHas(officialTerms, token)) continue;
    findOccurrences(text, token, "unknown").forEach((hit) => occurrences.push(hit));
  }

  const uniqueOccurrences = occurrences.filter((occurrence) => {
    const key = `${occurrence.term.toLowerCase()}-${occurrence.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.line - b.line || a.term.localeCompare(b.term));
  return uniqueOccurrences;
}

function officialTermsHas(terms: Map<string, MptcTerm>, query: string) {
  const normalized = query.toLowerCase();
  return [...terms.values()].some((term) => term.en.toLowerCase().includes(normalized));
}

async function extractDocx(file: File) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) throw new Error("DOCX document.xml was not found.");
  const xml = await xmlFile.async("text");
  const document = new DOMParser().parseFromString(xml, "application/xml");
  return [...document.getElementsByTagName("w:t")].map((node) => node.textContent ?? "").join(" ");
}

async function extractPdf(file: File) {
  const pdfjs = await loadPdfJs();
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}

export default function DocumentTerminologyScanner() {
  const { text: t } = useLanguage();
  const [fileName, setFileName] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const occurrences = useMemo(() => scanDocument(documentText), [documentText]);
  const counts = useMemo(() => ({
    official: occurrences.filter((item) => item.status === "official").length,
    english: occurrences.filter((item) => item.status === "english").length,
    inconsistent: occurrences.filter((item) => item.status === "inconsistent").length,
    unknown: occurrences.filter((item) => item.status === "unknown").length,
  }), [occurrences]);

  async function loadFile(file: File) {
    setLoading(true);
    setError("");
    setFileName(file.name);
    try {
      const extension = file.name.toLowerCase().split(".").pop();
      const text = extension === "txt" ? await file.text() : extension === "docx" ? await extractDocx(file) : extension === "pdf" ? await extractPdf(file) : "";
      if (!text.trim()) throw new Error(t("No readable text was found in this file.", "រកមិនឃើញអត្ថបទដែលអាចអានបានក្នុងឯកសារនេះទេ។"));
      setDocumentText(text);
    } catch (cause) {
      setDocumentText("");
      setError(cause instanceof Error ? cause.message : t("Could not read this file.", "មិនអាចអានឯកសារនេះបានទេ។"));
    } finally {
      setLoading(false);
    }
  }

  const statusMeta: Record<Status, { label: string; khmer: string; icon: typeof CheckCircle2; className: string }> = {
    official: { label: "Official terminology", khmer: "វាក្យស័ព្ទផ្លូវការ", icon: CheckCircle2, className: "text-[var(--success)]" },
    english: { label: "English term", khmer: "ពាក្យអង់គ្លេស", icon: AlertTriangle, className: "text-[var(--gold)]" },
    inconsistent: { label: "Possible inconsistency", khmer: "អាចមានភាពមិនស៊ីគ្នា", icon: AlertTriangle, className: "text-orange-500" },
    unknown: { label: "Unknown term", khmer: "ពាក្យមិនស្គាល់", icon: XCircle, className: "text-[var(--danger)]" },
  };

  return (
    <ToolShell title="Khmer Document Terminology Scanner" khmerTitle="ស្កេនពាក្យបច្ចេកទេសក្នុងឯកសារខ្មែរ" description="Scan PDF, DOCX, or TXT documents for official MPTC terminology, English terms, possible translation inconsistencies, and unknown technical terms." descriptionKm="ស្កេនឯកសារ PDF, DOCX ឬ TXT ដើម្បីរកវាក្យស័ព្ទ MPTC ផ្លូវការ ពាក្យអង់គ្លេស ភាពមិនស៊ីគ្នាដែលអាចមាន និងពាក្យបច្ចេកទេសមិនស្គាល់។">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><FileText size={17} className="text-[var(--gold)]" />{t("Upload PDF / DOCX / TXT", "បញ្ចូល PDF / DOCX / TXT")}</div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--gold-dim)] bg-[var(--ground)] p-8 text-center hover:bg-[var(--ground-raised-hi)]"><Upload size={23} className="mb-2 text-[var(--gold)]" /><span className="text-sm font-semibold text-[var(--ink)]">{fileName || t("Choose a document", "ជ្រើសរើសឯកសារ")}</span><span className="mt-1 text-xs text-[var(--ink-faint)]">{t("Text is extracted locally in your browser.", "អត្ថបទត្រូវបានស្រង់ចេញក្នុងកម្មវិធីរុករករបស់អ្នក។")}</span><input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} /></label>
          {loading && <div className="mt-3 flex items-center gap-2 text-xs text-[var(--ink-dim)]"><Loader2 size={14} className="animate-spin" />{t("Extracting document text…", "កំពុងស្រង់អត្ថបទពីឯកសារ…")}</div>}
          {error && <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">{error}</p>}
        </section>

        {documentText && <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 sm:col-span-1"><p className="text-[10px] uppercase text-[var(--ink-faint)]">{t("Detected", "រកឃើញ")}</p><p className="mt-1 font-mono-ui text-2xl font-bold text-[var(--gold)]">{occurrences.length}</p><p className="text-[10px] text-[var(--ink-faint)]">{t("terms", "ពាក្យ")}</p></div>
            {(["official", "english", "inconsistent", "unknown"] as Status[]).map((status) => <div key={status} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><p className={`text-[10px] uppercase ${statusMeta[status].className}`}>{t(statusMeta[status].label, statusMeta[status].khmer)}</p><p className="mt-1 font-mono-ui text-2xl font-bold text-[var(--ink)]">{counts[status]}</p></div>)}
          </section>
          <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-3 font-display text-lg font-semibold text-[var(--ink)]">{t("Terminology report", "របាយការណ៍វាក្យស័ព្ទ")}</h2><div className="space-y-2">{occurrences.map((occurrence, index) => { const meta = statusMeta[occurrence.status]; const Icon = meta.icon; return <article key={`${occurrence.term}-${occurrence.line}-${index}`} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3"><div className="flex items-start gap-3"><Icon size={17} className={`mt-0.5 shrink-0 ${meta.className}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><strong className="font-mono-ui text-sm text-[var(--ink)]">{occurrence.term}</strong><span className={`text-[10px] font-bold uppercase ${meta.className}`}>{t(meta.label, meta.khmer)}</span></div>{occurrence.khmer && <p className="mt-1 font-khmer text-sm font-semibold text-[var(--gold)]">→ {occurrence.khmer}</p>}{occurrence.definition && <p className="mt-1 font-khmer text-xs leading-relaxed text-[var(--ink-dim)]">{occurrence.definition}</p>}<p className="mt-2 border-l-2 border-[var(--ground-line)] pl-2 text-xs leading-relaxed text-[var(--ink-faint)]"><span className="mr-2 font-mono-ui">{t(`Line ${occurrence.line}`, `បន្ទាត់ ${occurrence.line}`)}</span>{occurrence.context}</p></div></div></article>; })}</div></section>
        </>}
      </div>
    </ToolShell>
  );
}

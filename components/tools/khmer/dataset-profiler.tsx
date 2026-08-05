"use client";

import { CheckCircle2, Download, FileSpreadsheet, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";

type DataRow = Record<string, string>;
type Dataset = { rows: DataRow[]; columns: string[]; source: string };

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === '"' && input[index + 1] === '"' && quoted) { cell += '"'; index++; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index++;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += character;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseDataset(raw: string, source: string): Dataset {
  const cleanRaw = raw.replace(/^\uFEFF/, "");
  if (source.toLowerCase().endsWith(".json") || cleanRaw.trim().startsWith("[") || cleanRaw.trim().startsWith("{")) {
    const parsed = JSON.parse(cleanRaw) as unknown;
    let rows: unknown[];
    if (Array.isArray(parsed)) rows = parsed;
    else if (parsed && typeof parsed === "object") {
      const object = parsed as Record<string, unknown>;
      const wrapped = ["data", "rows", "records", "items"].find((key) => Array.isArray(object[key]));
      rows = wrapped ? object[wrapped] as unknown[] : Object.values(object).every((value) => value && typeof value === "object" && !Array.isArray(value)) ? Object.values(object) : [parsed];
    } else rows = [];
    const objects = rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object" && !Array.isArray(row)));
    if (!objects.length) throw new Error("JSON must contain an array of objects or a tabular object.");
    const columns = [...new Set(objects.flatMap((row) => Object.keys(row)))];
    return { columns, source, rows: objects.map((row) => Object.fromEntries(columns.map((column) => [column, String(row[column] ?? "")])))};
  }
  const parsed = csvRows(raw);
  const columns = (parsed.shift() ?? []).map((column, index) => column.trim() || `column_${index + 1}`);
  return { columns, source, rows: parsed.map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""])))};
}

function hasKhmer(value: string) { return /[\u1780-\u17ff]/.test(value); }
function hasLatin(value: string) { return /[A-Za-z]/.test(value); }
function rowText(row: DataRow) { return Object.values(row).join(" "); }
function normalizedRow(row: DataRow, columns: string[]): DataRow { return Object.fromEntries(columns.map((column) => [column, row[column].normalize("NFKC").replace(/\s+/g, " ").trim()])); }

function csvExport(dataset: Dataset) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [dataset.columns.map(quote).join(","), ...dataset.rows.map((row) => dataset.columns.map((column) => quote(row[column] ?? "")).join(","))].join("\n");
}

export default function DatasetProfiler() {
  const { text: t } = useLanguage();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [normalized, setNormalized] = useState(false);

  const report = useMemo(() => {
    if (!dataset) return null;
    const language = dataset.rows.map(row => { const value = rowText(row); return { khmer: hasKhmer(value), latin: hasLatin(value) }; });
    const missingValues: Record<string, number> = Object.fromEntries(dataset.columns.map((column): [string, number] => [column, dataset.rows.filter((row) => !row[column]?.trim()).length]).filter(([, count]) => count > 0));
    const duplicateKeys = dataset.rows.map((row) => JSON.stringify(dataset.columns.map((column) => row[column]?.normalize("NFKC").trim() ?? "")));
    const uniqueValues = new Set(dataset.rows.flatMap((row) => Object.values(row).map((value) => value.trim()).filter(Boolean))).size;
    const anomalyCount = dataset.rows.reduce((total, row) => total + Object.values(row).filter((value) => /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/.test(value)).length, 0);
    return {
      rows: dataset.rows.length,
      khmer: language.filter((item) => item.khmer).length,
      englishOnly: language.filter((item) => item.latin && !item.khmer).length,
      mixed: language.filter((item) => item.latin && item.khmer).length,
      averageKhmerLength: Math.round(dataset.rows.reduce((sum, row) => sum + [...rowText(row)].filter((character) => /[\u1780-\u17ff]/.test(character)).length, 0) / Math.max(1, language.filter((item) => item.khmer).length)),
      uniqueValues,
      anomalies: anomalyCount,
      duplicates: dataset.rows.length - new Set(duplicateKeys).size,
      missingValues,
    };
  }, [dataset]);

  async function loadFile(file: File) {
    setLoading(true); setError(""); setNormalized(false); setFileName(file.name);
    try { setDataset(parseDataset(await file.text(), file.name)); setFileName(""); }
    catch (cause) { setDataset(null); setError(cause instanceof Error ? cause.message : t("Could not parse this dataset.", "មិនអាចអាន Dataset នេះបានទេ។")); }
    finally { setLoading(false); }
  }

  function clean() {
    if (!dataset) return;
    setDataset({ ...dataset, rows: dataset.rows.map((row) => normalizedRow(row, dataset.columns)) });
    setNormalized(true);
  }

  function deduplicate() {
    if (!dataset) return;
    const seen = new Set<string>();
    const rows = dataset.rows.filter((row) => { const key = JSON.stringify(dataset.columns.map((column) => row[column] ?? "")); if (seen.has(key)) return false; seen.add(key); return true; });
    setDataset({ ...dataset, rows });
  }

  function exportDataset() {
    if (!dataset) return;
    const blob = new Blob([csvExport(dataset)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${fileName.replace(/\.[^.]+$/, "") || "dataset"}_clean.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  return <ToolShell title="Khmer Dataset Profiler" khmerTitle="វិភាគគុណភាព Dataset ខ្មែរ" description="Profile CSV or JSON data containing Khmer text, detect language coverage, missing values, duplicates, and Unicode anomalies, then clean and export it locally." descriptionKm="វិភាគទិន្នន័យ CSV ឬ JSON ដែលមានអត្ថបទខ្មែរ រកការគ្របដណ្តប់ភាសា តម្លៃខ្វះ កំណត់ត្រាស្ទួន និងបញ្ហាយូនីកូដ បន្ទាប់មកសម្អាត និងនាំចេញក្នុងកម្មវិធីរុករក។">
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5"><div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Upload size={16} className="text-[var(--gold)]" />{t("Upload CSV / JSON", "បញ្ចូល CSV / JSON")}</div>{dataset && <button type="button" onClick={() => { setDataset(null); setFileName(""); setError(""); }} className="text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]">{t("Clear", "សម្អាត")}</button>}</div><label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--gold-dim)] bg-[var(--ground)] p-8 text-center hover:bg-[var(--ground-raised-hi)]"><FileSpreadsheet size={22} className="mb-2 text-[var(--gold)]" /><span className="text-sm font-semibold text-[var(--ink)]">{fileName || t("Choose dataset file", "ជ្រើសរើសឯកសារ Dataset")}</span><span className="mt-1 text-xs text-[var(--ink-faint)]">CSV or JSON · {t("processed locally", "ដំណើរការក្នុងកម្មវិធីរុករក")}</span><input type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); event.currentTarget.value = ""; }} /></label>{loading && <p className="mt-3 flex items-center gap-2 text-xs text-[var(--ink-dim)]"><Loader2 size={14} className="animate-spin" />{t("Profiling dataset…", "កំពុងវិភាគ Dataset…")}</p>}{dataset && !loading && <p className="mt-3 text-xs text-[var(--success)]">{t(`${dataset.rows.length} rows loaded from ${dataset.source}`, `បានផ្ទុក ${dataset.rows.length} ជួរពី ${dataset.source}`)}</p>}{error && <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">{error}</p>}</section>
      {!dataset && <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-sm text-[var(--ink-dim)]"><p className="font-semibold text-[var(--ink)]">{t("Example columns", "ឧទាហរណ៍ជួរឈរ")}</p><p className="mt-1 text-xs">{t("Your dataset may use any column names; these are only examples.", "Dataset របស់អ្នកអាចប្រើឈ្មោះជួរឈរណាក៏បាន។ ទាំងនេះគ្រាន់តែជាឧទាហរណ៍ប៉ុណ្ណោះ។")}</p><div className="mt-2 flex flex-wrap gap-2">{["name", "address", "description", "province"].map((column) => <code key={column} className="rounded border border-[var(--ground-line)] px-2 py-1 text-xs">{column}</code>)}</div></section>}
      {dataset && report && <><section className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Khmer Dataset Profile", "ប្រវត្តិរូប Dataset ខ្មែរ")}</h2><span className="text-xs text-[var(--ink-faint)]">{dataset.columns.length} {t("columns", "ជួរឈរ")}</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Rows", report.rows], ["Khmer rows", report.khmer], ["English-only", report.englishOnly], ["Mixed language", report.mixed], ["Avg Khmer length", report.averageKhmerLength], ["Unique values", report.uniqueValues], ["Unicode anomalies", report.anomalies], ["Duplicate records", report.duplicates]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(String(label), String(label))}</p><p className="mt-1 font-mono-ui text-xl font-bold text-[var(--ink)]">{value}</p></div>)}</div></section><section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Missing values", "តម្លៃខ្វះ")}</h3>{Object.keys(report.missingValues).length ? <div className="space-y-2">{Object.entries(report.missingValues).map(([column, count]) => <div key={column} className="flex justify-between border-b border-[var(--ground-line)] pb-2 text-sm"><span>{column}</span><strong className="font-mono-ui text-[var(--danger)]">{count}</strong></div>)}</div> : <p className="text-sm text-[var(--success)]">{t("No missing values detected.", "មិនរកឃើញតម្លៃខ្វះទេ។")}</p>}</div><div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Clean dataset", "សម្អាត Dataset")}</h3><div className="flex flex-wrap gap-2"><button type="button" onClick={clean} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-bold text-[#0a0c0d]"><Sparkles size={13} />{t("Normalize", "ធ្វើឱ្យមានស្តង់ដារ")}</button><button type="button" onClick={deduplicate} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)]"><Trash2 size={13} />{t("Deduplicate", "លុបស្ទួន")}</button><button type="button" onClick={exportDataset} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--success)]/40 px-3 py-2 text-xs font-semibold text-[var(--success)]"><Download size={13} />{t("Export CSV", "នាំចេញ CSV")}</button></div>{normalized && <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--success)]"><CheckCircle2 size={13} />{t("Whitespace and Unicode normalization applied.", "បានអនុវត្តការសម្អាតចន្លោះ និងយូនីកូដ។")}</p>}</div></section><section className="overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]"><h3 className="border-b border-[var(--ground-line)] px-4 py-3 font-semibold text-[var(--ink)]">{t("Data preview", "មើលទិន្នន័យជាមុន")}</h3><div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-xs"><thead><tr className="border-b border-[var(--ground-line)] text-[var(--ink-faint)]">{dataset.columns.map((column) => <th key={column} className="px-3 py-2 font-semibold">{column}</th>)}</tr></thead><tbody>{dataset.rows.slice(0, 30).map((row, index) => <tr key={index} className="border-b border-[var(--ground-line)] last:border-0">{dataset.columns.map((column) => <td key={column} className={`max-w-64 px-3 py-2 align-top ${hasKhmer(row[column] ?? "") ? "font-khmer" : ""}`}>{row[column]}</td>)}</tr>)}</tbody></table></div></section></>}
    </div>
  </ToolShell>;
}

"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function MarkdownTable() {
  const { text: t } = useLanguage();
  const [csv, setCsv] = useToolState("md-table:input", "Name,City,Score\nSok,Phnom Penh,95\nDara,Siem Reap,88\nChanthou,Battambang,92");
  const [delimiter, setDelimiter] = useToolState("md-table:delimiter", ",");

  const { table, preview } = useMemo(() => {
    const rows = csv.split(/\r?\n/).filter((l) => l.trim());
    if (rows.length === 0) return { table: "", preview: null };
    const split = (line: string) => {
      const parts = line.split(delimiter);
      return delimiter === "\\t" ? line.split("\t") : parts;
    };
    const parsed = rows.map((r) => split(r).map((c) => c.trim()));
    const cols = Math.max(...parsed.map((r) => r.length));
    const norm = parsed.map((r) => {
      const out = [...r];
      while (out.length < cols) out.push("");
      return out;
    });
    const esc = (c: string) => c.replace(/\|/g, "\\|");
    const header = norm[0];
    const body = norm.slice(1);
    const sep = Array(cols).fill("---");
    const fmt = (row: string[]) => "| " + row.map((c) => esc(c)).join(" | ") + " |";
    const md = [fmt(header), fmt(sep), ...body.map(fmt)].join("\n");
    return {
      table: md,
      preview: { header: norm[0], body, cols },
    };
  }, [csv, delimiter]);

  return (
    <ToolShell
      title="Markdown Table Generator"
      khmerTitle="បង្កើតតារាង Markdown"
      description="Paste rows of data (CSV or tab-separated) to generate a Markdown table."
      descriptionKm="បិទភ្ជាប់ជួរដេកទិន្នន័យ (CSV ឬបំបែកដោយ tab) ដើម្បីបង្កើតតារាង Markdown។"
    >
      <Field label={t("Data (first row = header)", "ទិន្នន័យ (ជួរដេកទី ១ = ចំណងជើង)")}>
        <TextArea rows={7} value={csv} onChange={(e) => setCsv(e.target.value)} />
      </Field>
      <Field label={t("Delimiter", "សញ្ញាបំបែក")}>
        <TextInput value={delimiter} onChange={(e) => setDelimiter(e.target.value)} placeholder="," className="w-24" />
      </Field>

      {preview && (
        <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                {preview.header.map((c, i) => (
                  <th key={i} className="px-3 py-2">{c || `col ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.body.map((r, i) => (
                <tr key={i} className="border-t border-[var(--ground-line)]">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-1.5 text-[var(--ink)]">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Output label={t("Markdown", "Markdown")} value={table} />
    </ToolShell>
  );
}
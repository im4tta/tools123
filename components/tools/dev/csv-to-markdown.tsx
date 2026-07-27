"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export default function CsvToMarkdownTool() {
  const [input, setInput] = useToolState(
    "csv-to-markdown",
    "Name,Role,City\nSopheak,Engineer,Phnom Penh\nDara,Designer,Siem Reap"
  );

  const markdown = useMemo(() => {
    const lines = input.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return "";
    const rows = lines.map(parseCsvLine);
    const header = rows[0];
    const body = rows.slice(1);
    const escape = (c: string) => c.replace(/\|/g, "\\|");
    const headerLine = `| ${header.map(escape).join(" | ")} |`;
    const dividerLine = `| ${header.map(() => "---").join(" | ")} |`;
    const bodyLines = body.map((r) => `| ${header.map((_, i) => escape(r[i] ?? "")).join(" | ")} |`);
    return [headerLine, dividerLine, ...bodyLines].join("\n");
  }, [input]);

  return (
    <ToolShell
      title="CSV → Markdown Table"
      description="Paste CSV data and get a ready-to-paste Markdown table, handling quoted fields and commas inside cells."
    >
      <Field label="CSV input">
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label="Markdown" value={markdown} />
    </ToolShell>
  );
}

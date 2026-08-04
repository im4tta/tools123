"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, FileJson, GitBranch, Wand2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";

export type WorkbenchMode = "types" | "convert" | "jsonl" | "tokens" | "smart" | "chains";

const SAMPLE = `{
  "name": "Sokha",
  "age": 28,
  "active": true,
  "tags": ["khmer", "developer"]
}`;

function tsType(value: unknown, name = "Root"): string {
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    return `${tsType(value[0], name)}[]`;
  }
  if (value === null) return "null";
  if (typeof value !== "object") return typeof value;
  return `interface ${name} {\n${Object.entries(value as Record<string, unknown>).map(([k, v]) => `  ${JSON.stringify(k)}: ${tsType(v, k[0]?.toUpperCase() + k.slice(1))};`).join("\n")}\n}`;
}

function csvToRows(input: string) {
  return input.trim().split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

function rowsToJson(input: string) {
  const rows = csvToRows(input);
  const [headers, ...body] = rows;
  return body.filter((r) => r.length).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function detectInput(input: string) {
  const value = input.trim();
  if (!value) return [];
  const suggestions: string[] = [];
  if (/^eyJ[A-Za-z0-9_-]+\./.test(value)) suggestions.push("JWT Decoder", "Base64 Decoder");
  try { JSON.parse(value); suggestions.push("JSON Formatter", "JSON → TypeScript / Zod", "JSON Data Converter"); } catch { /* not JSON */ }
  if (/^\s*[{[]/.test(value) && /\}\s*$|\]\s*$/.test(value)) suggestions.push("JSON Validator");
  if (/^\s*[-\w]+\s*,\s*[-\w]+(?:\s*\n|$)/.test(value)) suggestions.push("CSV Cleaner", "CSV → JSON");
  if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value)) suggestions.push("Coordinate Converter", "GeoJSON Generator");
  if (/[\u1780-\u17ff]/.test(value)) suggestions.push("Khmer Unicode Normalizer", "Khmer OCR Cleaner", "Somtosor");
  if (/^\s*\{\s*".*"\s*:\s*/.test(value)) suggestions.push("JSON Schema Generator");
  return [...new Set(suggestions)];
}

export function RoadmapWorkbench({ mode }: { mode: WorkbenchMode }) {
  const { text: t } = useLanguage();
  const [input, setInput] = useState(mode === "types" ? SAMPLE : "");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    if (mode === "types") {
      try {
        const value = JSON.parse(input);
        const body = tsType(value);
        const zod = typeof value === "object" && value !== null ? `const RootSchema = z.object({\n${Object.entries(value as Record<string, unknown>).map(([k, v]) => `  ${k}: ${typeof v === "number" ? "z.number()" : typeof v === "boolean" ? "z.boolean()" : Array.isArray(v) ? "z.array(z.unknown())" : "z.string()"},`).join("\n")}\n});` : "";
        return `${body}\n\n// Zod\nimport { z } from "zod";\n${zod}`;
      } catch (e) { return `Error: ${(e as Error).message}`; }
    }
    if (mode === "convert") {
      try { return JSON.stringify(rowsToJson(input), null, 2); } catch { return "Paste CSV with a header row to convert it to JSON."; }
    }
    if (mode === "jsonl") {
      const lines = input.split(/\r?\n/).filter(Boolean);
      const errors: string[] = [];
      lines.forEach((line, i) => { try { JSON.parse(line); } catch (e) { errors.push(`Line ${i + 1}: ${(e as Error).message}`); } });
      return errors.length ? errors.join("\n") : `Valid JSONL\n${lines.length} lines checked.`;
    }
    if (mode === "tokens") {
      const words = input.trim() ? input.trim().split(/\s+/).length : 0;
      return `Characters: ${input.length}\nWords: ${words}\nEstimated tokens: ${Math.ceil(input.length / 4)}\nLines: ${input ? input.split(/\r?\n/).length : 0}`;
    }
    if (mode === "smart") return detectInput(input).join("\n") || "No confident tool match yet.";
    return "";
  }, [input, mode]);

  const copy = async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const title = { types: "JSON → TypeScript / Zod", convert: "JSON Data Converter", jsonl: "JSONL Validator", tokens: "AI Token Counter", smart: "123 Smart Input", chains: "Tool Chains" }[mode];
  const titleKm = { types: "JSON → TypeScript / Zod", convert: "កម្មវិធីបម្លែងទិន្នន័យ", jsonl: "ផ្ទៀងផ្ទាត់ JSONL", tokens: "រាប់ Token AI", smart: "Smart Input ១២៣", chains: "ខ្សែសង្វាក់ឧបករណ៍" }[mode];

  if (mode === "chains") return <ChainWorkspace />;

  return <ToolShell title={title} khmerTitle={titleKm} description={mode === "smart" ? "Paste data once and get suggestions for the best next tool." : "Local-first developer utility for inspecting, transforming, and validating structured data."} descriptionKm="ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។">
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-[var(--ink-dim)]">{mode === "smart" ? "Universal input" : "Input"}</span><button onClick={() => setInput("")} className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">Clear</button></div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="h-[26rem] w-full resize-y rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" placeholder="Paste data here…" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-[var(--ink-dim)]">{mode === "smart" ? "Suggested tools" : "Output"}</span>{output && <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--gold)]">{copied ? <CheckCircle2 size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}</button>}</div>
        <pre className="h-[26rem] overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 font-mono-ui text-sm text-[var(--ink-dim)]">{output || "Output will appear here…"}</pre>
      </div>
    </div>
  </ToolShell>;
}

function ChainWorkspace() {
  const { text: t } = useLanguage();
  const chains = [
    { title: "Developer JSON", steps: ["JSON Formatter", "JSON Validator", "JSON → TypeScript / Zod"] },
    { title: "Khmer OCR", steps: ["Khmer OCR Cleaner", "Khmer Unicode Normalizer", "Khmer Text Statistics"] },
    { title: "CSV → Map", steps: ["CSV Cleaner", "Coordinate Batch Converter", "GeoJSON Validator"] },
  ];
  return <ToolShell title="Tool Chains" khmerTitle="ខ្សែសង្វាក់ឧបករណ៍" description="Saveable linear workflows connecting existing toolbox tools." descriptionKm="ភ្ជាប់ឧបករណ៍ជាចំណុចៗ ដើម្បីបង្កើតលំហូរការងារ។">
    <div className="grid gap-4 md:grid-cols-3">{chains.map((chain) => <div key={chain.title} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h3 className="font-semibold text-[var(--ink)]">{chain.title}</h3><div className="mt-4 space-y-2">{chain.steps.map((step, i) => <div key={step} className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gold)]/15 text-xs font-bold text-[var(--gold)]">{i + 1}</span><span className="text-xs text-[var(--ink-dim)]">{step}</span></div>)}</div></div>)}</div>
  </ToolShell>;
}

"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Output";
import { Field, Row, TextArea, ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";

const MINOR = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "at", "by", "in", "of", "on", "to", "up", "as", "is"]);

type CaseMode = "upper" | "lower" | "sentence" | "title" | "capitalize" | "invert" | "alternating" | "camel" | "pascal" | "snake" | "kebab" | "constant";

function splitWords(s: string) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_\-]+/).filter(Boolean).map((w) => w.toLowerCase());
}

function sentenceCase(text: string) {
  return text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m, p: string, c: string) => p + c.toUpperCase());
}

function titleCaseAP(text: string) {
  const words = text.toLowerCase().split(/(\s+)/);
  return words.map((word, i, arr) => {
    const lower = word.toLowerCase();
    const isBoundary = i === 0 || i === arr.length - 1 || !/^\s+$/.test(arr[i - 1] || "");
    if (!/^[a-z]/.test(word)) return word;
    if (!isBoundary && MINOR.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join("");
}

function capitalizeEach(text: string) {
  return text.split(/(\s+)/).map((w) => /^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w).join("");
}

function invertCase(text: string) {
  return text.split("").map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join("");
}

function alternatingCase(text: string) {
  let upper = false;
  return text.split("").map((c) => {
    if (!/[a-zA-Z]/.test(c)) return c;
    upper = !upper;
    return upper ? c.toUpperCase() : c.toLowerCase();
  }).join("");
}

function applyCase(text: string, mode: CaseMode) {
  const w = splitWords(text);
  switch (mode) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "sentence": return sentenceCase(text);
    case "title": return titleCaseAP(text);
    case "capitalize": return capitalizeEach(text);
    case "invert": return invertCase(text);
    case "alternating": return alternatingCase(text);
    case "camel": return w.map((word, i) => (i === 0 ? word : word[0]?.toUpperCase() + word.slice(1))).join("");
    case "pascal": return w.map((word) => word[0]?.toUpperCase() + word.slice(1)).join("");
    case "snake": return w.join("_");
    case "kebab": return w.join("-");
    case "constant": return w.join("_").toUpperCase();
  }
}

function normalize(text: string, opts: { nfc: boolean; quotes: boolean; spaces: boolean; blank: boolean; accents: boolean; tabs: boolean }) {
  let out = text;
  if (opts.nfc) out = out.normalize("NFC");
  if (opts.quotes) {
    out = out
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2013/g, "-")
      .replace(/\u2014/g, "--")
      .replace(/\u2026/g, "...");
  }
  if (opts.accents) out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (opts.tabs) out = out.replace(/\t/g, "    ");
  if (opts.spaces) out = out.replace(/[ \t]+/g, " ");
  const lines = out.split("\n").map((l) => l.trim());
  if (opts.blank) return lines.filter((l) => l.length > 0).join("\n");
  return lines.join("\n");
}

interface DiffRow { a?: string; b?: string; status: "same" | "changed" | "added" | "removed" }

function diffLines(a: string[], b: string[]): DiffRow[] {
  const max = Math.max(a.length, b.length);
  const rows: DiffRow[] = [];
  for (let i = 0; i < max; i++) {
    const av = a[i];
    const bv = b[i];
    if (av === bv) rows.push({ a: av, b: bv, status: "same" });
    else if (av === undefined) rows.push({ b: bv, status: "added" });
    else if (bv === undefined) rows.push({ a: av, status: "removed" });
    else rows.push({ a: av, b: bv, status: "changed" });
  }
  return rows;
}

const CASE_ACTIONS: { mode: CaseMode; label: string; km: string }[] = [
  { mode: "upper", label: "UPPERCASE", km: "អក្សរធំទាំងអស់" },
  { mode: "lower", label: "lowercase", km: "អក្សរតូចទាំងអស់" },
  { mode: "sentence", label: "Sentence case", km: "ដើមប្រយោគធំ" },
  { mode: "title", label: "Title Case", km: "ធំតាមចំណងជើង" },
  { mode: "capitalize", label: "Capitalize", km: "ធំដើមពាក្យ" },
  { mode: "invert", label: "inVeRt CaSe", km: "បញ្ច្រាសធំ-តូច" },
  { mode: "alternating", label: "aLtErNaTiNg", km: "ឆ្លាស់ធំ-តូច" },
  { mode: "camel", label: "camelCase", km: "camelCase" },
  { mode: "pascal", label: "PascalCase", km: "PascalCase" },
  { mode: "snake", label: "snake_case", km: "snake_case" },
  { mode: "kebab", label: "kebab-case", km: "kebab-case" },
  { mode: "constant", label: "CONSTANT_CASE", km: "CONSTANT_CASE" },
];

const LINE_ACTIONS: { id: string; label: string; km: string; run: (t: string) => string }[] = [
  { id: "reverse-lines", label: "Reverse lines", km: "បញ្ច្រាសបន្ទាត់", run: (t) => t.split("\n").reverse().join("\n") },
  { id: "reverse-text", label: "Reverse text", km: "បញ្ច្រាសអត្ថបទ", run: (t) => t.split("").reverse().join("") },
  { id: "sort-az", label: "Sort A → Z", km: "តម្រៀប A → Z", run: (t) => t.split("\n").sort((a, b) => a.localeCompare(b)).join("\n") },
  { id: "sort-za", label: "Sort Z → A", km: "តម្រៀប Z → A", run: (t) => t.split("\n").sort((a, b) => b.localeCompare(a)).join("\n") },
  { id: "unique", label: "Remove duplicate lines", km: "លុបបន្ទាត់ស្ទួន", run: (t) => [...new Set(t.split("\n"))].join("\n") },
  { id: "trim-lines", label: "Trim lines", km: "កាត់ចន្លោះបន្ទាត់", run: (t) => t.split("\n").map((l) => l.trim()).join("\n") },
];

export default function TextCaseNormalizer() {
  const { text } = useLanguage();
  const [input, setInput] = useToolState("text-case-normalizer:input", "one workbench, one hundred twenty-three tools. use it daily, for the office!");
  const [result, setResult] = useToolState("text-case-normalizer:result", "");
  const [nfc, setNfc] = useToolState("text-case-normalizer:nfc", true);
  const [quotes, setQuotes] = useToolState("text-case-normalizer:quotes", true);
  const [spaces, setSpaces] = useToolState("text-case-normalizer:spaces", true);
  const [blank, setBlank] = useToolState("text-case-normalizer:blank", true);
  const [accents, setAccents] = useToolState("text-case-normalizer:accents", false);
  const [tabs, setTabs] = useToolState("text-case-normalizer:tabs", false);
  const [showDiff, setShowDiff] = useToolState("text-case-normalizer:diff", false);
  const [find, setFind] = useToolState("text-case-normalizer:find", "");
  const [replace, setReplace] = useToolState("text-case-normalizer:replace", "");
  const [regexMode, setRegexMode] = useToolState("text-case-normalizer:regex", false);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = input.trim();
    return { chars: input.length, words: trimmed ? trimmed.split(/\s+/).length : 0, lines: input ? input.split("\n").length : 0 };
  }, [input]);

  const rows = useMemo(() => (showDiff ? diffLines(input.split("\n"), result.split("\n")) : []), [input, result, showDiff]);
  const diffCount = rows.filter((r) => r.status !== "same").length;

  const applyToResult = (run: (t: string) => string) => setResult(run(input));

  const runFindReplace = () => {
    if (find === "") return;
    setResult(regexMode ? input.replace(new RegExp(find, "g"), replace) : input.split(find).join(replace));
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const toggleClass = "flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]";

  return (
    <ToolShell
      title="Text Case & Normalizer"
      khmerTitle="បំលែងអក្សរ និងសម្អាតអត្ថបទ"
      description="Daily quick text fixes: case transforms (upper, lower, sentence, title, identifier styles), line tools, Unicode normalization, find & replace, and a live before/after diff."
      descriptionKm="ឧបករណ៍ប្រចាំថ្ងៃសម្រាប់អត្ថបទ៖ បំលែងអក្សរធំ-តូច តាមប្រយោគ តាមពាក្យ រចនាប័ទ្មអថេរ ឧបករណ៍បន្ទាត់ សម្អាតយូនីកូដ ស្វែងរក-ជំនួស និងប្រៀបធៀបមុន-ក្រោយ។"
    >
      <Row>
        <Field label="Original text" labelKm="អត្ថបទដើម">
          <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Result" labelKm="លទ្ធផល">
          <TextArea rows={7} value={result} onChange={(e) => setResult(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{text("Case transforms", "បំលែងអក្សរ")}</div>
        <div className="flex flex-wrap gap-2">
          {CASE_ACTIONS.map((action) => (
            <button key={action.mode} type="button" className={toggleClass} onClick={() => applyToResult((t) => applyCase(t, action.mode))}>
              {text(action.label, action.km)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{text("Line tools", "ឧបករណ៍បន្ទាត់")}</div>
        <div className="flex flex-wrap gap-2">
          {LINE_ACTIONS.map((action) => (
            <button key={action.id} type="button" className={toggleClass} onClick={() => applyToResult(action.run)}>
              {text(action.label, action.km)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{text("Find & Replace", "ស្វែងរក & ជំនួស")}</div>
        <Row>
          <Field label="Find" labelKm="ស្វែងរក">
            <TextArea rows={2} value={find} onChange={(e) => setFind(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="Replace with" labelKm="ជំនួសដោយ">
            <TextArea rows={2} value={replace} onChange={(e) => setReplace(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={runFindReplace}>{text("Apply", "អនុវត្ត")}</Button>
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Regex", "Regex")}</span>
            <input type="checkbox" checked={regexMode} onChange={(e) => setRegexMode(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
        </div>
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{text("Normalize", "សម្អាតអត្ថបទ")}</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Unicode NFC", "យូនីកូដ NFC")}</span>
            <input type="checkbox" checked={nfc} onChange={(e) => setNfc(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Straighten quotes/dashes", "ត្រង់សញ្ញាសម្រង់/សហសញ្ញា")}</span>
            <input type="checkbox" checked={quotes} onChange={(e) => setQuotes(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Collapse spaces", "បង្រួមដកឃ្លា")}</span>
            <input type="checkbox" checked={spaces} onChange={(e) => setSpaces(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Remove blank lines", "លុបបន្ទាត់ទទេ")}</span>
            <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Strip accents", "លុបស្នាមសង្កត់")}</span>
            <input type="checkbox" checked={accents} onChange={(e) => setAccents(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
          <label className={`${toggleClass} !justify-between`}>
            <span>{text("Tabs → 4 spaces", "ថេប → ៤ ដកឃ្លា")}</span>
            <input type="checkbox" checked={tabs} onChange={(e) => setTabs(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
          </label>
        </div>
        <div className="mt-3">
          <Button type="button" onClick={() => applyToResult((t) => normalize(t, { nfc, quotes, spaces, blank, accents, tabs }))}>
            {text("Apply normalize", "អនុវត្តការសម្អាត")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={copyResult} disabled={!result}>
          {text(copied ? "Copied!" : "Copy result", copied ? "បានចម្លង!" : "ចម្លងលទ្ធផល")}
        </Button>
        <Button type="button" onClick={() => setResult(input)} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
          {text("Result = input", "លទ្ធផល = អត្ថបទដើម")}
        </Button>
        <Button type="button" onClick={() => setResult("")} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
          {text("Clear result", "សម្អាតលទ្ធផល")}
        </Button>
        <button type="button" className={toggleClass} onClick={() => setShowDiff((v) => !v)}>
          {text(showDiff ? "Hide diff" : "Show diff", showDiff ? "លាក់ការប្រៀបធៀប" : "បង្ហាញការប្រៀបធៀប")}
        </button>
        <span className="ml-auto text-xs text-[var(--ink-faint)]">
          {text(`${stats.words} words · ${stats.chars} chars · ${stats.lines} lines`, `${stats.words} ពាក្យ · ${stats.chars} តួអក្សរ · ${stats.lines} បន្ទាត់`)}
        </span>
      </div>

      {showDiff && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 font-mono-ui text-xs">
          <div className="mb-2 text-[var(--ink-dim)]">{text(`${diffCount} line(s) differ`, `${diffCount} បន្ទាត់ខុសគ្នា`)}</div>
          {rows.length === 0 && <div className="text-[var(--ink-faint)]">{text("Nothing to compare yet.", "មិនទាន់មានអ្វីប្រៀបធៀបទេ។")}</div>}
          {rows.map((r, i) => (
            <div key={i} className={r.status === "same" ? "text-[var(--ink-dim)]" : r.status === "added" ? "text-[var(--teal)]" : r.status === "removed" ? "text-[var(--danger)]" : "text-[var(--gold)]"}>
              {r.status === "added" && `+ ${r.b}`}
              {r.status === "removed" && `- ${r.a}`}
              {r.status === "changed" && `± ${r.a} → ${r.b}`}
              {r.status === "same" && `  ${r.a}`}
            </div>
          ))}
        </div>
      )}
    </ToolShell>
  );
}

"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Mode = "format" | "minify" | "validate";

interface Attr {
  name: string;
  value: string;
}

type Token =
  | { type: "decl" | "comment" | "cdata" | "pi" | "doctype"; raw: string; line: number; column: number }
  | { type: "open"; name: string; attrs: Attr[]; selfClose: boolean; raw: string; line: number; column: number }
  | { type: "close"; name: string; line: number; column: number }
  | { type: "text"; value: string; line: number; column: number };

interface XmlError {
  key: string;
  params?: Record<string, string>;
  line: number;
  column: number;
}

interface XmlResult {
  tokens: Token[];
  elements: number;
  attributes: number;
  error: XmlError | null;
}

/** Bilingual texts for every tokenizer / validator error, {name} placeholders filled per error. */
const ERROR_TEXT: Record<string, [string, string]> = {
  "unterminated-comment": ["Unterminated comment", "មតិយោបល់មិនត្រូវបានបិទ"],
  "unterminated-cdata": ["Unterminated CDATA section", "ផ្នែក CDATA មិនត្រូវបានបិទ"],
  "unterminated-pi": ["Unterminated processing instruction", "សេចក្តីណែនាំដំណើរការមិនត្រូវបានបិទ"],
  "unterminated-doctype": ["Unterminated DOCTYPE / declaration", "DOCTYPE ឬសេចក្តីប្រកាសមិនត្រូវបានបិទ"],
  "expected-name-open": ["Expected an element name after \"<\"", "រំពឹងឈ្មោះធាតុបន្ទាប់ពី \"<\""],
  "expected-name-close": ["Expected an element name after \"</\"", "រំពឹងឈ្មោះធាតុបន្ទាប់ពី \"</\""],
  "expected-gt-close": ["Expected \">\" to close </{name}>", "រំពឹង \">\" ដើម្បីបិទ </{name}>"],
  "unterminated-tag": ["Unterminated tag <{name}>", "ស្លាក <{name}> មិនត្រូវបានបិទ"],
  "malformed-attribute": ["Malformed attribute in <{name}>", "គុណលក្ខណៈខុសទម្រង់ក្នុង <{name}>"],
  "expected-equals": ["Expected \"=\" after attribute \"{name}\"", "រំពឹង \"=\" បន្ទាប់ពីគុណលក្ខណៈ \"{name}\""],
  "attribute-must-be-quoted": ["Attribute \"{name}\" must be quoted", "គុណលក្ខណៈ \"{name}\" ត្រូវតែដាក់សញ្ញាសម្រង់"],
  "unterminated-attribute-value": ["Unterminated value for attribute \"{name}\"", "តម្លៃរបស់គុណលក្ខណៈ \"{name}\" មិនត្រូវបានបិទ"],
  "unexpected-close": ["Unexpected closing tag </{name}>", "ស្លាកបិទដែលមិនរំពឹងទុក </{name}>"],
  "mismatched-tag": [
    "Mismatched tag: expected </{expected}> but found </{close}>",
    "ស្លាកមិនត្រូវគ្នា៖ រំពឹង </{expected}> ប៉ុន្តែរកឃើញ </{close}>",
  ],
  "text-outside-root": ["Text is not allowed outside the root element", "អត្ថបទមិនត្រូវបានអនុញ្ញាតនៅខាងក្រៅធាតុឫស"],
  "unclosed-element": ["Unclosed element <{name}>", "ធាតុមិនត្រូវបានបិទ <{name}>"],
};

const NAME_RE = /[A-Za-z0-9_:.-]/;

function positionAt(input: string, index: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let k = 0; k < index; k += 1) {
    if (input[k] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

/** Original Tools123 tokenizer: comments, CDATA, PIs, DOCTYPE, tags, attributes, text. */
function tokenize(input: string): XmlResult {
  const tokens: Token[] = [];
  const n = input.length;
  let i = 0;
  let elements = 0;
  let attributes = 0;
  let error: XmlError | null = null;
  const at = (index: number) => positionAt(input, index);
  const fail = (key: string, atIndex: number, params?: Record<string, string>) => {
    if (!error) error = { key, params, ...at(atIndex) };
  };

  while (i < n && !error) {
    if (input.startsWith("<!--", i)) {
      const end = input.indexOf("-->", i + 4);
      if (end === -1) {
        fail("unterminated-comment", i);
        break;
      }
      tokens.push({ type: "comment", raw: input.slice(i, end + 3), ...at(i) });
      i = end + 3;
    } else if (input.startsWith("<![CDATA[", i)) {
      const end = input.indexOf("]]>", i + 9);
      if (end === -1) {
        fail("unterminated-cdata", i);
        break;
      }
      tokens.push({ type: "cdata", raw: input.slice(i, end + 3), ...at(i) });
      i = end + 3;
    } else if (input.startsWith("<?", i)) {
      const end = input.indexOf("?>", i + 2);
      if (end === -1) {
        fail("unterminated-pi", i);
        break;
      }
      tokens.push({ type: "pi", raw: input.slice(i, end + 2), ...at(i) });
      i = end + 2;
    } else if (input.startsWith("</", i)) {
      let j = i + 2;
      while (j < n && /\s/.test(input[j])) j += 1;
      const nameStart = j;
      while (j < n && NAME_RE.test(input[j])) j += 1;
      const name = input.slice(nameStart, j);
      if (!name) {
        fail("expected-name-close", i);
        break;
      }
      while (j < n && /\s/.test(input[j])) j += 1;
      if (input[j] !== ">") {
        fail("expected-gt-close", i, { name });
        break;
      }
      tokens.push({ type: "close", name, ...at(i) });
      i = j + 1;
    } else if (input[i] === "<" && input[i + 1] === "!") {
      // DOCTYPE (possibly with an internal subset) or another declaration.
      let depth = 0;
      let j = i;
      while (j < n) {
        const ch = input[j];
        if (ch === "[") depth += 1;
        else if (ch === "]") depth = Math.max(0, depth - 1);
        else if (ch === ">" && depth === 0) break;
        j += 1;
      }
      if (j >= n) {
        fail("unterminated-doctype", i);
        break;
      }
      tokens.push({ type: "doctype", raw: input.slice(i, j + 1), ...at(i) });
      i = j + 1;
    } else if (input[i] === "<") {
      const pos = at(i);
      let j = i + 1;
      while (j < n && NAME_RE.test(input[j])) j += 1;
      const name = input.slice(i + 1, j);
      if (!name) {
        fail("expected-name-open", i);
        break;
      }
      const attrs: Attr[] = [];
      let selfClose = false;
      let closed = false;
      while (j < n && !closed) {
        while (j < n && /\s/.test(input[j])) j += 1;
        if (input[j] === "/" && input[j + 1] === ">") {
          selfClose = true;
          closed = true;
          j += 2;
          break;
        }
        if (input[j] === ">") {
          closed = true;
          j += 1;
          break;
        }
        const aStart = j;
        while (j < n && NAME_RE.test(input[j])) j += 1;
        const aName = input.slice(aStart, j);
        if (!aName) {
          fail("malformed-attribute", j, { name });
          break;
        }
        while (j < n && /\s/.test(input[j])) j += 1;
        if (input[j] !== "=") {
          fail("expected-equals", j, { name: aName });
          break;
        }
        j += 1;
        while (j < n && /\s/.test(input[j])) j += 1;
        const quote = input[j];
        if (quote !== '"' && quote !== "'") {
          fail("attribute-must-be-quoted", j, { name: aName });
          break;
        }
        j += 1;
        const vStart = j;
        while (j < n && input[j] !== quote) j += 1;
        if (j >= n) {
          fail("unterminated-attribute-value", vStart, { name: aName });
          break;
        }
        attrs.push({ name: aName, value: input.slice(vStart, j) });
        attributes += 1;
        j += 1;
      }
      if (!closed) {
        fail("unterminated-tag", i, { name });
        break;
      }
      elements += 1;
      tokens.push({ type: "open", name, attrs, selfClose, raw: input.slice(i, j), ...pos });
      i = j;
    } else {
      const next = input.indexOf("<", i);
      const end = next === -1 ? n : next;
      tokens.push({ type: "text", value: input.slice(i, end), ...at(i) });
      i = end;
    }
  }

  return { tokens, elements, attributes, error };
}

/** Structural check: balanced, well-nested elements and no text outside the root. */
function validate(tokens: Token[]): XmlError | null {
  const stack: { name: string; line: number; column: number }[] = [];
  for (const tk of tokens) {
    if (tk.type === "open" && !tk.selfClose) {
      stack.push({ name: tk.name, line: tk.line, column: tk.column });
    } else if (tk.type === "close") {
      const top = stack.pop();
      if (!top) return { key: "unexpected-close", params: { name: tk.name }, line: tk.line, column: tk.column };
      if (top.name !== tk.name) {
        return { key: "mismatched-tag", params: { expected: top.name, close: tk.name }, line: tk.line, column: tk.column };
      }
    } else if (tk.type === "text" && stack.length === 0 && tk.value.trim() !== "") {
      return { key: "text-outside-root", line: tk.line, column: tk.column };
    }
  }
  if (stack.length > 0) {
    const top = stack[stack.length - 1];
    return { key: "unclosed-element", params: { name: top.name }, line: top.line, column: top.column };
  }
  return null;
}

function pretty(tokens: Token[]): string {
  const lines: string[] = [];
  let depth = 0;
  for (const tk of tokens) {
    if (tk.type === "text") {
      const value = tk.value.trim();
      if (value) lines.push("  ".repeat(depth) + value);
    } else if (tk.type === "open") {
      const attrStr = tk.attrs.map((a) => `${a.name}="${a.value}"`).join(" ");
      const tag = attrStr ? `<${tk.name} ${attrStr}` : `<${tk.name}`;
      if (tk.selfClose) {
        lines.push("  ".repeat(depth) + tag + "/>");
      } else {
        lines.push("  ".repeat(depth) + tag + ">");
        depth += 1;
      }
    } else if (tk.type === "close") {
      depth = Math.max(0, depth - 1);
      lines.push("  ".repeat(depth) + `</${tk.name}>`);
    } else {
      lines.push("  ".repeat(depth) + tk.raw);
    }
  }
  return lines.join("\n");
}

function minify(tokens: Token[]): string {
  return tokens
    .map((tk) => {
      if (tk.type === "text") return tk.value.trim();
      if (tk.type === "close") return `</${tk.name}>`;
      return tk.raw;
    })
    .join("");
}

function formatError(e: XmlError, t: (en: string, km: string) => string): string {
  const [en, km] = ERROR_TEXT[e.key] ?? [e.key, e.key];
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => e.params?.[k] ?? `{${k}}`);
  return `${t(fill(en), fill(km))} (${t("line", "បន្ទាត់")} ${e.line}, ${t("column", "ជួរឈរ")} ${e.column})`;
}

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<note date="2026-08-27">
  <to>Team</to>
  <body>Hello from Tools123!</body>
  <!-- a comment -->
</note>
`;

const MODES: { id: Mode; en: string; km: string }[] = [
  { id: "format", en: "Format", km: "រៀបទម្រង់" },
  { id: "minify", en: "Minify", km: "បង្រួម" },
  { id: "validate", en: "Validate", km: "ផ្ទៀងផ្ទាត់" },
];

export default function XmlFormatter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("xml-formatter:input", SAMPLE);
  const [mode, setMode] = useToolState<Mode>("xml-formatter:mode", "format");

  const result = useMemo(() => {
    if (!input.trim()) return { error: null as XmlError | null, output: "", elements: 0, attributes: 0 };
    const parsed = tokenize(input);
    const structural = parsed.error ? null : validate(parsed.tokens);
    const error = parsed.error ?? structural;
    let output = "";
    if (!error) {
      if (mode === "minify") output = minify(parsed.tokens);
      else if (mode === "validate") output = t("Valid XML", "XML ត្រឹមត្រូវ");
      else output = pretty(parsed.tokens);
    }
    return { error, output, elements: parsed.elements, attributes: parsed.attributes };
  }, [input, mode, t]);

  return (
    <ToolShell
      title="XML Formatter"
      khmerTitle="រៀបចំទម្រង់ XML"
      description="Validate and pretty-print XML with an original tokenizer — comments, CDATA, attributes, self-closing tags, and processing instructions."
      descriptionKm="ផ្ទៀងផ្ទាត់ និងរៀបទម្រង់ XML ជាមួយឧបករណ៍ញែកឯករាជ្យ — មតិយោបល់ CDATA គុណលក្ខណៈ ស្លាកបិទដោយខ្លួនឯង និងសេចក្តីណែនាំដំណើរការ។"
    >
      <Field label={t("Mode", "របៀប")}>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === m.id
                  ? "bg-[var(--gold)] text-[#0a0c0d]"
                  : "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {t(m.en, m.km)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t("XML input", "បញ្ចូល XML")}>
        <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} placeholder={SAMPLE} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Elements", "ធាតុ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.elements}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Attributes", "គុណលក្ខណៈ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.attributes}</div>
        </div>
      </div>
      {result.error ? (
        <Output label={t("Error", "កំហុស")} value={formatError(result.error, t)} error />
      ) : (
        <Output label={t("Result", "លទ្ធផល")} value={result.output} />
      )}
      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Provenance: original Tools123 implementation.", "ប្រភព៖ ការអនុវត្តឯករាជ្យរបស់ Tools123។")}
      </p>
    </ToolShell>
  );
}

"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Json = unknown;
type T = (en: string, km: string) => string;

type EvalResult = { ok: true; matches: Json[] } | { ok: false; error: string };

interface Step {
  kind: "child" | "index" | "wildcard" | "filter";
  name?: string;
  idx?: number;
  pred?: Pred;
  recursive?: boolean;
}

interface Pred {
  path: string[];
  op?: string;
  literal?: Json;
  literalIsPath?: boolean;
  litPath?: string[];
  chain?: { op: "&&" | "||"; pred: Pred };
}

/** Read a JSONPath property token. */
function readIdent(s: string, i: number): { value: string; next: number } {
  const m = /^[A-Za-z_$][A-Za-z0-9_$-]*/.exec(s.slice(i));
  return m ? { value: m[0], next: i + m[0].length } : { value: "", next: i };
}

function findCloseParen(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Parse a predicate left-hand side such as @.price or @['a']. */
function parseLhs(s: string): { path: string[] } | null {
  if (!s.startsWith("@")) return null;
  const path: string[] = [];
  let i = 1;
  while (i < s.length) {
    if (s[i] === ".") {
      i++;
      const id = readIdent(s, i);
      if (!id.value) return null;
      path.push(id.value);
      i = id.next;
    } else if (s[i] === "[") {
      const end = s.indexOf("]", i);
      if (end === -1) return null;
      const inner = s.slice(i + 1, end).trim();
      if (!(inner.length >= 2 && (inner[0] === "'" || inner[0] === '"') && inner[inner.length - 1] === inner[0])) return null;
      path.push(inner.slice(1, -1));
      i = end + 1;
    } else if (s[i] === "*") {
      path.push("*");
      i++;
    } else return null;
  }
  return { path };
}

/** Parse one comparison: path op literal (or a bare path = existence test). */
function parseComparison(s: string): Pred | null {
  let idx = -1;
  let op = "";
  let inStr: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"') {
      inStr = c;
      continue;
    }
    const rest = s.slice(i);
    const two = /^(>=|<=|==|!=)/.exec(rest);
    if (two) {
      idx = i;
      op = two[0];
      break;
    }
    const one = /^(>|<)/.exec(rest);
    if (one) {
      idx = i;
      op = one[0];
      break;
    }
  }
  const lhsSrc = idx === -1 ? s : s.slice(0, idx).trim();
  const left = parseLhs(lhsSrc);
  if (!left) return null;
  if (idx === -1) return { path: left.path }; // existence test

  const rhs = s.slice(idx + op.length).trim();
  if (rhs.startsWith("@")) {
    const p = parseLhs(rhs);
    if (!p) return null;
    return { path: left.path, op, literalIsPath: true, litPath: p.path };
  }
  let literal: Json;
  if (/^-?\d+(\.\d+)?$/.test(rhs)) literal = Number(rhs);
  else if (rhs === "true") literal = true;
  else if (rhs === "false") literal = false;
  else if (rhs === "null") literal = null;
  else if (rhs.length >= 2 && (rhs[0] === "'" || rhs[0] === '"') && rhs[rhs.length - 1] === rhs[0]) literal = rhs.slice(1, -1);
  else return null;
  return { path: left.path, op, literal };
}

/** Split a predicate on top-level && and || (outside quotes and parens). */
function splitPredicate(src: string): { text: string; sep: "&&" | "||" | null }[] {
  const out: { text: string; sep: "&&" | "||" | null }[] = [];
  let cur = "";
  let inStr: string | null = null;
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      cur += c;
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"') {
      inStr = c;
      cur += c;
      continue;
    }
    if (c === "(") {
      depth++;
      cur += c;
      continue;
    }
    if (c === ")") {
      depth--;
      cur += c;
      continue;
    }
    if (depth === 0 && src.startsWith("&&", i)) {
      out.push({ text: cur.trim(), sep: "&&" });
      cur = "";
      i += 1;
      continue;
    }
    if (depth === 0 && src.startsWith("||", i)) {
      out.push({ text: cur.trim(), sep: "||" });
      cur = "";
      i += 1;
      continue;
    }
    cur += c;
  }
  out.push({ text: cur.trim(), sep: null });
  return out;
}

function parsePredicate(src: string): Pred | null {
  const parts = splitPredicate(src);
  if (parts.length === 0 || parts.some((p) => !p.text)) return null;
  const root = parseComparison(parts[0].text);
  if (!root) return null;
  let current = root;
  for (let i = 1; i < parts.length; i++) {
    const p = parseComparison(parts[i].text);
    if (!p) return null;
    current.chain = { op: parts[i - 1].sep as "&&" | "||", pred: p };
    current = p;
  }
  return root;
}

function parseBracket(s: string, start: number, t: T): { step: Step; next: number } | { error: string } {
  const j = start + 1;
  if (s[j] === "?") {
    const open = s.indexOf("(", j);
    if (open === -1) return { error: t("Filter is missing '('", "Filter ខ្វះ '('") };
    const close = findCloseParen(s, open);
    if (close === -1) return { error: t("Filter is missing ')'", "Filter ខ្វះ ')'") };
    const pred = parsePredicate(s.slice(open + 1, close).trim());
    if (!pred) return { error: t("Invalid filter predicate.", "លក្ខខណ្ឌ filter មិនត្រឹមត្រូវ។") };
    if (s[close + 1] !== "]") return { error: t("Expected ']' after the filter.", "រំពឹង ']' បន្ទាប់ពី filter។") };
    return { step: { kind: "filter", pred }, next: close + 2 };
  }
  if (s[j] === "*") {
    if (s[j + 1] !== "]") return { error: t("Expected ']' after '*'.", "រំពឹង ']' បន្ទាប់ពី '*'។") };
    return { step: { kind: "wildcard" }, next: j + 2 };
  }
  if (s[j] === "'" || s[j] === '"') {
    const q = s[j];
    const end = s.indexOf(q, j + 1);
    if (end === -1) return { error: t("Unclosed quoted name.", "ឈ្មោះក្នុងសម្រង់មិនទាន់បិទ។") };
    if (s[end + 1] !== "]") return { error: t("Expected ']' after the quoted name.", "រំពឹង ']' បន្ទាប់ពីឈ្មោះក្នុងសម្រង់។") };
    return { step: { kind: "child", name: s.slice(j + 1, end) }, next: end + 2 };
  }
  const end = s.indexOf("]", j);
  if (end === -1) return { error: t("Unclosed '['.", "មិនទាន់បិទ '['។") };
  const inner = s.slice(j, end).trim();
  if (!/^\d+$/.test(inner)) return { error: t("Unsupported bracket expression", "កន្សោមក្នុងតង្កៀបមិនគាំទ្រ") + ` '[${inner}]'` };
  return { step: { kind: "index", idx: Number(inner) }, next: end + 1 };
}

/** Parse the practical JSONPath subset: $ .a ['a'] ..b [0] [*] [?(@.x>1)]. */
function parsePathExpr(expr: string, t: T): { steps: Step[] } | { error: string } {
  const s = expr.trim();
  if (!s) return { error: t("Enter a JSONPath expression.", "សូមបញ្ចូលកន្សោម JSONPath។") };
  if (!s.startsWith("$")) return { error: t("The expression must start with $.", "កន្សោមត្រូវចាប់ផ្តើមដោយ $។") };
  let i = 1;
  const steps: Step[] = [];
  while (i < s.length) {
    const c = s[i];
    if (c === ".") {
      if (s[i + 1] === ".") {
        i += 2;
        if (s[i] === "[") {
          const sub = parseBracket(s, i, t);
          if ("error" in sub) return sub;
          steps.push({ ...sub.step, recursive: true });
          i = sub.next;
        } else if (s[i] === "*") {
          steps.push({ kind: "wildcard", recursive: true });
          i += 1;
        } else {
          const id = readIdent(s, i);
          if (!id.value) return { error: t("Expected a name after '..'.", "រំពឹងឈ្មោះបន្ទាប់ពី '..'។") };
          steps.push({ kind: "child", name: id.value, recursive: true });
          i = id.next;
        }
      } else {
        i += 1;
        if (s[i] === "*") {
          steps.push({ kind: "wildcard" });
          i += 1;
          continue;
        }
        const id = readIdent(s, i);
        if (!id.value) return { error: t("Expected a name after '.'.", "រំពឹងឈ្មោះបន្ទាប់ពី '.'។") };
        steps.push({ kind: "child", name: id.value });
        i = id.next;
      }
    } else if (c === "[") {
      const sub = parseBracket(s, i, t);
      if ("error" in sub) return sub;
      steps.push(sub.step);
      i = sub.next;
    } else {
      return { error: t("Unexpected character", "តួអក្សរមិនត្រឹមត្រូវ") + ` '${c}'` };
    }
  }
  return { steps };
}

function getByPath(obj: Json, path: string[]): { found: boolean; value: Json } {
  let cur: Json = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return { found: false, value: undefined };
    if (key === "*") {
      const vals = Array.isArray(cur) ? cur : Object.values(cur as Record<string, Json>);
      if (vals.length === 0) return { found: false, value: undefined };
      cur = vals[0];
      continue;
    }
    const v = (cur as Record<string, Json>)[key];
    if (v === undefined) return { found: false, value: undefined };
    cur = v;
  }
  return { found: true, value: cur };
}

function testPred(pred: Pred, item: Json): boolean {
  const lhs = getByPath(item, pred.path);
  let base: boolean;
  if (!pred.op) {
    base = lhs.found;
  } else {
    const rhs = pred.literalIsPath ? getByPath(item, pred.litPath as string[]) : { found: true, value: pred.literal };
    if (!lhs.found || !rhs.found) {
      base = pred.op === "!=";
    } else {
      const a = lhs.value;
      const b = rhs.value;
      switch (pred.op) {
        case "==": base = a === b; break;
        case "!=": base = a !== b; break;
        case ">": base = (a as number) > (b as number); break;
        case "<": base = (a as number) < (b as number); break;
        case ">=": base = (a as number) >= (b as number); break;
        case "<=": base = (a as number) <= (b as number); break;
        default: base = false;
      }
    }
  }
  if (!pred.chain) return base;
  const rest = testPred(pred.chain.pred, item);
  return pred.chain.op === "&&" ? base && rest : base || rest;
}

function objectValues(node: Json): Json[] {
  return Object.values(node as Record<string, Json>);
}

/** Recursive descent: collect matches at every depth (RFC 9535 .. operator). */
function collectRecursive(node: Json, step: Step, out: Json[]) {
  if (step.kind === "wildcard") {
    if (Array.isArray(node)) {
      for (const v of node) {
        out.push(v);
        collectRecursive(v, step, out);
      }
    } else if (node && typeof node === "object") {
      for (const k in node) {
        const v = (node as Record<string, Json>)[k];
        out.push(v);
        collectRecursive(v, step, out);
      }
    }
    return;
  }
  if (step.kind === "child") {
    if (node && typeof node === "object") {
      if (!Array.isArray(node)) {
        const v = (node as Record<string, Json>)[step.name as string];
        if (v !== undefined) out.push(v);
      }
      const vals = Array.isArray(node) ? node : objectValues(node);
      for (const v of vals) collectRecursive(v, step, out);
    }
  } else if (step.kind === "index") {
    if (Array.isArray(node)) {
      const v = node[step.idx as number];
      if (v !== undefined) out.push(v);
      for (const v2 of node) collectRecursive(v2, step, out);
    } else if (node && typeof node === "object") {
      for (const v of objectValues(node)) collectRecursive(v, step, out);
    }
  } else if (step.kind === "filter") {
    const items = Array.isArray(node) ? node : node && typeof node === "object" ? objectValues(node) : [];
    const pred = step.pred as Pred;
    for (const item of items) if (testPred(pred, item)) out.push(item);
    if (node && typeof node === "object") {
      const vals = Array.isArray(node) ? node : objectValues(node);
      for (const v of vals) collectRecursive(v, step, out);
    }
  }
}

function applyStep(node: Json, step: Step, out: Json[]) {
  if (step.recursive) {
    collectRecursive(node, step, out);
    return;
  }
  if (step.kind === "child" && node && typeof node === "object" && !Array.isArray(node)) {
    const v = (node as Record<string, Json>)[step.name as string];
    if (v !== undefined) out.push(v);
  } else if (step.kind === "index" && Array.isArray(node)) {
    const v = node[step.idx as number];
    if (v !== undefined) out.push(v);
  } else if (step.kind === "wildcard") {
    if (Array.isArray(node)) for (const v of node) out.push(v);
    else if (node && typeof node === "object") out.push(...objectValues(node));
  } else if (step.kind === "filter") {
    const items = Array.isArray(node) ? node : node && typeof node === "object" ? objectValues(node) : [];
    const pred = step.pred as Pred;
    for (const item of items) if (testPred(pred, item)) out.push(item);
  }
}

function evaluate(root: Json, steps: Step[]): Json[] {
  let nodes: Json[] = [root];
  for (const step of steps) {
    const next: Json[] = [];
    for (const node of nodes) applyStep(node, step, next);
    nodes = next;
  }
  return nodes;
}

const SAMPLE = {
  store: {
    book: [
      { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
      { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
      { category: "fiction", author: "Herman Melville", title: "Moby Dick", isbn: "0-553-21311-3", price: 8.99 },
    ],
    bicycle: { color: "red", price: 19.95 },
  },
};

export default function JsonpathTester() {
  const { text: t } = useLanguage();
  const [json, setJson] = useToolState("jsonpath:json", JSON.stringify(SAMPLE, null, 2));
  const [path, setPath] = useToolState("jsonpath:path", "$.store.book[?(@.price>10)]");

  const result = useMemo<EvalResult>(() => {
    let data: Json;
    try {
      data = JSON.parse(json);
    } catch {
      return { ok: false, error: t("Invalid JSON.", "JSON មិនត្រឹមត្រូវ។") };
    }
    const parsed = parsePathExpr(path, t);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    return { ok: true, matches: evaluate(data, parsed.steps) };
  }, [json, path, t]);

  return (
    <ToolShell
      title="JSONPath Tester"
      khmerTitle="សាកល្បង JSONPath"
      description="Evaluate a practical JSONPath subset — $.a.b, $['a'], $..b, [0], [*] and [?(@.x>1)] filters."
      descriptionKm="វាយតម្លៃសំណុំរង JSONPath — $.a.b, $['a'], $..b, [0], [*] និងតម្រង [?(@.x>1)]។"
    >
      <Field label="JSON data" labelKm="ទិន្នន័យ JSON">
        <TextArea rows={10} value={json} onChange={(e) => setJson(e.target.value)} />
      </Field>
      <Field label="JSONPath expression" labelKm="កន្សោម JSONPath" hint="e.g. $.store.book[?(@.price>10)]" hintKm="ឧ. $.store.book[?(@.price>10)]">
        <TextInput value={path} onChange={(e) => setPath(e.target.value)} className="font-mono-ui" />
      </Field>

      {"matches" in result ? (
        <Output
          label={`${t("Matches", "លទ្ធផលត្រូវគ្នា")} (${result.matches.length})`}
          value={JSON.stringify(result.matches, null, 2)}
          error={result.matches.length === 0}
        />
      ) : (
        <Output label={t("Error", "កំហុស")} value={result.error} error />
      )}
      {"matches" in result && result.matches.length === 0 && (
        <p className="text-sm text-[var(--ink-dim)]">{t("No matches for this path.", "មិនមានលទ្ធផលសម្រាប់ផ្លូវនេះទេ។")}</p>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            {t("Evaluates a practical subset of the JSONPath standard —", "វាយតម្លៃសំណុំរងជាក់ស្តែងនៃស្ដង់ដារ JSONPath —")}{" "}
            <a className="underline" href="https://www.rfc-editor.org/rfc/rfc9535.html" target="_blank" rel="noreferrer">RFC 9535</a>
          </li>
          <li>
            {t("The JSONPath concept was introduced by Stefan Goessner (2007) —", "គំនិត JSONPath ត្រូវបានណែនាំដោយ Stefan Goessner (២០០៧) —")}{" "}
            <a className="underline" href="https://goessner.net/articles/JsonPath/" target="_blank" rel="noreferrer">goessner.net/articles/JsonPath</a>
            {" "}{t("— original Tools123 implementation.", "— ការសរសេរដើមរបស់ Tools123។")}
          </li>
        </ul>
      </div>
    </ToolShell>
  );
}

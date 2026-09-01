"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type ChangeType = "added" | "removed" | "changed";

type Change = {
  path: string;
  type: ChangeType;
  oldValue: string;
  newValue: string;
};

function describe(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `Array(${v.length})`;
  if (typeof v === "object") return "Object";
  return String(v);
}

function kind(v: unknown): "null" | "array" | "object" | "primitive" {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "object") return "object";
  return "primitive";
}

function collect(a: unknown, b: unknown, path: string, out: Change[]): void {
  if (a === b) return;
  const ka = kind(a);
  const kb = kind(b);
  if (ka === "primitive" || kb === "primitive" || ka !== kb) {
    out.push({ path, type: "changed", oldValue: describe(a), newValue: describe(b) });
    return;
  }
  if (ka === "array" && kb === "array") {
    const aArr = a as unknown[];
    const bArr = b as unknown[];
    const len = Math.max(aArr.length, bArr.length);
    for (let i = 0; i < len; i++) {
      const p = `${path}[${i}]`;
      const hasA = i < aArr.length;
      const hasB = i < bArr.length;
      if (hasA && hasB) collect(aArr[i], bArr[i], p, out);
      else if (hasA) out.push({ path: p, type: "removed", oldValue: describe(aArr[i]), newValue: "" });
      else out.push({ path: p, type: "added", oldValue: "", newValue: describe(bArr[i]) });
    }
    return;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  for (const k of keys) {
    const p = path ? `${path}.${k}` : k;
    const hasA = Object.prototype.hasOwnProperty.call(aObj, k);
    const hasB = Object.prototype.hasOwnProperty.call(bObj, k);
    if (hasA && hasB) collect(aObj[k], bObj[k], p, out);
    else if (hasA) out.push({ path: p, type: "removed", oldValue: describe(aObj[k]), newValue: "" });
    else out.push({ path: p, type: "added", oldValue: "", newValue: describe(bObj[k]) });
  }
}

function parse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function badgeClass(type: ChangeType): string {
  if (type === "added") return "border-[var(--success)]/50 bg-[var(--success)]/15 text-[var(--success)]";
  if (type === "removed") return "border-[var(--danger)]/50 bg-[var(--danger)]/15 text-[var(--danger)]";
  return "border-[var(--gold)]/50 bg-[var(--gold)]/15 text-[var(--gold)]";
}

export default function JsonDiff() {
  const { text: t } = useLanguage();
  const [left, setLeft] = useToolState(
    "json-diff:left",
    '{\n  "name": "Khmer Studio",\n  "tools": 9,\n  "active": true,\n  "tags": ["a", "b"]\n}'
  );
  const [right, setRight] = useToolState(
    "json-diff:right",
    '{\n  "name": "Khmer Studio",\n  "tools": 10,\n  "tags": ["a", "c"]\n}'
  );

  const { error, changes, added, removed, changed, report } = useMemo(() => {
    const a = parse(left);
    const b = parse(right);
    if (!a.ok || !b.ok) {
      const leftError = !a.ok ? `${t("Left is invalid", "ខាងឆ្វេងមិនត្រឹមត្រូវ")}: ${a.error}` : "";
      const rightError = !b.ok ? `${t("Right is invalid", "ខាងស្ដាំមិនត្រឹមត្រូវ")}: ${b.error}` : "";
      return {
        error: `${leftError}${rightError ? ` ${rightError}` : ""}`,
        changes: [],
        added: 0,
        removed: 0,
        changed: 0,
        report: "",
      };
    }
    const changes: Change[] = [];
    collect(a.value, b.value, "$", changes);
    let added = 0;
    let removed = 0;
    let changed = 0;
    for (const c of changes) {
      if (c.type === "added") added += 1;
      else if (c.type === "removed") removed += 1;
      else changed += 1;
    }
    const report = changes
      .map((c) => {
        const prefix = c.type === "added" ? "[+]" : c.type === "removed" ? "[-]" : "[~]";
        if (c.type === "changed") return `${prefix} ${c.path}: ${c.oldValue} → ${c.newValue}`;
        return `${prefix} ${c.path}: ${c.newValue || c.oldValue}`;
      })
      .join("\n");
    return { error: "", changes, added, removed, changed, report };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right]);

  return (
    <ToolShell
      title="JSON Diff"
      khmerTitle="ប្រៀបធៀប JSON"
      description="Paste two JSON documents and see a deep structural diff: every added, removed and changed path with color badges and a copyable report."
      descriptionKm="បិទភ្ជាប់ឯកសារ JSON ពីរ ហើយមើលភាពខុសគ្នាតាមរចនាសម្ព័ន្ធជ្រៅ៖ រាល់ផ្លូវដែលបន្ថែម ដកចេញ និងផ្លាស់ប្ដូរ ជាមួយស្លាកពណ៌ និងរបាយការណ៍អាចចម្លងបាន។"
    >
      <Row>
        <Field label={t("JSON A", "JSON A")}>
          <TextArea rows={10} value={left} onChange={(e) => setLeft(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("JSON B", "JSON B")}>
          <TextArea rows={10} value={right} onChange={(e) => setRight(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {error ? (
        <p className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--success)]/40 bg-[var(--success)]/10 px-2.5 py-1 text-[var(--success)]">
              {t("Added", "បន្ថែម")}: {added}
            </span>
            <span className="rounded-full border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-2.5 py-1 text-[var(--danger)]">
              {t("Removed", "ដកចេញ")}: {removed}
            </span>
            <span className="rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-1 text-[var(--gold)]">
              {t("Changed", "ផ្លាស់ប្ដូរ")}: {changed}
            </span>
          </div>

          {changes.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--ground-line)] p-6 text-sm text-[var(--ink-dim)]">
              {t("The two JSON documents are structurally identical.", "ឯកសារ JSON ទាំងពីរដូចគ្នាតាមរចនាសម្ព័ន្ធ។")}
            </p>
          ) : (
            <ul className="space-y-2">
              {changes.map((c, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm"
                >
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass(c.type)}`}>
                    {c.type === "added" ? t("Added", "បន្ថែម") : c.type === "removed" ? t("Removed", "ដកចេញ") : t("Changed", "ផ្លាស់ប្ដូរ")}
                  </span>
                  <span className="font-mono-ui text-xs text-[var(--gold)]">{c.path}</span>
                  <span className="font-mono-ui text-xs text-[var(--ink-dim)]">
                    {c.type === "changed" ? `${c.oldValue} → ${c.newValue}` : c.newValue || c.oldValue}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Output label={t("Diff report", "របាយការណ៍ខុសគ្នា")} value={report} />
        </>
      )}
    </ToolShell>
  );
}

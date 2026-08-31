"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type IssueCode = "noEquals" | "emptyKey" | "badKey" | "spaceBeforeEquals" | "unbalancedQuotes" | "midQuote" | "unquotedSpaces" | "duplicate";

interface EnvRow {
  line: number;
  key: string;
  value: string;
  quoted: boolean;
  issues: IssueCode[];
}

// Common .env key convention (dotenv style): letters, digits and underscores.
const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseEnv(text: string): EnvRow[] {
  const rawLines = text.split(/\r?\n/);
  const counts = new Map<string, number>();
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = raw.indexOf("=");
    if (eq === -1) continue;
    const key = raw.slice(0, eq).trim();
    if (KEY_RE.test(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const rows: EnvRow[] = [];
  rawLines.forEach((raw, i) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const issues: IssueCode[] = [];
    const eq = raw.indexOf("=");
    if (eq === -1) {
      rows.push({ line: i + 1, key: "", value: "", quoted: false, issues: ["noEquals"] });
      return;
    }
    const beforeEq = raw.slice(0, eq);
    if (/\s$/.test(beforeEq)) issues.push("spaceBeforeEquals");
    const key = beforeEq.trim();
    if (!key) issues.push("emptyKey");
    else if (!KEY_RE.test(key)) issues.push("badKey");

    const valuePart = raw.slice(eq + 1);
    let value = valuePart;
    let quoted = false;
    if (/^['"]/.test(valuePart)) {
      quoted = true;
      const q = valuePart[0];
      const inner = valuePart.slice(1);
      const end = inner.lastIndexOf(q);
      if (end === -1 || inner.slice(0, end).includes(q)) issues.push("unbalancedQuotes");
      value = end === -1 ? inner : inner.slice(0, end);
    } else if (valuePart.includes('"') || valuePart.includes("'")) {
      issues.push("midQuote");
    } else if (/\s/.test(valuePart)) {
      issues.push("unquotedSpaces");
    }

    if (key && (counts.get(key) ?? 0) > 1) issues.push("duplicate");
    rows.push({ line: i + 1, key, value, quoted, issues });
  });
  return rows;
}

const ISSUE_LABELS: Record<IssueCode, [string, string]> = {
  noEquals: ["Missing '=' separator", "ខ្វះសញ្ញា '='"],
  emptyKey: ["Empty key", "គន្លឹះទទេ"],
  badKey: ["Invalid key characters", "តួអក្សរគន្លឹះមិនត្រឹមត្រូវ"],
  spaceBeforeEquals: ["Whitespace before '='", "មានដកឃ្លាមុន '='"],
  unbalancedQuotes: ["Unbalanced quotes", "សញ្ញាសម្រង់មិនស៊ីគ្នា"],
  midQuote: ["Quote inside unquoted value", "សញ្ញាសម្រង់ក្នុងតម្លៃគ្មានសម្រង់"],
  unquotedSpaces: ["Unquoted value contains spaces", "តម្លៃគ្មានសម្រង់មានដកឃ្លា"],
  duplicate: ["Duplicate key", "គន្លឹះស្ទួន"],
};

export default function EnvValidator() {
  const { text: t } = useLanguage();
  const [content, setContent] = useToolState("env:content", "PORT=3000\nDB_HOST=localhost\nDB_HOST=127.0.0.1\nAPP_NAME=My App\nSECRET_KEY = abc123\n\n# comment");

  const rows = useMemo(() => parseEnv(content), [content]);
  const summary = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter((r) => r.issues.length === 0).length;
    const duplicates = rows.filter((r) => r.issues.includes("duplicate")).length;
    const emptyKeys = rows.filter((r) => r.issues.includes("emptyKey")).length;
    return { total, valid, invalid: total - valid, duplicates, emptyKeys };
  }, [rows]);

  const issueText = (issues: IssueCode[]) =>
    issues.length ? issues.map((c) => t(...ISSUE_LABELS[c])).join("; ") : t("OK", "ល្អ");

  return (
    <ToolShell
      title="Environment (.env) Validator"
      khmerTitle="ផ្ទៀងផ្ទាត់ .env"
      description="Validate .env file syntax line by line: KEY=VALUE pairs, duplicate keys and quoting issues."
      descriptionKm="ផ្ទៀងផ្ទាត់វាក្យសម្ព័ន្ធ .env បន្ទាត់នីមួយៗ៖ គូ KEY=VALUE គន្លឹះស្ទួន និងបញ្ហាសម្រង់។"
    >
      <Field label="Environment (.env) content" labelKm="ខ្លឹមសារ .env">
        <TextArea rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("PORT=3000\nDB_HOST=localhost", "PORT=3000\nDB_HOST=localhost")} />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          [t("Total lines", "បន្ទាត់សរុប"), String(summary.total)],
          [t("Valid", "ត្រឹមត្រូវ"), String(summary.valid)],
          [t("Issues", "មានបញ្ហា"), String(summary.invalid)],
          [t("Duplicate keys", "គន្លឹះស្ទួន"), String(summary.duplicates)],
          [t("Empty keys", "គន្លឹះទទេ"), String(summary.emptyKeys)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{label}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--ground-line)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t("Key", "គន្លឹះ")}</th>
              <th className="px-3 py-2">{t("Value", "តម្លៃ")}</th>
              <th className="px-3 py-2">{t("Quoted", "មានសម្រង់")}</th>
              <th className="px-3 py-2">{t("Issues", "បញ្ហា")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ground-line)]">
            {rows.map((r) => (
              <tr key={r.line} className={r.issues.length ? "text-[var(--danger)]" : "text-[var(--ink)]"}>
                <td className="px-3 py-2 font-mono-ui text-xs">{r.line}</td>
                <td className="px-3 py-2 font-mono-ui">{r.key || "—"}</td>
                <td className="max-w-[16rem] truncate px-3 py-2 font-mono-ui">{r.value || "—"}</td>
                <td className="px-3 py-2">{r.quoted ? t("Yes", "បាទ/ចាស") : t("No", "ទេ")}</td>
                <td className="px-3 py-2 text-xs">{issueText(r.issues)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-[var(--ink-dim)]">{t("Paste .env content above to validate.", "បិទភ្ជាប់ខ្លឹមសារ .env ខាងលើដើម្បីផ្ទៀងផ្ទាត់។")}</div>
        )}
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        {t("Validates the common dotenv KEY=VALUE convention — original Tools123 implementation.", "ផ្ទៀងផ្ទាត់ទម្រង់ dotenv KEY=VALUE ទូទៅ — ការសរសេរដើមរបស់ Tools123។")}
      </div>
    </ToolShell>
  );
}

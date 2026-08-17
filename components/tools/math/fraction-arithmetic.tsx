"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function frac(n: number, d: number): { n: number; d: number } {
  if (d === 0) return { n: 0, d: 0 };
  const g = gcd(n, d);
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (Math.abs(d)) / g };
}

function fmtFrac(f: { n: number; d: number }): string {
  if (f.d === 0) return "undefined";
  if (f.n === 0) return "0";
  if (f.d === 1) return String(f.n);
  const whole = Math.trunc(f.n / f.d);
  const rem = Math.abs(f.n % f.d);
  const d = f.d;
  const sign = f.n < 0 ? "−" : "";
  if (whole === 0) return `${sign}${rem}/${d}`;
  return rem === 0 ? `${sign}${whole}` : `${sign}${whole} ${rem}/${d}`;
}

export default function FractionArithmetic() {
  const { text: t } = useLanguage();
  const [a, setA] = useToolState("frac:a", "1/4");
  const [b, setB] = useToolState("frac:b", "1/3");
  const [op, setOp] = useToolState("frac:op", "add");

  const result = useMemo(() => {
    const p = (s: string) => {
      const m = s.trim().match(/^([-+]?\d+)\s*\/\s*(\d+)$/) ?? s.trim().match(/^([-+]?\d+)$/);
      if (!m) return null;
      if (m[2] === undefined) return { n: parseInt(m[1], 10), d: 1 };
      const n = parseInt(m[1], 10);
      const d = parseInt(m[2], 10);
      if (d === 0) return null;
      return { n, d };
    };
    const fa = p(a);
    const fb = p(b);
    if (!fa || !fb) return null;
    let n = 0;
    let d = 1;
    if (op === "add") { n = fa.n * fb.d + fb.n * fa.d; d = fa.d * fb.d; }
    if (op === "sub") { n = fa.n * fb.d - fb.n * fa.d; d = fa.d * fb.d; }
    if (op === "mul") { n = fa.n * fb.n; d = fa.d * fb.d; }
    if (op === "div") { n = fa.n * fb.d; d = fa.d * fb.n; }
    const f = frac(n, d);
    return { f, dec: f.d === 0 ? null : f.n / f.d };
  }, [a, b, op]);

  return (
    <ToolShell
      title="Fraction Arithmetic"
      khmerTitle="គណនាប្រភាគ"
      description="Add, subtract, multiply, or divide fractions and get the simplified result plus decimal."
      descriptionKm="បូក ដក គុណ ឬចែកប្រភាគ ហើយទទួលលទ្ធផលសម្រួលរួច រួមទាំងទសភាគ។"
    >
      <Row>
        <Field label={t("First fraction", "ប្រភាគទី ១")}>
          <TextInput value={a} onChange={(e) => setA(e.target.value)} placeholder="1/4" />
        </Field>
        <Field label={t("Operation", "ប្រមាណវិធី")}>
          <Select value={op} onChange={(e) => setOp(e.target.value)}>
            <option value="add">+ {t("Add", "បូក")}</option>
            <option value="sub">− {t("Subtract", "ដក")}</option>
            <option value="mul">× {t("Multiply", "គុណ")}</option>
            <option value="div">÷ {t("Divide", "ចែក")}</option>
          </Select>
        </Field>
        <Field label={t("Second fraction", "ប្រភាគទី ២")}>
          <TextInput value={b} onChange={(e) => setB(e.target.value)} placeholder="1/3" />
        </Field>
      </Row>
      {result ? (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
          <div className="font-mono-ui text-3xl font-semibold text-[var(--ink)]">
            {fmtFrac(result.f)}
          </div>
          {result.dec !== null && <div className="mt-1 text-sm text-[var(--ink-dim)]">≈ {result.dec.toFixed(6)}</div>}
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter fractions as a/b (e.g. 1/4).", "សូមបញ្ចូលប្រភាគជា a/b (ឧ. 1/4)។")}</p>
      )}
    </ToolShell>
  );
}
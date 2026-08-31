"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type DigitMark = { ch: string; kind: "sig" | "nonsig" | "ambiguous" };

interface Analysis {
  count: number;
  marks: DigitMark[];
  exponent: string;
}

/** Formats a value in scientific notation with the given number of significant figures. */
function exponentForm(value: number, sigFigs: number): string {
  const [mant, exp] = value.toExponential(sigFigs - 1).split("e");
  return `${mant} × 10^${exp}`;
}

/** Counts significant figures in a decimal string (supports exponent input) and annotates each digit. */
function analyze(raw: string): Analysis | null {
  const cleaned = raw.trim().replace(/[\s,]/g, "");
  if (!cleaned) return null;
  const m = cleaned.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
  if (!m) return null;
  const [, sign, intPart, fracPartRaw] = m;
  const fracPart = fracPartRaw ?? "";
  if (intPart === "" && fracPart === "") return null;
  const hasDecimal = /\./.test(cleaned.split(/[eE]/)[0]);
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;

  const digits = (intPart + fracPart).split("");
  const firstNonZero = digits.findIndex((c) => c !== "0");
  if (firstNonZero === -1) {
    // The value is zero — the written form is inherently ambiguous.
    const marks: DigitMark[] = digits.map((ch) => ({ ch, kind: "nonsig" }));
    if (hasDecimal) marks.splice(intPart.length, 0, { ch: ".", kind: "nonsig" });
    if (sign) marks.unshift({ ch: sign, kind: "nonsig" });
    return { count: 1, marks, exponent: exponentForm(value, 1) };
  }
  const lastNonZero = digits.map((c) => c !== "0").lastIndexOf(true);
  const lastSignificant = hasDecimal ? digits.length - 1 : lastNonZero;
  const count = lastSignificant - firstNonZero + 1;
  const marks: DigitMark[] = digits.map((ch, i) => {
    let kind: DigitMark["kind"];
    if (i >= firstNonZero && i <= lastSignificant) kind = "sig";
    else if (!hasDecimal && i > lastNonZero) kind = "ambiguous";
    else kind = "nonsig";
    return { ch, kind };
  });
  if (hasDecimal) marks.splice(intPart.length, 0, { ch: ".", kind: "nonsig" });
  if (sign) marks.unshift({ ch: sign, kind: "nonsig" });
  return { count, marks, exponent: exponentForm(value, count) };
}

function roundResult(valueStr: string, digitsStr: string): { decimal: string; exponent: string } | null {
  const value = Number(valueStr.trim());
  const digits = Math.round(Number(digitsStr));
  if (!Number.isFinite(value) || Number.isNaN(digits) || digits < 1 || digits > 15) return null;
  const prec = value.toPrecision(digits);
  if (prec.includes("e")) {
    const [mant, exp] = prec.split("e");
    const exponent = `${mant} × 10^${exp}`;
    return { decimal: exponent, exponent };
  }
  return { decimal: prec, exponent: exponentForm(value, digits) };
}

export default function SigFigsCalculator() {
  const { text: t } = useLanguage();
  const [number, setNumber] = useToolState("sig-figs:number", "0.0003");
  const [roundValue, setRoundValue] = useToolState("sig-figs:round-value", "3.14159265");
  const [roundDigits, setRoundDigits] = useToolState("sig-figs:round-digits", "3");

  const analysis = useMemo(() => analyze(number), [number]);
  const rounded = useMemo(() => roundResult(roundValue, roundDigits), [roundValue, roundDigits]);

  return (
    <ToolShell
      title="Significant Figures Calculator"
      khmerTitle="គណនាខ្ទង់សំខាន់"
      description="Count the significant figures of any decimal, round a value to a chosen number of significant figures, and see the exponent form."
      descriptionKm="រាប់ខ្ទង់សំខាន់នៃចំនួនទស្សន៍ទាយណាមួយ បង្គត់តម្លៃតាមចំនួនខ្ទង់សំខាន់ដែលបានជ្រើស និងមើលទម្រង់អិចស្ប៉ូណង់ស្យែល។"
    >
      <Row>
        <Field label={t("Number to analyze", "លេខដែលត្រូវវិភាគ")}>
          <TextInput
            inputMode="decimal"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="font-mono-ui"
            placeholder={t("e.g. 0.0003 or 1.200", "ឧ. 0.0003 ឬ 1.200")}
          />
        </Field>
      </Row>

      {analysis ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Significant figures", "ចំនួនខ្ទង់សំខាន់")}</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">{analysis.count}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Digit by digit", "ខ្ទង់នីមួយៗ")}</div>
            <div className="mt-1 font-mono-ui text-lg tracking-widest">
              {analysis.marks.map((mk, i) => (
                <span
                  key={i}
                  className={
                    mk.kind === "sig"
                      ? "font-semibold text-[var(--ink)]"
                      : mk.kind === "ambiguous"
                        ? "text-[var(--gold)]"
                        : "text-[var(--ink-dim)] opacity-50"
                  }
                >
                  {mk.ch}
                </span>
              ))}
            </div>
            <div className="mt-1 text-[10px] leading-snug text-[var(--ink-dim)]">
              {t("Bold = significant · dim = not · gold = ambiguous", "ដិត = សំខាន់ · ស្រអាប់ = មិនសំខាន់ · មាស = មិនច្បាស់")}
            </div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Exponent form", "ទម្រង់អិចស្ប៉ូណង់ស្យែល")}</div>
            <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{analysis.exponent}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid number.", "សូមបញ្ចូលលេខឱ្យបានត្រឹមត្រូវ។")}</p>
      )}

      <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink)]">{t("Rules of significant figures", "ច្បាប់នៃខ្ទង់សំខាន់")}</div>
        <ul className="list-inside list-disc space-y-1">
          <li>{t("Non-zero digits are always significant.", "ខ្ទង់មិនមែនសូន្យ តែងតែជាខ្ទង់សំខាន់។")}</li>
          <li>{t("Zeros between non-zero digits are significant (e.g. 1005 → 4).", "សូន្យនៅចន្លោះខ្ទង់មិនមែនសូន្យ ជាខ្ទង់សំខាន់ (ឧ. 1005 → 4)។")}</li>
          <li>{t("Leading zeros are not significant (e.g. 0.0003 → 1).", "សូន្យនៅខាងមុខ មិនមែនជាខ្ទង់សំខាន់ (ឧ. 0.0003 → 1)។")}</li>
          <li>{t("Trailing zeros after a decimal point are significant (e.g. 1.200 → 4).", "សូន្យចុងក្រោយបន្ទាប់ពីចំនុចទស្សន៍ទាយ ជាខ្ទង់សំខាន់ (ឧ. 1.200 → 4)។")}</li>
          <li>{t("Trailing zeros without a decimal point are ambiguous (e.g. 1200 → 2 to 4); this tool counts only up to the last non-zero digit.", "សូន្យចុងក្រោយដែលគ្មានចំនុចទស្សន៍ទាយ គឺមិនច្បាស់លាស់ (ឧ. 1200 → 2 ដល់ 4)។")}</li>
        </ul>
      </div>

      <Row>
        <Field label={t("Value to round", "តម្លៃត្រូវបង្គត់")}>
          <TextInput
            inputMode="decimal"
            value={roundValue}
            onChange={(e) => setRoundValue(e.target.value)}
            className="font-mono-ui"
            placeholder={t("e.g. 3.14159", "ឧ. 3.14159")}
          />
        </Field>
        <Field label={t("Significant figures", "ចំនួនខ្ទង់សំខាន់")} hint={t("1–15", "១–១៥")}>
          <TextInput inputMode="numeric" value={roundDigits} onChange={(e) => setRoundDigits(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {rounded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Output label={t("Rounded value", "តម្លៃបង្គត់")} value={rounded.decimal} />
          <Output label={t("Exponent form", "ទម្រង់អិចស្ប៉ូណង់ស្យែល")} value={rounded.exponent} />
        </div>
      )}
    </ToolShell>
  );
}

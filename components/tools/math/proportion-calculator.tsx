"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function ProportionCalculator() {
  const { text: t } = useLanguage();
  const [a, setA] = useToolState("proportion:a", "4");
  const [b, setB] = useToolState("proportion:b", "8");
  const [c, setC] = useToolState("proportion:c", "2");

  const result = useMemo(() => {
    const av = Number(a);
    const bv = Number(b);
    const cv = Number(c);
    if ([av, bv, cv].some(Number.isNaN) || bv === 0) return { err: true } as const;
    return { err: false, x: (av * bv) / cv } as const;
  }, [a, b, c]);

  return (
    <ToolShell
      title="Proportion Calculator (Rule of Three)"
      khmerTitle="គណនាសមាមាត្រ"
      description="Solve 'a is to b as c is to x' (cross multiplication / rule of three) instantly."
      descriptionKm="ដោះស្រាយ 'a ដូចជា b ដូចជា c ដូចជា x' (គុណឆ្លាស់ / ក្បួនបីស្វ័យ) ភ្លាមៗ។"
    >
      <Row>
        <Field label="a">
          <TextInput inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} className="text-center font-mono-ui" />
        </Field>
        <Field label="b">
          <TextInput inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} className="text-center font-mono-ui" />
        </Field>
        <Field label="c">
          <TextInput inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} className="text-center font-mono-ui" />
        </Field>
      </Row>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
        <div className="font-mono-ui text-lg text-[var(--ink-dim)]">
          {a} : {b} = {c} : x
        </div>
        {result.err ? (
          <p className="mt-2 text-sm text-[var(--danger)]">{t("b must not be zero.", "b មិនអាចសូន្យបានទេ។")}</p>
        ) : (
          <div className="mt-3">
            <span className="text-sm text-[var(--ink-dim)]">{t("x =", "x =")} </span>
            <span className="font-display text-4xl font-semibold text-[var(--ink)]">
              {result.x.toLocaleString("en-US", { maximumFractionDigits: 6 })}
            </span>
            <div className="mt-2 font-mono-ui text-xs text-[var(--ink-faint)]">
              ({a} × {b}) ÷ {c}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
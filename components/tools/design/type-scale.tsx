"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function TypeScale() {
  const { text: t } = useLanguage();
  const [base, setBase] = useToolState("type-scale:base", "16");
  const [ratio, setRatio] = useToolState("type-scale:ratio", "1.333");
  const [steps, setSteps] = useToolState("type-scale:steps", "5");

  const sizes = useMemo(() => {
    const b = Number(base) || 16;
    const r = Number(ratio) || 1.333;
    const n = Math.max(2, Math.min(12, Number(steps) || 5));
    const out: { px: number; rem: number; name: string }[] = [];
    for (let i = -n; i <= n; i++) {
      const px = b * Math.pow(r, i);
      out.push({ px, rem: px / 16, name: i === 0 ? "Base" : i === 1 ? "Up 1" : i === -1 ? "Down 1" : i > 1 ? `Up ${i}` : `Down ${-i}` });
    }
    return out;
  }, [base, ratio, steps]);

  const css = useMemo(
    () => sizes.map((s) => `--scale-${s.name.toLowerCase().replace(/\s+/g, "-")}: ${s.px.toFixed(2)}px;`).join("\n"),
    [sizes],
  );

  return (
    <ToolShell
      title="Typographic Scale Generator"
      khmerTitle="បង្កើតមាត្រដ្ឋានអក្សរ"
      description="Generate a modular typographic scale (base × ratio) as px and rem, with ready CSS variables."
      descriptionKm="បង្កើតមាត្រដ្ឋានអក្សរម៉ូឌុល (base × ratio) ជា px និង rem រួមជាមួយ CSS variables ត្រៀមរួច។"
    >
      <Row>
        <Field label={t("Base size (px)", "ទំហំមូលដ្ឋាន (px)")}>
          <TextInput inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} />
        </Field>
        <Field label={t("Ratio", "សមាមាត្រ")}>
          <Select value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option value="1.067">Minor Second (1.067)</option>
            <option value="1.125">Major Second (1.125)</option>
            <option value="1.2">Minor Third (1.2)</option>
            <option value="1.25">Major Third (1.25)</option>
            <option value="1.333">Perfect Fourth (1.333)</option>
            <option value="1.5">Perfect Fifth (1.5)</option>
            <option value="1.618">Golden Ratio (1.618)</option>
          </Select>
        </Field>
      </Row>
      <Field label={t("Steps up/down", "ជំហានឡើង/ចុះ")}>
        <TextInput inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} />
      </Field>

      <div className="space-y-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        {sizes.map((s) => (
          <div key={s.px} className="flex items-baseline justify-between border-b border-[var(--ground-line)]/60 py-1.5 last:border-0">
            <span className="truncate font-display text-[var(--ink)]" style={{ fontSize: Math.max(10, Math.min(48, s.px)) }}>
              Aa
            </span>
            <span className="ml-3 shrink-0 font-mono-ui text-xs text-[var(--ink-dim)]">
              {s.name} · {s.px.toFixed(2)}px · {s.rem.toFixed(3)}rem
            </span>
          </div>
        ))}
      </div>

      <Output label={t("CSS variables", "CSS variables")} value={css} />
    </ToolShell>
  );
}
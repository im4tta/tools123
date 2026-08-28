"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { marginMarkup, priceFromMargin, costFromMargin } from "@/lib/calc/finance";

type Mode = "from-price" | "from-margin" | "from-cost";

export default function MarginMarkupCalculator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("margin:mode", "from-price");
  const [cost, setCost] = useToolState("margin:cost", "20");
  const [price, setPrice] = useToolState("margin:price", "25");
  const [margin, setMargin] = useToolState("margin:margin", "20");

  const result = useMemo(() => {
    const c = Number(cost);
    const p = Number(price);
    const m = Number(margin);
    if (mode === "from-price") {
      if (!isFinite(c) || !isFinite(p) || c < 0 || p < 0) return { error: true } as const;
      return { ...marginMarkup(c, p), impliedPrice: p } as const;
    }
    if (!isFinite(m) || m >= 100) return { error: true } as const;
    if (mode === "from-margin") {
      if (!isFinite(c) || c < 0) return { error: true } as const;
      const implied = priceFromMargin(c, m);
      return implied === null ? { error: true } as const : { ...marginMarkup(c, implied), impliedPrice: implied } as const;
    }
    if (!isFinite(p) || p < 0) return { error: true } as const;
    const implied = costFromMargin(p, m);
    return implied === null ? { error: true } as const : { ...marginMarkup(implied, p), impliedPrice: p } as const;
  }, [mode, cost, price, margin]);

  const fmt = (v: number | null) => (v === null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const pct = (v: number | null) => (v === null ? "—" : `${fmt(v)}%`);

  return (
    <ToolShell
      title="Margin & Markup Calculator"
      khmerTitle="គណនាកំរិតចំណេញ និង Markup"
      description="Convert between cost, selling price, gross margin %, and markup %. Margin is profit over price; markup is profit over cost."
      descriptionKm="បម្លែងរវាងតម្លៃធ្វើ តម្លៃលក់ កំរិតចំណេញសុទ្ធ % និង markup %។ កំរិតចំណេញ = ចំណេញ/តម្លៃលក់; markup = ចំណេញ/តម្លៃធ្វើ។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="w-full sm:w-96">
          <option value="from-price">{t("From cost & selling price", "ពីតម្លៃធ្វើ និងតម្លៃលក់")}</option>
          <option value="from-margin">{t("From cost & target margin", "ពីតម្លៃធ្វើ និងកំរិតចំណេញគោលដៅ")}</option>
          <option value="from-cost">{t("From selling price & target margin", "ពីតម្លៃលក់ និងកំរិតចំណេញគោលដៅ")}</option>
        </Select>
      </Field>
      <Row>
        {mode !== "from-cost" && (
          <Field label={t("Cost", "តម្លៃធ្វើ")}>
            <TextInput type="number" step="any" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
        )}
        {mode !== "from-margin" && (
          <Field label={t("Selling price", "តម្លៃលក់")}>
            <TextInput type="number" step="any" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        )}
        {mode !== "from-price" && (
          <Field label={t("Target gross margin (%)", "កំរិតចំណេញគោលដៅ (%)")} hintKm={t("below 100", "ក្រោម ១០០")}>
            <TextInput type="number" step="any" value={margin} onChange={(e) => setMargin(e.target.value)} />
          </Field>
        )}
      </Row>

      {result.error ? (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Enter non-negative numbers; margin must stay below 100%.", "សូមបញ្ចូលលេខមិនអវិជ្ជមាន; កំរិតចំណេញត្រូវតែក្រោម ១០០%។")} error />
      ) : (
        <div className="space-y-2">
          <Output label={t("Selling price", "តម្លៃលក់")} value={fmt(result.impliedPrice)} />
          <Output label={t("Profit per unit", "ចំណេញក្នុងមួយឯកតា")} value={fmt(result.profit)} />
          <Output label={t("Gross margin", "កំរិតចំណេញសុទ្ធ")} value={pct(result.marginPct)} />
          <Output label={t("Markup on cost", "Markup លើតម្លៃធ្វើ")} value={pct(result.markupPct)} />
        </div>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formulas: profit = price − cost; margin % = profit ÷ price × 100; markup % = profit ÷ cost × 100; price = cost ÷ (1 − margin/100). The two percentages differ: a 20% margin is a 25% markup.", "រូបមន្ត៖ ចំណេញ = តម្លៃលក់ − តម្លៃធ្វើ; កំរិតចំណេញ % = ចំណេញ ÷ តម្លៃលក់ × ១០០; markup % = ចំណេញ ÷ តម្លៃធ្វើ × ១០០; តម្លៃលក់ = តម្លៃធ្វើ ÷ (១ − កំរិតចំណេញ/១០០)។ ភាគរយទាំងពីរខុសគ្នា៖ កំរិតចំណេញ ២០% ស្មើ markup ២៥%។")}
      </p>
    </ToolShell>
  );
}

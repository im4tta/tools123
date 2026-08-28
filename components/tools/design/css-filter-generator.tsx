"use client";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type FilterState = Record<string, { on: boolean; value: string }>;

const FILTERS: { id: string; en: string; km: string; unit: string; max: number; neutral: string }[] = [
  { id: "grayscale", en: "Grayscale", km: "ពណ៌ប្រផេះ", unit: "%", max: 100, neutral: "0" },
  { id: "sepia", en: "Sepia", km: "ពណ៌ត្នោតចាស់", unit: "%", max: 100, neutral: "0" },
  { id: "saturate", en: "Saturate", km: "ភាពរស់នៃពណ៌", unit: "%", max: 300, neutral: "100" },
  { id: "hue-rotate", en: "Hue rotate", km: "បង្វិលពណ៌", unit: "deg", max: 360, neutral: "0" },
  { id: "brightness", en: "Brightness", km: "ពន្លឺ", unit: "%", max: 200, neutral: "100" },
  { id: "contrast", en: "Contrast", km: "ភាពផ្ទុយពណ៌", unit: "%", max: 200, neutral: "100" },
  { id: "blur", en: "Blur", km: "ភាពព្រិល", unit: "px", max: 20, neutral: "0" },
  { id: "invert", en: "Invert", km: "ដាក់បញ្ច្រាស", unit: "%", max: 100, neutral: "0" },
];

const INITIAL: FilterState = Object.fromEntries(FILTERS.map((f) => [f.id, { on: false, value: f.neutral }]));

export default function CssFilterGenerator() {
  const { text: t } = useLanguage();
  const [state, setState] = useToolState<FilterState>("css-filter-generator:state", INITIAL);

  const css = FILTERS.filter(
    (f) => state[f.id]?.on && state[f.id].value !== f.neutral
  )
    .map((f) => `${f.id}(${state[f.id].value}${f.unit})`)
    .join(" ");

  return (
    <ToolShell
      title="CSS Filter Generator"
      khmerTitle="បង្កើត CSS Filter"
      description="Combine CSS filter functions with sliders, preview on a sample image, and copy the filter CSS."
      descriptionKm="ផ្សំ CSS filter ជាមួយគ្រាប់រំកិល មើលជាមុនលើរូបគំរូ រួចចម្លងកូដ filter។"
    >
      <div className="space-y-2">
        {FILTERS.map((f) => {
          const cur = state[f.id];
          return (
            <label
              key={f.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 sm:flex-nowrap"
            >
              <input
                type="checkbox"
                checked={cur.on}
                onChange={(e) => setState((s) => ({ ...s, [f.id]: { ...s[f.id], on: e.target.checked } }))}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              <span className="w-28 text-sm text-[var(--ink)]">{t(f.en, f.km)}</span>
              <input
                type="range"
                min={0}
                max={f.max}
                value={cur.value}
                disabled={!cur.on}
                onChange={(e) => setState((s) => ({ ...s, [f.id]: { ...s[f.id], value: e.target.value } }))}
                className="h-2 min-w-32 flex-1 cursor-pointer accent-[var(--gold)] disabled:opacity-40"
              />
              <span className="w-16 text-right font-mono-ui text-xs text-[var(--ink-dim)]">
                {cur.value}
                {f.unit}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => setState(INITIAL)}>
          {t("Reset", "កំណត់ឡើងវិញ")}
        </Button>
      </div>

      <Field label="Preview" labelKm="មើលជាមុន">
        <svg viewBox="0 0 240 160" className="h-44 w-full rounded-md border border-[var(--ground-line)]" style={{ filter: css || "none" }}>
          <defs>
            <linearGradient id="flt-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f27c96" />
              <stop offset="100%" stopColor="#4cc9f0" />
            </linearGradient>
          </defs>
          <rect width="240" height="160" fill="url(#flt-bg)" />
          <circle cx="60" cy="50" r="30" fill="#ffd166" />
          <circle cx="150" cy="95" r="42" fill="#667eea" opacity="0.8" />
          <rect x="105" y="28" width="95" height="20" rx="10" fill="#2ec4b6" />
          <circle cx="200" cy="40" r="14" fill="#ef476f" />
          <text x="120" y="142" textAnchor="middle" fill="#0a0c0d" fontSize="18" fontWeight="700" fontFamily="system-ui, sans-serif">
            SVG
          </text>
        </svg>
      </Field>

      <Output label={t("CSS", "កូដ CSS")} value={css ? `filter: ${css};` : "filter: none;"} />
    </ToolShell>
  );
}

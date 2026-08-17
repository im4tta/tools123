"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function ScreenRuler() {
  const { text: t } = useLanguage();
  const [cm, setCm] = useToolState("ruler:cm", "10");
  const [dpi, setDpi] = useToolState("ruler:dpi", "96");

  const { px, perCm, tips } = useMemo(() => {
    const d = Number(dpi) || 96;
    const c = Number(cm) || 0;
    const per = Math.round(d * 0.393700787);
    const p = Math.round(c * d * 0.393700787);
    return {
      px: p,
      perCm: per,
      tips: [
        { label: t("1 cm", "១ ស.ម"), px: per },
        { label: t("1 inch", "១ អ៊ីញ"), px: d },
        { label: t("Credit card (8.56 cm)", "កាតឥណទាន (៨.៥៦ ស.ម)"), px: Math.round(8.56 * d * 0.393700787) },
      ],
    };
  }, [cm, dpi, t]);

  return (
    <ToolShell
      title="On-Screen Ruler"
      khmerTitle="បន្ទាត់លើអេក្រង់"
      description="Measure real-world sizes on screen using your display's DPI."
      descriptionKm="វាស់ទំហំជាក់ស្ដែងលើអេក្រង់ ដោយប្រើ DPI របស់អេក្រង់។"
    >
      <Field label={t("Display DPI", "DPI អេក្រង់")} hint={t("Windows default 96, macOS Retina ~144", "Windows 96, macOS Retina ~144")}>
        <Select value={dpi} onChange={(e) => setDpi(e.target.value)} className="w-48">
          <option value="96">96 (Windows)</option>
          <option value="144">144 (Retina)</option>
          <option value="150">150</option>
        </Select>
      </Field>
      <Field label={t("Length (cm)", "ប្រវែង (ស.ម)")}>
        <TextInput inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} />
      </Field>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="relative h-16 w-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 flex items-end" style={{ width: `${Math.min(px, 1200)}px` }}>
            {Array.from({ length: Math.min(px, 1200) }, (_, i) => {
              const isCm = i % perCm === 0;
              return (
                <span
                  key={i}
                  className={`inline-block w-px ${isCm ? "h-6 bg-[var(--ink)]" : i % 5 === 0 ? "h-4 bg-[var(--ink-dim)]" : "h-2 bg-[var(--ink-faint)]"}`}
                />
              );
            })}
          </div>
          <span className="absolute bottom-1 right-2 font-mono-ui text-xs text-[var(--ink-dim)]">
            {cm} cm ≈ {px} px
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {tips.map((tip) => (
          <div key={tip.label} className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm">
            <span className="text-[var(--ink-dim)]">{tip.label}</span>
            <span className="font-mono-ui text-[var(--ink)]">{tip.px} px</span>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
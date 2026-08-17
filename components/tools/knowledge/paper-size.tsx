"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const SERIES: Record<string, [number, [number, number]][]> = {
  A: [
    [0, [841, 1189]], [1, [594, 841]], [2, [420, 594]], [3, [297, 420]], [4, [210, 297]], [5, [148, 210]], [6, [105, 148]], [7, [74, 105]],
  ],
  B: [
    [0, [1000, 1414]], [1, [707, 1000]], [2, [500, 707]], [3, [353, 500]], [4, [250, 353]], [5, [176, 250]], [6, [125, 176]], [7, [88, 125]],
  ],
  C: [
    [0, [917, 1297]], [1, [648, 917]], [2, [458, 648]], [3, [324, 458]], [4, [229, 324]], [5, [162, 229]], [6, [114, 162]], [7, [81, 114]],
  ],
};

export default function PaperSize() {
  const { text: t } = useLanguage();
  const [series, setSeries] = useToolState("paper:series", "A");
  const [size, setSize] = useToolState("paper:size", "4");
  const [dpi] = useToolState("paper:dpi", "300");
  const [unit, setUnit] = useToolState("paper:unit", "mm");
  const [copies, setCopies] = useToolState("paper:copies", "2");
  const [margin, setMargin] = useToolState("paper:margin", "10");

  const calc = useMemo(() => {
    const entry = SERIES[series]?.find(([n]) => n === Number(size));
    if (!entry) return null;
    const [wmm, hmm] = entry[1];
    const m = Number(margin) || 0;
    const c = Math.max(1, Number(copies) || 1);
    const dp = Number(dpi) || 300;
    const mmToUnit = (mm: number) => (unit === "cm" ? mm / 10 : unit === "in" ? mm / 25.4 : mm);
    const mmToPx = (mm: number) => (mm / 25.4) * dp;
    const innerW = Math.max(0, wmm - m * 2);
    const innerH = Math.max(0, hmm - m * 2);
    return {
      label: `${series}${size}`,
      wmm,
      hmm,
      wU: mmToUnit(wmm),
      hU: mmToUnit(hmm),
      pxW: Math.round(mmToPx(wmm)),
      pxH: Math.round(mmToPx(hmm)),
      innerW: mmToUnit(innerW),
      innerH: mmToUnit(innerH),
      area: (wmm / 1000) * (hmm / 1000),
      totalArea: c * (wmm / 1000) * (hmm / 1000),
    };
  }, [series, size, unit, margin, copies, dpi]);

  return (
    <ToolShell
      title="Paper Size Reference"
      khmerTitle="ទំហំក្រដាសស្ដង់ដារ"
      description="Look up ISO A/B/C paper sizes with pixel dimensions, area, and margin calculations."
      descriptionKm="ស្វែងរកទំហំក្រដាស ISO A/B/C ជាមួយវិមាត្រភីកសែល ផ្ទៃ និងការគណនាស៊ុម។"
    >
      <Row>
        <Field label={t("Series", "ស៊េរី")}>
          <Select value={series} onChange={(e) => setSeries(e.target.value)}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </Select>
        </Field>
        <Field label={t("Size", "ទំហំ")}>
          <Select value={size} onChange={(e) => setSize(e.target.value)}>
            {SERIES[series].map(([n]) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Unit", "ឯកតា")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="in">in</option>
          </Select>
        </Field>
      </Row>

      {calc && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              [t("Size", "ទំហំ"), `${calc.wU.toFixed(1)} × ${calc.hU.toFixed(1)} ${unit}`],
              [t("At DPI", "នៅ DPI") + ` ${dpi}`, `${calc.pxW} × ${calc.pxH} px`],
              [t("Area", "ផ្ទៃ"), `${calc.area.toFixed(3)} m²`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{k}</div>
                <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{v}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-md border border-[var(--ground-line)] bg-white">
            <div
              className="mx-auto my-6 border border-[var(--gold)] shadow-sm"
              style={{ width: "min(60%, 220px)", aspectRatio: `${calc.wmm} / ${calc.hmm}` }}
            />
          </div>

          <Row>
            <Field label={t("Copies", "ច្បាប់")}>
              <TextInput inputMode="numeric" value={copies} onChange={(e) => setCopies(e.target.value)} />
            </Field>
            <Field label={t("Margin (mm)", "ស៊ុម (ម.ម)")}>
              <TextInput inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
            </Field>
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Printable area", "ផ្ទៃអាចបោះពុម្ព")}</div>
              <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">
                {calc.innerW.toFixed(1)} × {calc.innerH.toFixed(1)} {unit}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Total paper", "ក្រដាសសរុប")}</div>
              <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{calc.totalArea.toFixed(3)} m²</div>
            </div>
          </div>
        </>
      )}
    </ToolShell>
  );
}
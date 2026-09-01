"use client";
import { ToolShell, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function slider(label: string, value: string, setter: (v: string) => void, min: number, max: number, step: number, unit: string) {
  return (
    <Field label={label}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="w-full accent-[var(--gold)]"
      />
      <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{value}{unit}</div>
    </Field>
  );
}

/** Normalizes a hex color to `#rrggbb` for the color input and parser (black on invalid input). */
function normalizeHex(value: string): string {
  const h = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`.toLowerCase();
  }
  return "#000000";
}

/** Extracts an [r, g, b] tuple from a hex color string. */
function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex);
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

export default function BoxShadowGenerator() {
  const { text: t } = useLanguage();
  const [x, setX] = useToolState("box-shadow-generator:x", "0");
  const [y, setY] = useToolState("box-shadow-generator:y", "8");
  const [blur, setBlur] = useToolState("box-shadow-generator:blur", "24");
  const [spread, setSpread] = useToolState("box-shadow-generator:spread", "0");
  const [color, setColor] = useToolState("box-shadow-generator:color", "#000000");
  const [opacity, setOpacity] = useToolState("box-shadow-generator:opacity", "35");
  const [inset, setInset] = useToolState("box-shadow-generator:inset", false);

  const colorHex = normalizeHex(color);
  const rgb = hexToRgb(colorHex);
  const alpha = Math.max(0, Math.min(100, Number(opacity) || 0)) / 100;

  const shadow = `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  const css = `box-shadow: ${shadow};`;

  return (
    <ToolShell
      title="Box Shadow Generator"
      khmerTitle="បង្កើតស្រមោលប្រអប់"
      description="Compose a CSS box-shadow on a live preview box — offsets, blur, spread, color and inset — then copy the CSS."
      descriptionKm="រៀបចំ CSS box-shadow លើប្រអប់មើលផ្ទាល់ — offset, blur, spread, ពណ៌ និង inset — រួចចម្លងកូដ CSS។"
    >
      <Row>
        {slider(t("Offset X (px)", "ផ្លាស់ទី X (px)"), x, setX, -100, 100, 1, "px")}
        {slider(t("Offset Y (px)", "ផ្លាស់ទី Y (px)"), y, setY, -100, 100, 1, "px")}
        {slider(t("Blur (px)", "Blur (px)"), blur, setBlur, 0, 100, 1, "px")}
        {slider(t("Spread (px)", "Spread (px)"), spread, setSpread, -50, 50, 1, "px")}
      </Row>
      <Row>
        <Field label={t("Shadow color", "ពណ៌ស្រមោល")}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
            />
            <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{colorHex}</span>
          </div>
        </Field>
        {slider(t("Opacity (%)", "ភាពស្រអាប់ (%)"), opacity, setOpacity, 0, 100, 1, "%")}
      </Row>
      <Row>
        <Field label={t("Inset", "ស្រមោលខាងក្នុង")}>
          <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={inset}
              onChange={(e) => setInset(e.target.checked)}
              className="h-4 w-4 accent-[var(--gold)]"
            />
            {t("Draw the shadow inside the box", "គូរស្រមោលខាងក្នុងប្រអប់")}
          </label>
        </Field>
      </Row>

      <div className="relative overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-6 py-16">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--ground-line)_1px,transparent_1px),linear-gradient(90deg,var(--ground-line)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div
          className="relative mx-auto flex h-28 w-44 items-center justify-center rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/15 text-sm font-medium text-[var(--gold)]"
          style={{ boxShadow: shadow }}
        >
          {t("Sample", "គំរូ")}
        </div>
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={css} />
    </ToolShell>
  );
}

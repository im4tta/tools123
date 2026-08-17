"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export default function ColorMixer() {
  const { text: t } = useLanguage();
  const [color1, setColor1] = useToolState("color-mixer:c1", "#FF0000");
  const [color2, setColor2] = useToolState("color-mixer:c2", "#0000FF");
  const [weight, setWeight] = useToolState("color-mixer:weight", "50");

  const result = useMemo(() => {
    const a = hexToRgb(color1);
    const b = hexToRgb(color2);
    if (!a || !b) return null;
    const w = Math.max(0, Math.min(100, Number(weight) || 0)) / 100;
    const r = a[0] * (1 - w) + b[0] * w;
    const g = a[1] * (1 - w) + b[1] * w;
    const bl = a[2] * (1 - w) + b[2] * w;
    return { hex: rgbToHex(r, g, bl), rgb: [Math.round(r), Math.round(g), Math.round(bl)] };
  }, [color1, color2, weight]);

  return (
    <ToolShell
      title="Color Mixer"
      khmerTitle="លាយពណ៌"
      description="Blend two colors with a weight to get the in-between color."
      descriptionKm="លាយពណ៌ពីរដោយកំណត់ទម្ងន់ ដើម្បីទទួលបានពណ៌ចន្លោះ។"
    >
      <Field label={t("Color 1", "ពណ៌ ១")}>
        <div className="flex items-center gap-2">
          <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
          <TextInput value={color1} onChange={(e) => setColor1(e.target.value)} className="font-mono-ui" />
        </div>
      </Field>
      <Field label={t("Color 2", "ពណ៌ ២")}>
        <div className="flex items-center gap-2">
          <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
          <TextInput value={color2} onChange={(e) => setColor2(e.target.value)} className="font-mono-ui" />
        </div>
      </Field>
      <Field label={t("Color 2 weight (%)", "ទម្ងន់ពណ៌ ២ (%)")}>
        <input type="range" min={0} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full" />
      </Field>
      {result && (
        <div className="flex flex-col gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex items-center gap-3">
            <span className="h-16 w-24 rounded-lg border border-black/10" style={{ background: result.hex }} />
            <div>
              <div className="font-mono-ui text-lg font-semibold text-[var(--ink)]">{result.hex}</div>
              <div className="font-mono-ui text-sm text-[var(--ink-dim)]">rgb({result.rgb.join(", ")})</div>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

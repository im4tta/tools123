"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function hexToHsl(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

const HARMONIES = [
  { id: "complementary", label: "Complementary", angles: [180] },
  { id: "analogous", label: "Analogous", angles: [-30, 0, 30] },
  { id: "triadic", label: "Triadic", angles: [0, 120, 240] },
  { id: "tetradic", label: "Tetradic", angles: [0, 90, 180, 270] },
  { id: "split", label: "Split-complementary", angles: [0, 150, 210] },
];

export default function ColorHarmony() {
  const { text: t } = useLanguage();
  const [hex, setHex] = useToolState("color-harmony:hex", "#C9A24B");
  const [harmony, setHarmony] = useToolState("color-harmony:harmony", "complementary");

  const colors = useMemo(() => {
    const hsl = hexToHsl(hex);
    if (!hsl) return [];
    const angles = HARMONIES.find((h) => h.id === harmony)?.angles ?? [];
    return angles.map((angle) => hslToHex(hsl[0] + angle, hsl[1], hsl[2]));
  }, [hex, harmony]);

  return (
    <ToolShell
      title="Color Harmony Generator"
      khmerTitle="បង្កើតពណ៌ដែលចុះសម្រុងគ្នា"
      description="Generate a harmonious color palette (complementary, analogous, triadic, and more) from a single color."
      descriptionKm="បង្កើតក្ដារលាយពណ៌ដែលចុះសម្រុងគ្នា (complementary, analogous, triadic ជាដើម) ពីពណ៌តែមួយ។"
    >
      <Field label={t("Base color", "ពណ៌គោល")}>
        <div className="flex items-center gap-2">
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
          <TextInput value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono-ui" />
        </div>
      </Field>
      <Field label={t("Harmony", "របៀបចុះសម្រុង")}>
        <Select value={harmony} onChange={(e) => setHarmony(e.target.value)} className="w-56">
          {HARMONIES.map((h) => (
            <option key={h.id} value={h.id}>{h.label}</option>
          ))}
        </Select>
      </Field>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <div key={c} className="flex flex-col items-center gap-1">
              <span className="h-16 w-16 rounded-lg border border-black/10" style={{ background: c }} />
              <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">{c}</span>
            </div>
          ))}
        </div>
      )}
    </ToolShell>
  );
}

"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function hexToHsl(hex: string) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255, g = parseInt(m.slice(2, 4), 16) / 255, b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorPaletteGenerator() {
  const [base, setBase] = useToolState("color-palette-generator:base", "#c9a24b");
  const valid = /^#[0-9a-fA-F]{6}$/.test(base);
  const hsl = valid ? hexToHsl(base) : null;
  const swatches = hsl ? [0, 30, 60, 180, 210, 330].map((offset) => hslToHex((hsl.h + offset) % 360, hsl.s, hsl.l)) : [];

  return (
    <ToolShell title="Color Palette Generator" description="Generates complementary and analogous swatches from a base hex color.">
      <Field label="Base color"><TextInput value={base} onChange={(e) => setBase(e.target.value)} className="font-mono-ui" /></Field>
      {valid ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {swatches.map((c) => (
            <div key={c} className="overflow-hidden rounded-md border border-[var(--ground-line)]">
              <div className="h-16" style={{ background: c }} />
              <div className="px-2 py-1.5 text-center font-mono-ui text-xs text-[var(--ink-dim)]">{c}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--danger)]">Enter a valid 6-digit hex color</p>
      )}
    </ToolShell>
  );
}

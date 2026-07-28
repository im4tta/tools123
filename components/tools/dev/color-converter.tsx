"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ColorConverter() {
  const [hex, setHex] = useToolState("color-converter:hex", "#c9a24b");
  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  return (
    <ToolShell title="Color Converter" description="Convert a HEX color into RGB and HSL, with a live swatch.">
      <Field label="HEX"><TextInput value={hex} onChange={(e) => setHex(e.target.value)} className="w-40 font-mono-ui" /></Field>
      <div className="h-24 rounded-md border border-[var(--ground-line)]" style={{ background: rgb ? hex : "transparent" }} />
      <Output label="RGB" value={rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ""} error={!rgb} />
      <Output label="HSL" value={hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : ""} error={!hsl} />
    </ToolShell>
  );
}

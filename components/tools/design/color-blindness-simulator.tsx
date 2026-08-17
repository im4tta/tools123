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

// Linear-RGB simulation matrices for protanopia, deuteranopia, tritanopia.
const MATRICES: Record<string, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
};

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function simulate(hex: string, type: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => srgbToLinear(v / 255));
  let out: number[];
  if (type === "grayscale") {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    out = [lum, lum, lum];
  } else {
    const m = MATRICES[type];
    if (!m) return null;
    out = m.map((row) => row[0] * r + row[1] * g + row[2] * b);
  }
  return rgbToHex(...out.map(linearToSrgb).map((v) => v * 255) as [number, number, number]);
}

const TYPES = [
  { id: "protanopia", label: "Protanopia (red-blind)" },
  { id: "deuteranopia", label: "Deuteranopia (green-blind)" },
  { id: "tritanopia", label: "Tritanopia (blue-blind)" },
  { id: "grayscale", label: "Grayscale" },
];

export default function ColorBlindnessSimulator() {
  const { text: t } = useLanguage();
  const [hex, setHex] = useToolState("color-blind-sim:hex", "#C9A24B");

  const results = useMemo(() => TYPES.map((type) => ({ ...type, color: simulate(hex, type.id) })), [hex]);

  return (
    <ToolShell
      title="Color Blindness Simulator"
      khmerTitle="កម្មវិធីក្លែងធ្វើភាពពិការពណ៌"
      description="Preview a color as seen with different types of color-vision deficiency, for accessible design."
      descriptionKm="មើលពណ៌ដូចដែលអ្នកពិការពណ៌ប្រភេទផ្សេងៗមើលឃើញ សម្រាប់ការរចនាដែលអាចប្រើបានទូលំទូលាយ។"
    >
      <Field label={t("Hex color", "ពណ៌ Hex")}>
        <TextInput value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono-ui" />
      </Field>
      <div className="flex flex-col gap-2">
        {results.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
            <span className="h-9 w-14 shrink-0 rounded border border-black/10" style={{ background: r.color ?? "transparent" }} />
            <span className="flex-1 text-sm text-[var(--ink)]">{r.label}</span>
            <span className="font-mono-ui text-xs text-[var(--ink-faint)]">{r.color ?? "—"}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        {t("Simulation is approximate and uses standard linear-RGB matrices.", "ការក្លែងធ្វើគឺប្រហាក់ប្រហែល និងប្រើម៉ាទ្រីស linear-RGB ស្តង់ដារ។")}
      </p>
    </ToolShell>
  );
}

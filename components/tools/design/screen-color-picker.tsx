"use client";
import { useState } from "react";
import { Pipette } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

interface EyeDropperLike {
  open: () => Promise<{ sRGBHex: string }>;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export default function ScreenColorPicker() {
  const { text: t } = useLanguage();
  const [hex, setHex] = useState<string | null>(null);
  const [error, setError] = useState("");
  const supported = typeof window !== "undefined" && "EyeDropper" in window;

  async function pick() {
    setError("");
    try {
      const dropper = new (window as unknown as { EyeDropper: new () => EyeDropperLike }).EyeDropper();
      const result = await dropper.open();
      setHex(result.sRGBHex.toLowerCase());
    } catch {
      /* user pressed Escape */
    }
  }

  const rgb = hex ? hexToRgb(hex) : null;
  const hsl = rgb ? rgbToHsl(rgb[0], rgb[1], rgb[2]) : null;

  return (
    <ToolShell
      title="Screen Color Picker"
      khmerTitle="កម្មវិធីជ្រើសរើសពណ៌អេក្រង់"
      description="Pick any pixel on your screen with the browser's built-in eyedropper and copy its hex, RGB, or HSL value."
      descriptionKm="ជ្រើសរើសពណ៌ណាមួយលើអេក្រង់ដោយប្រើ eyedropper របស់កម្មវិធីរុករក ហើយចម្លងតម្លៃ hex, RGB ឬ HSL។"
    >
      <div className="space-y-4">
        {!supported && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--ink-dim)]">
            {t("The EyeDropper API is not available in this browser. Try Chrome or Edge.", "API EyeDropper មិនមានក្នុងកម្មវិធីរុករកនេះទេ។ សូមសាកល្បង Chrome ឬ Edge។")}
          </p>
        )}

        <button
          type="button"
          onClick={pick}
          disabled={!supported}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
        >
          <Pipette size={16} />{t("Pick a color from screen", "ជ្រើសរើសពណ៌ពីអេក្រង់")}
        </button>

        {hex && rgb && hsl && (
          <div className="space-y-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="flex items-center gap-4">
              <span className="h-16 w-16 shrink-0 rounded-lg border border-[var(--ground-line)]" style={{ background: hex }} />
              <div className="min-w-0 flex-1 space-y-1.5">
                {[hex, `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`].map((v) => (
                  <div key={v} className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono-ui text-sm text-[var(--ink)]">{v}</span>
                    <CopyButton text={v} compact />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <p className="text-xs text-[var(--ink-faint)]">{t("Press Escape to cancel picking.", "ចុច Escape ដើម្បីបោះបង់។")}</p>
      </div>
    </ToolShell>
  );
}
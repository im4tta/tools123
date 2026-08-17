"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const CHARS = {
  dense: "@%#*+=-:. ",
  normal: "@%#*+=-:. ",
  light: "#:-. ",
};

const charFor = (v: number, palette: string) => {
  const idx = Math.min(palette.length - 1, Math.floor((v / 256) * palette.length));
  return palette[idx];
};

export default function ImageToAscii() {
  const { text: t } = useLanguage();
  const [width, setWidth] = useToolState("ascii:width", "80");
  const [mode, setMode] = useToolState("ascii:mode", "dense");
  const [ascii, setAscii] = useState("");
  const [fileName, setFileName] = useState("");

  const palette = CHARS[mode as keyof typeof CHARS] ?? CHARS.dense;

  const handleFile = (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const w = Math.max(20, Math.min(200, Number(width) || 80));
        const scale = w / img.width;
        const h = Math.max(1, Math.round((img.height * scale) / 2));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let out = "";
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 3;
            out += charFor(255 - lum, palette);
          }
          out += "\n";
        }
        setAscii(out);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const size = useMemo(() => {
    const lines = ascii ? ascii.split("\n").length - 1 : 0;
    const cols = ascii ? ascii.split("\n")[0].length : 0;
    return `${cols}×${lines}`;
  }, [ascii]);

  return (
    <ToolShell
      title="Image → ASCII Art"
      khmerTitle="បម្លែងរូបទៅជាសិល្បៈ ASCII"
      description="Turn any image into text-based ASCII art — great for terminal banners and social posts."
      descriptionKm="បម្លែងរូបភាពណាមួយទៅជាសិល្បៈ ASCII — ល្អសម្រាប់ banner និងប្រកាស។"
    >
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/10 px-4 py-2 text-sm font-medium text-[var(--gold)] transition hover:bg-[var(--gold)]/20">
          {t("Choose image", "ជ្រើសរូបភាព")}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <span className="text-xs text-[var(--ink-faint)]">{fileName || t("PNG, JPG, GIF…", "PNG, JPG, GIF…")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Width (chars)", "ទទឹង (តួអក្សរ)")}>
          <input
            type="range"
            min={40}
            max={160}
            step={10}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full"
          />
        </Field>
        <Field label={t("Density", "ដង់ស៊ីតេ")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="dense">{t("High detail", "លម្អិតខ្ពស់")}</option>
            <option value="light">{t("Light", "ស្រាល")}</option>
          </Select>
        </Field>
      </div>

      {ascii && (
        <>
          <p className="text-xs text-[var(--ink-faint)]">
            {t("Output size", "ទំហំលទ្ធផល")}: {size}
          </p>
          <Output label={t("ASCII art", "សិល្បៈ ASCII")} value={ascii} />
        </>
      )}
    </ToolShell>
  );
}
"use client";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { ToolShell, Field, TextArea, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

type ThemeId = "dark" | "light" | "midnight";

interface CodeTheme {
  bar: string;
  bg: string;
  text: string;
  dim: string;
  badge: string;
  badgeText: string;
}

const THEMES: Record<ThemeId, CodeTheme> = {
  dark: { bar: "#161b22", bg: "#0d1117", text: "#e6edf3", dim: "#8b949e", badge: "#1f6feb", badgeText: "#ffffff" },
  light: { bar: "#f6f8fa", bg: "#ffffff", text: "#24292e", dim: "#57606a", badge: "#d4a72c", badgeText: "#24292e" },
  midnight: { bar: "#1f1d2e", bg: "#191724", text: "#e0def4", dim: "#908caa", badge: "#9ccfd8", badgeText: "#191724" },
};

const DOT_COLORS: Record<ThemeId, string> = {
  dark: "#ff5f57,#febc2e,#28c840",
  light: "#ff5f57,#febc2e,#28c840",
  midnight: "#eb6f92,#f6c177,#31748f",
};

interface Settings {
  code: string;
  theme: ThemeId;
  filename: string;
  language: string;
  showLines: boolean;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export default function CodeToImage() {
  const { text: t } = useLanguage();
  const [s, setS] = useToolState<Settings>("code-to-image", {
    code: 'const greet = (name: string) => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greet("Tools123"));\n',
    theme: "dark",
    filename: "example.ts",
    language: "TypeScript",
    showLines: true,
  });
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));

  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const theme = THEMES[s.theme];
  const dots = DOT_COLORS[s.theme].split(",");
  const lines = s.code.split("\n");

  async function exportPng() {
    const node = captureRef.current;
    if (!node || exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      const url = await watermarkImageDataUrl(canvas.toDataURL("image/png"), "image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(s.filename.trim() || "code").replace(/\.png$/i, "")}.png`;
      a.click();
      recordExport();
    } catch {
      setExportError(t("Could not render the image.", "មិនអាចបង្កើតរូបភាពបានទេ។"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <ToolShell
      title="Code to Image"
      khmerTitle="បម្លែងកូដទៅជារូបភាព"
      description="Turn a code snippet into a styled image card — window chrome, optional line numbers, language badge — and export it as a PNG at 2× scale."
      descriptionKm="បំលែងកូដទៅជាកាតរូបភាពស្អាត — ស៊ុមបង្អួច លេខបន្ទាត់ស្រេចចិត្ត ស្លាកភាសា — ហើយទាញយកជា PNG កម្រិត ២ ដង។"
    >
      <Row>
        <Field label={t("Theme", "ប្រធានបទ")}>
          <Select value={s.theme} onChange={(e) => update({ theme: e.target.value as ThemeId })}>
            <option value="dark">{t("Dark", "ងងឹត")}</option>
            <option value="light">{t("Light", "ភ្លឺ")}</option>
            <option value="midnight">{t("Midnight", "ពាក់កណ្ដាលអាធ្រាត្រ")}</option>
          </Select>
        </Field>
        <Field label={t("Filename", "ឈ្មោះឯកសារ")}>
          <TextInput value={s.filename} onChange={(e) => update({ filename: e.target.value })} placeholder="example.ts" />
        </Field>
        <Field label={t("Language", "ភាសា")}>
          <TextInput value={s.language} onChange={(e) => update({ language: e.target.value })} placeholder="TypeScript" />
        </Field>
      </Row>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
        <input
          type="checkbox"
          checked={s.showLines}
          onChange={(e) => update({ showLines: e.target.checked })}
          className="h-4 w-4 accent-[var(--gold)]"
        />
        {t("Show line numbers", "បង្ហាញលេខបន្ទាត់")}
      </label>
      <Field label={t("Code", "កូដ")}>
        <TextArea rows={8} value={s.code} onChange={(e) => update({ code: e.target.value })} className="font-mono-ui" />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={exportPng} disabled={exporting || !s.code.trim()}>
          {exporting ? t("Rendering…", "កំពុងបង្កើត…") : t("Export PNG (2×)", "ទាញយក PNG (២×)")}
        </Button>
      </div>
      {exportError && <p className="text-sm text-[var(--danger)]">{exportError}</p>}

      <div className="overflow-x-auto rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)]/60 p-4">
        <div
          ref={captureRef}
          className="w-[680px] overflow-hidden rounded-lg"
          style={{ background: theme.bg, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: theme.bar }}>
            <div className="flex gap-1.5">
              {dots.map((d, i) => (
                <span key={i} className="h-3 w-3 rounded-full" style={{ background: d }} />
              ))}
            </div>
            <div className="min-w-0 flex-1 truncate text-center text-xs" style={{ color: theme.dim }}>
              {s.filename || " "}
            </div>
            {s.language && (
              <span
                className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: theme.badge, color: theme.badgeText }}
              >
                {s.language}
              </span>
            )}
          </div>
          <div className="overflow-x-auto px-4 py-4" style={{ color: theme.text, fontFamily: MONO, fontSize: 13, lineHeight: 1.6 }}>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                {s.showLines && (
                  <span className="w-10 shrink-0 select-none pr-4 text-right" style={{ color: theme.dim }}>
                    {i + 1}
                  </span>
                )}
                <span className="whitespace-pre">{line || " "}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "PNG export is powered by html2canvas (v1.4), which renders DOM content to a canvas, licensed under the MIT License.",
            "ការទាញយក PNG ប្រើ html2canvas (v1.4) ដែលបំប្លែង DOM ទៅជា canvas ក្រោមអាជ្ញាបណ្ណ MIT។"
          )}{" "}
          <a href="https://html2canvas.hertzen.com" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
            html2canvas.hertzen.com
          </a>
        </p>
      </div>
    </ToolShell>
  );
}

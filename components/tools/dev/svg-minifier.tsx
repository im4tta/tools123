"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function minifySvg(svg: string): string {
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([<>])\s*/g, "$1")
    .replace(/>\s+</g, "><")
    .replace(/\s*=\s*"/g, '="')
    .trim();
}

export default function SvgMinifier() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("svg-minifier:input", '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <!-- comment -->\n  <rect x="10" y="10" width="80" height="80" fill="#e8a840" />\n</svg>');

  const { min, ratio, valid } = useMemo(() => {
    const stripped = minifySvg(input);
    return {
      min: stripped,
      ratio: input.length > 0 ? Math.round((1 - stripped.length / input.length) * 100) : 0,
      valid: input.trim().startsWith("<svg"),
    };
  }, [input]);

  return (
    <ToolShell
      title="SVG Minifier"
      khmerTitle="បង្រួម SVG"
      description="Strip comments and whitespace from SVG markup to shrink file size."
      descriptionKm="ដកសញ្ញាចំណាំ និងដកឃ្លាចេញពី SVG ដើម្បីកាត់បន្ថយទំហំឯកសារ។"
    >
      <Field label={t("SVG source", "កូដ SVG")}>
        <TextArea rows={8} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      {valid && (
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm">
          <span className="text-[var(--ink-dim)]">
            {t("Before", "មុន")}: <b className="text-[var(--ink)]">{input.length}</b>
          </span>
          <span className="text-[var(--ink-dim)]">
            {t("After", "ក្រោយ")}: <b className="text-[var(--ink)]">{min.length}</b>
          </span>
          <span className="ml-auto font-semibold text-[var(--gold)]">−{ratio}%</span>
        </div>
      )}
      <Output label={t("Minified", "បង្រួមរួច")} value={valid ? min : ""} />
    </ToolShell>
  );
}
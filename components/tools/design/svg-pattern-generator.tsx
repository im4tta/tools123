"use client";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type PatternType = "dots" | "stripes" | "grid" | "checker" | "crosshatch" | "zigzag";

const TYPES: { id: PatternType; en: string; km: string }[] = [
  { id: "dots", en: "Dots", km: "ចំណុច" },
  { id: "stripes", en: "Stripes", km: "ឆ្នូត" },
  { id: "grid", en: "Grid", km: "ក្រឡាចត្រង្គ" },
  { id: "checker", en: "Checkerboard", km: "ក្ដារអុក" },
  { id: "crosshatch", en: "Crosshatch", km: "ឈើឆ្កាង" },
  { id: "zigzag", en: "Zigzag", km: "បន្ទាត់ពត់" },
];

const PATTERN_ID = "tbpat";

function tileSizeFor(type: PatternType, size: number, spacing: number): number {
  const s = Math.max(1, size);
  return type === "checker" ? s * 2 : Math.max(s, spacing, 4);
}

/** Inner pattern content as an SVG string (background + motif). */
function motifString(type: PatternType, fg: string, bg: string, size: number, spacing: number): string {
  const s = Math.max(1, size);
  const g = tileSizeFor(type, s, spacing);
  const rect = type === "checker" ? "" : `<rect width="${g}" height="${g}" fill="${bg}"/>`;
  switch (type) {
    case "dots":
      return `${rect}<circle cx="${g / 2}" cy="${g / 2}" r="${s / 2}" fill="${fg}"/><circle cx="0" cy="0" r="${s / 2}" fill="${fg}"/><circle cx="${g}" cy="0" r="${s / 2}" fill="${fg}"/><circle cx="0" cy="${g}" r="${s / 2}" fill="${fg}"/><circle cx="${g}" cy="${g}" r="${s / 2}" fill="${fg}"/>`;
    case "stripes":
      return `${rect}<path d="M0,${g} L${g},0" stroke="${fg}" stroke-width="${s}"/>`;
    case "grid":
      return `${rect}<path d="M0,0 H${g} M0,0 V${g}" stroke="${fg}" stroke-width="${s}"/>`;
    case "checker":
      return `<rect width="${s}" height="${s}" fill="${fg}"/><rect x="${s}" y="${s}" width="${s}" height="${s}" fill="${fg}"/>`;
    case "crosshatch":
      return `${rect}<path d="M0,${g} L${g},0 M0,0 L${g},${g}" stroke="${fg}" stroke-width="${s}"/>`;
    case "zigzag":
      return `${rect}<path d="M0,0 L${g / 2},${g} L${g},0" stroke="${fg}" stroke-width="${s}" fill="none"/>`;
  }
}

/** <defs> + swatch <rect> markup shared by the live preview and the output. */
function swatchContent(type: PatternType, fg: string, bg: string, size: number, spacing: number): string {
  const g = tileSizeFor(type, size, spacing);
  return `<defs><pattern id="${PATTERN_ID}" width="${g}" height="${g}" patternUnits="userSpaceOnUse">${motifString(type, fg, bg, size, spacing)}</pattern></defs><rect width="240" height="160" fill="url(#${PATTERN_ID})"/>`;
}

function fullSvg(type: PatternType, fg: string, bg: string, size: number, spacing: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">${swatchContent(type, fg, bg, size, spacing)}</svg>`;
}

export default function SvgPatternGenerator() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState<PatternType>("svg-pattern-generator:type", "dots");
  const [fg, setFg] = useToolState("svg-pattern-generator:fg", "#c9a24b");
  const [bg, setBg] = useToolState("svg-pattern-generator:bg", "#1a1e27");
  const [size, setSize] = useToolState("svg-pattern-generator:size", "6");
  const [spacing, setSpacing] = useToolState("svg-pattern-generator:spacing", "16");

  const s = Math.max(1, Number(size) || 1);
  const colorInput = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

  return (
    <ToolShell
      title="SVG Pattern Generator"
      khmerTitle="បង្កើត SVG Pattern"
      description="Generate seamless SVG patterns (dots, stripes, grid, checkerboard, crosshatch, zigzag) and copy the SVG code."
      descriptionKm="បង្កើតលំនាំ SVG ដែលដាក់គ្នាគ្មានថ្នេរ (ចំណុច ឆ្នូត ក្រឡាចត្រង្គ ក្ដារអុក ឈើឆ្កាង បន្ទាត់ពត់) រួចចម្លងកូដ SVG។"
    >
      <Row>
        <Field label="Pattern" labelKm="លំនាំ">
          <Select value={type} onChange={(e) => setType(e.target.value as PatternType)}>
            {TYPES.map((p) => (
              <option key={p.id} value={p.id}>
                {t(p.en, p.km)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Motif size (px)" labelKm="ទំហំតួលំនាំ (px)">
          <TextInput inputMode="numeric" value={size} onChange={(e) => setSize(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Spacing (px)" labelKm="គម្លាត (px)">
          <TextInput inputMode="numeric" value={spacing} onChange={(e) => setSpacing(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Row>
        <Field label="Foreground" labelKm="ពណ៌អក្សរ">
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className={colorInput} />
        </Field>
        <Field label="Background" labelKm="ផ្ទៃខាងក្រោយ">
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className={colorInput} />
        </Field>
      </Row>

      <Row>
        <Field label="Tile preview" labelKm="មើលក្រឡាលំនាំ">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            className="rounded-md border border-[var(--ground-line)]"
            // All content is generated from color inputs and clamped numbers — safe to inject.
            dangerouslySetInnerHTML={{ __html: swatchContent(type, fg, bg, s, Number(spacing) || 16) }}
          />
        </Field>
        <Field label="Full swatch" labelKm="ផ្ទៃពេញ">
          <svg
            width="240"
            height="160"
            viewBox="0 0 240 160"
            className="h-full max-h-36 w-full rounded-md border border-[var(--ground-line)]"
            dangerouslySetInnerHTML={{ __html: swatchContent(type, fg, bg, s, Number(spacing) || 16) }}
          />
        </Field>
      </Row>

      <Output label={t("SVG code", "កូដ SVG")} value={fullSvg(type, fg, bg, s, Number(spacing) || 16)} />
    </ToolShell>
  );
}

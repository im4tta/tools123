"use client";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const PALETTE = ["#c9a24b", "#3ea08c", "#667eea", "#f27c96", "#4cc9f0", "#ffd166", "#ef476f", "#2ec4b6"];
const ALIGN_OPTIONS = ["stretch", "start", "center", "end"] as const;

export default function CssGridPlayground() {
  const { text: t } = useLanguage();
  const [columns, setColumns] = useToolState("css-grid-playground:columns", "1fr 2fr 1fr");
  const [rows, setRows] = useToolState("css-grid-playground:rows", "auto 1fr auto");
  const [gap, setGap] = useToolState("css-grid-playground:gap", "12px");
  const [justify, setJustify] = useToolState("css-grid-playground:justify", "stretch");
  const [align, setAlign] = useToolState("css-grid-playground:align", "stretch");
  const [areas, setAreas] = useToolState("css-grid-playground:areas", "");

  const areaRows = areas
    .split(/\r?\n/)
    .map((l) => l.trim().split(/\s+/))
    .filter((r) => r.length > 0);
  const areasValid = areaRows.length > 0 && areaRows.every((r) => r.length === areaRows[0].length);
  const areaStr = areasValid ? areaRows.map((r) => `"${r.join(" ")}"`).join(" ") : undefined;
  const uniqueAreas = areasValid ? Array.from(new Set(areaRows.flat())) : [];

  const colCount = Math.max(1, (columns.trim() || "1fr").split(/\s+/).length);
  const rowCount = Math.max(1, (rows.trim() || "auto").split(/\s+/).length);
  const totalCells = Math.min(colCount * rowCount, 16);
  const cells = areasValid ? uniqueAreas : Array.from({ length: totalCells }, (_, i) => String(i + 1));

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: columns.trim() || "1fr",
    gridTemplateRows: rows.trim() || "auto",
    gap,
    justifyItems: justify,
    alignItems: align,
    ...(areaStr ? { gridTemplateAreas: areaStr } : {}),
  };

  const cssLines = [
    ".grid {",
    "  display: grid;",
    `  grid-template-columns: ${columns.trim() || "1fr"};`,
    `  grid-template-rows: ${rows.trim() || "auto"};`,
    `  gap: ${gap};`,
    `  justify-items: ${justify};`,
    `  align-items: ${align};`,
    ...(areaStr ? [`  grid-template-areas: ${areaStr};`] : []),
    "}",
  ];

  return (
    <ToolShell
      title="CSS Grid Playground"
      khmerTitle="ទីលានសាកល្បង CSS Grid"
      description="Compose grid templates, gaps, and item alignment on a live colored preview, then copy the CSS."
      descriptionKm="រៀបចំ grid template គម្លាត និងការតម្រឹមលើការមើលជាមុនពណ៌ រួចចម្លងកូដ CSS។"
    >
      <Row>
        <Field label="Columns" labelKm="ជួរឈរ" hint="1fr 2fr 1fr" hintKm="1fr 2fr 1fr">
          <TextInput value={columns} onChange={(e) => setColumns(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Rows" labelKm="ជួរដេក" hint="auto 1fr auto" hintKm="auto 1fr auto">
          <TextInput value={rows} onChange={(e) => setRows(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Row>
        <Field label="Gap" labelKm="គម្លាត" hint="12px" hintKm="12px">
          <TextInput value={gap} onChange={(e) => setGap(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Justify items" labelKm="តម្រៀបផ្ដេក">
          <Select value={justify} onChange={(e) => setJustify(e.target.value)}>
            {ALIGN_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {t(v.charAt(0).toUpperCase() + v.slice(1), v)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Align items" labelKm="តម្រៀបបញ្ឈរ">
          <Select value={align} onChange={(e) => setAlign(e.target.value)}>
            {ALIGN_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {t(v.charAt(0).toUpperCase() + v.slice(1), v)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>
      <Field label="Named areas (optional)" labelKm="តំបន់មានឈ្មោះ (ជម្រើស)" hint="rows on separate lines" hintKm="ជួរដេកនីមួយៗនៅលើបន្ទាត់ដោយឡែក">
        <TextArea rows={3} value={areas} onChange={(e) => setAreas(e.target.value)} placeholder='header header header' />
      </Field>

      <div className="min-h-56 overflow-hidden rounded-md border border-[var(--ground-line)] p-2">
        <div className="h-full min-h-52 w-full" style={gridStyle}>
          {cells.map((name, i) => (
            <div
              key={name}
              style={{
                ...(areaStr ? { gridArea: name } : {}),
                background: PALETTE[i % PALETTE.length],
              }}
              className="flex min-h-12 items-center justify-center rounded-sm p-2 text-center text-xs font-semibold text-[#0a0c0d]"
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={cssLines.join("\n")} />
    </ToolShell>
  );
}

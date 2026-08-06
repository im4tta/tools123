"use client";

import { useState } from "react";
import { FileSearch } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Output } from "@/components/ui/Output";
import { Field, ToolShell } from "@/components/ui/Shell";

type TableRecord = { tag: string; offset: number; length: number };
type CmapRecord = { platform: number; encoding: number; format: number; offset: number };
type FontReport = {
  fileName: string;
  fileSize: number;
  flavor: string;
  tables: TableRecord[];
  names: string[];
  cmaps: CmapRecord[];
  khmerGlyphs: number | null;
};

const KHMER_START = 0x1780;
const KHMER_END = 0x17ff;

function hasBytes(view: DataView, offset: number, length: number) {
  return offset >= 0 && length >= 0 && offset + length <= view.byteLength;
}

function readTag(view: DataView, offset: number) {
  if (!hasBytes(view, offset, 4)) throw new Error("Font table is outside the file.");
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function fontFlavor(view: DataView) {
  const signature = readTag(view, 0);
  if (signature === "OTTO") return "OpenType CFF (OTTO)";
  if (signature === "true") return "TrueType (Apple)";
  if (signature === "typ1") return "PostScript Type 1";
  if (view.getUint32(0) === 0x00010000) return "TrueType";
  throw new Error("Choose an uncompressed TTF or OTF font file.");
}

function decodeName(view: DataView, offset: number, length: number, platform: number) {
  if (!hasBytes(view, offset, length)) return "";
  let value = "";
  if (platform === 0 || platform === 3) {
    for (let index = 0; index + 1 < length; index += 2) value += String.fromCharCode(view.getUint16(offset + index));
  } else {
    for (let index = 0; index < length; index += 1) value += String.fromCharCode(view.getUint8(offset + index));
  }
  return value.replace(/\0/gu, "").trim();
}

function parseNames(view: DataView, table: TableRecord | undefined) {
  if (!table || !hasBytes(view, table.offset, 6)) return [];
  const count = view.getUint16(table.offset + 2);
  const stringStorage = table.offset + view.getUint16(table.offset + 4);
  const labels: Record<number, string> = { 1: "Family", 2: "Subfamily", 4: "Full name", 6: "PostScript name" };
  const names: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const record = table.offset + 6 + index * 12;
    if (!hasBytes(view, record, 12)) break;
    const nameId = view.getUint16(record + 6);
    const label = labels[nameId];
    if (!label) continue;
    const length = view.getUint16(record + 8);
    const offset = stringStorage + view.getUint16(record + 10);
    const value = decodeName(view, offset, length, view.getUint16(record));
    if (value) names.push(`${label}: ${value}`);
  }
  return [...new Set(names)];
}

function parseCmaps(view: DataView, table: TableRecord | undefined) {
  if (!table || !hasBytes(view, table.offset, 4)) return [];
  const count = view.getUint16(table.offset + 2);
  const records: CmapRecord[] = [];
  for (let index = 0; index < count; index += 1) {
    const record = table.offset + 4 + index * 8;
    if (!hasBytes(view, record, 8)) break;
    const offset = table.offset + view.getUint32(record + 4);
    if (!hasBytes(view, offset, 2)) continue;
    records.push({
      platform: view.getUint16(record),
      encoding: view.getUint16(record + 2),
      format: view.getUint16(offset),
      offset,
    });
  }
  return records;
}

function glyphFromFormat4(view: DataView, offset: number, codepoint: number) {
  if (!hasBytes(view, offset, 14)) return false;
  const segments = view.getUint16(offset + 6) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + segments * 2 + 2;
  const deltas = startCodes + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  if (!hasBytes(view, rangeOffsets, segments * 2)) return false;

  for (let index = 0; index < segments; index += 1) {
    const start = view.getUint16(startCodes + index * 2);
    const end = view.getUint16(endCodes + index * 2);
    if (codepoint < start || codepoint > end) continue;
    const rangeOffsetLocation = rangeOffsets + index * 2;
    const rangeOffset = view.getUint16(rangeOffsetLocation);
    if (rangeOffset === 0) return ((codepoint + view.getInt16(deltas + index * 2)) & 0xffff) !== 0;
    const glyphLocation = rangeOffsetLocation + rangeOffset + (codepoint - start) * 2;
    if (!hasBytes(view, glyphLocation, 2)) return false;
    const glyph = view.getUint16(glyphLocation);
    return glyph !== 0 && ((glyph + view.getInt16(deltas + index * 2)) & 0xffff) !== 0;
  }
  return false;
}

function glyphFromFormat6(view: DataView, offset: number, codepoint: number) {
  if (!hasBytes(view, offset, 10)) return false;
  const firstCode = view.getUint16(offset + 6);
  const entries = view.getUint16(offset + 8);
  if (codepoint < firstCode || codepoint >= firstCode + entries) return false;
  const glyphLocation = offset + 10 + (codepoint - firstCode) * 2;
  return hasBytes(view, glyphLocation, 2) && view.getUint16(glyphLocation) !== 0;
}

function glyphFromFormat12(view: DataView, offset: number, codepoint: number) {
  if (!hasBytes(view, offset, 16)) return false;
  const groups = view.getUint32(offset + 12);
  for (let index = 0; index < groups; index += 1) {
    const group = offset + 16 + index * 12;
    if (!hasBytes(view, group, 12)) return false;
    if (codepoint >= view.getUint32(group) && codepoint <= view.getUint32(group + 4)) return true;
  }
  return false;
}

/** Shared cmap-level glyph check for tools that need per-codepoint coverage. */
export function inspectCodepointCoverage(buffer: ArrayBuffer, codepoints: number[]) {
  const view = new DataView(buffer);
  fontFlavor(view);
  const tableCount = view.getUint16(4);
  const cmapTable: TableRecord[] = [];
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    if (!hasBytes(view, record, 16)) continue;
    const tag = readTag(view, record);
    if (tag === "cmap") cmapTable.push({ tag, offset: view.getUint32(record + 8), length: view.getUint32(record + 12) });
  }
  const cmaps = parseCmaps(view, cmapTable[0]);
  const cmap = cmaps.find((item) => item.format === 12) ?? cmaps.find((item) => item.format === 4) ?? cmaps.find((item) => item.format === 6);
  if (!cmap) return codepoints.map(() => false);
  return codepoints.map((codepoint) => cmap.format === 12
    ? glyphFromFormat12(view, cmap.offset, codepoint)
    : cmap.format === 4
      ? glyphFromFormat4(view, cmap.offset, codepoint)
      : glyphFromFormat6(view, cmap.offset, codepoint));
}

function khmerGlyphCoverage(view: DataView, cmaps: CmapRecord[]) {
  const cmap = cmaps.find((item) => item.format === 12) ?? cmaps.find((item) => item.format === 4) ?? cmaps.find((item) => item.format === 6);
  if (!cmap) return null;
  let count = 0;
  for (let codepoint = KHMER_START; codepoint <= KHMER_END; codepoint += 1) {
    const present = cmap.format === 12
      ? glyphFromFormat12(view, cmap.offset, codepoint)
      : cmap.format === 4
        ? glyphFromFormat4(view, cmap.offset, codepoint)
        : glyphFromFormat6(view, cmap.offset, codepoint);
    if (present) count += 1;
  }
  return count;
}

function parseFont(fileName: string, fileSize: number, buffer: ArrayBuffer): FontReport {
  const view = new DataView(buffer);
  if (!hasBytes(view, 0, 12)) throw new Error("This file is too small to be a TTF or OTF font.");
  const flavor = fontFlavor(view);
  const tableCount = view.getUint16(4);
  if (!hasBytes(view, 12, tableCount * 16)) throw new Error("The font table directory is incomplete.");
  const tables: TableRecord[] = [];
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    const offset = view.getUint32(record + 8);
    const length = view.getUint32(record + 12);
    if (!hasBytes(view, offset, length)) continue;
    tables.push({ tag: readTag(view, record), offset, length });
  }
  const cmaps = parseCmaps(view, tables.find((table) => table.tag === "cmap"));
  return {
    fileName,
    fileSize,
    flavor,
    tables,
    names: parseNames(view, tables.find((table) => table.tag === "name")),
    cmaps,
    khmerGlyphs: khmerGlyphCoverage(view, cmaps),
  };
}

function formatSize(bytes: number) {
  return `${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`;
}

export default function KhmerFontEncodingInspector() {
  const { text: t } = useLanguage();
  const [report, setReport] = useState<FontReport | null>(null);
  const [error, setError] = useState("");

  async function inspectFile(file: File | undefined) {
    if (!file) return;
    setReport(null);
    setError("");
    if (file.size > 20 * 1024 * 1024) {
      setError(t("Choose a font file smaller than 20 MB.", "សូមជ្រើសរើសឯកសារពុម្ពអក្សរដែលតូចជាង ២០ MB។"));
      return;
    }
    try {
      setReport(parseFont(file.name, file.size, await file.arrayBuffer()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Unable to read this font file.", "មិនអាចអានឯកសារពុម្ពអក្សរនេះបានទេ។"));
    }
  }

  return (
    <ToolShell
      title="Khmer Font Encoding Inspector"
      khmerTitle="ពិនិត្យការអ៊ិនកូដពុម្ពអក្សរខ្មែរ"
      description="Inspect a local TTF or OTF font file: embedded names, Unicode character-map tables, and Khmer Unicode-block glyph coverage. The font stays in your browser."
      descriptionKm="ពិនិត្យឯកសារពុម្ពអក្សរ TTF ឬ OTF នៅលើឧបករណ៍របស់អ្នក៖ ឈ្មោះដែលភ្ជាប់ក្នុងពុម្ពអក្សរ តារាងផែនទីតួអក្សរយូនីកូដ និងកម្រិតគាំទ្រតួអក្សរខ្មែរ។ ឯកសារពុម្ពអក្សររក្សាទុកក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <Field label="TTF or OTF font file" labelKm="ឯកសារពុម្ពអក្សរ TTF ឬ OTF">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]">
          <FileSearch size={18} />
          {t("Choose a local font file", "ជ្រើសរើសឯកសារពុម្ពអក្សរក្នុងឧបករណ៍")}
          <input type="file" accept=".ttf,.otf,font/ttf,font/otf" className="sr-only" onChange={(event) => inspectFile(event.currentTarget.files?.[0])} />
        </label>
      </Field>

      {error && <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>}

      {report && (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [t("Format", "ទម្រង់"), report.flavor],
              [t("Size", "ទំហំ"), formatSize(report.fileSize)],
              [t("Tables", "តារាង"), `${report.tables.length}`],
              [t("Khmer glyphs", "តួអក្សរខ្មែរ"), report.khmerGlyphs === null ? "—" : `${report.khmerGlyphs}/128`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <p className="text-xs text-[var(--ink-faint)]">{label}</p>
                <p className="mt-1 truncate text-sm font-medium text-[var(--ink)]" title={value}>{value}</p>
              </div>
            ))}
          </section>
          <Output label={t("Embedded font names", "ឈ្មោះពុម្ពអក្សរដែលភ្ជាប់")} value={report.names.join("\n") || "—"} mono={false} />
          <Output
            label={t("Character maps (cmap)", "ផែនទីតួអក្សរ (cmap)")}
            value={report.cmaps.map((cmap) => `Platform ${cmap.platform}, encoding ${cmap.encoding}, format ${cmap.format}`).join("\n") || "No usable cmap table found."}
          />
          <Output label={t("OpenType tables", "តារាង OpenType")} value={report.tables.map((table) => `${table.tag}\t${table.length.toLocaleString()} bytes`).join("\n")} />
          <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
            {t(
              "This reads standard Unicode cmap tables. It does not convert text written with legacy Khmer keyboard/font encodings.",
              "ឧបករណ៍នេះអានតារាង cmap យូនីកូដស្តង់ដារ។ វាមិនបម្លែងអត្ថបទដែលវាយដោយការអ៊ិនកូដក្តារចុច ឬពុម្ពអក្សរខ្មែរចាស់ទេ។"
            )}
          </p>
        </div>
      )}
    </ToolShell>
  );
}

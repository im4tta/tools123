"use client";

// ID Card Studio — batch ID-badge / staff-card designer.
//
// Adapted from the user's own "id-card-studio.html" prototype into the app's
// shared primitives and conventions. All rendering is client-side and local;
// nothing is uploaded. Codes are generated with qrcode-generator (MIT) and
// JsBarcode (MIT); PNG/PDF/ZIP export use html2canvas, jsPDF and JSZip — see
// the Source & Credits section at the bottom of the tool.
//
// Persistence note: the design + company settings survive navigation via
// useToolState. The people roster (which may hold large base64 photos) is kept
// in memory only, to avoid filling the localStorage quota with image data.

import { useCallback, useEffect, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import {
  Users, UserPlus, CopyPlus, Trash2, FileSpreadsheet, ImagePlus, RotateCcw,
  Palette, Type as TypeIcon, Building2, QrCode, Download, FolderDown, Printer,
} from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

/* ------------------------------------------------------------------ types */

type LayoutId = "standard" | "photo-left" | "photo-right" | "banner" | "stripe" | "minimal";
type PhotoShape = "circle" | "rounded" | "square" | "hexagon";
type CodeType = "none" | "qr" | "barcode";
type Orientation = "portrait" | "landscape";
type FontId = "display" | "sans" | "serif" | "mono" | "khmer" | "moul";
type TabId = "people" | "design" | "type" | "company" | "code" | "export";

interface ImgAdjust {
  scale: number; panX: number; panY: number;
  brightness: number; contrast: number; saturate: number; grayscale: boolean;
}

interface Person {
  id: string;
  name: string;
  jobTitle: string;
  idLabel: string;
  idValue: string;
  dateLabel: string;
  dateValue: string;
  codeText: string;
  backNote: string;
  photo: string | null;
  img: ImgAdjust;
}

interface Company {
  short: string;
  full: string;
  tagline: string;
  logo: string | null;
  backText: string;
  returnLine: string;
}

interface Design {
  layout: LayoutId;
  orientation: Orientation;
  bg: string;
  customSolid: string;
  gradA: string;
  gradB: string;
  gradAngle: number;
  pattern: string;
  patternColor: string;
  patternOpacity: number;
  overlayDark: number;
  primary: string;
  text: string;
  corner: number;
  border: boolean;
  borderColor: string;
  borderWidth: number;
  photoShape: PhotoShape;
  photoBorderColor: string;
  photoBorderWidth: number;
  font: FontId;
  sizeCompanyShort: number;
  sizeCompanyFull: number;
  sizeName: number;
  sizeTitle: number;
  sizeFooter: number;
  showBack: boolean;
}

/* --------------------------------------------------------------- defaults */

const DEFAULT_IMG: ImgAdjust = { scale: 1, panX: 0, panY: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: false };

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function samplePerson(name: string, jobTitle: string, idValue: string, codeText: string): Person {
  return {
    id: newId(), name, jobTitle,
    idLabel: "ID", idValue,
    dateLabel: "Valid", dateValue: "2027",
    codeText, backNote: "", photo: null, img: { ...DEFAULT_IMG },
  };
}

const INITIAL_ROSTER: Person[] = [
  samplePerson("Sok Dara", "Project Engineer", "SC-0142", "SC-0142"),
  samplePerson("Chan Sreymom", "HR Officer", "SC-0087", "SC-0087"),
];

const INITIAL_COMPANY: Company = {
  short: "STUDIO CO.",
  full: "Studio Company Limited",
  tagline: "Phnom Penh, Cambodia",
  logo: null,
  backText: "This card is the property of the company and must be returned on request.",
  returnLine: "If found, please return to the address above.",
};

const INITIAL_DESIGN: Design = {
  layout: "standard",
  orientation: "portrait",
  bg: "gradient-blue",
  customSolid: "#0f172a",
  gradA: "#0f172a",
  gradB: "#1e3a8a",
  gradAngle: 135,
  pattern: "none",
  patternColor: "#ffffff",
  patternOpacity: 12,
  overlayDark: 8,
  primary: "#f2a444",
  text: "#ffffff",
  corner: 22,
  border: false,
  borderColor: "#ffffff",
  borderWidth: 2,
  photoShape: "circle",
  photoBorderColor: "#ffffff",
  photoBorderWidth: 4,
  font: "display",
  sizeCompanyShort: 18,
  sizeCompanyFull: 12,
  sizeName: 24,
  sizeTitle: 14,
  sizeFooter: 10,
  showBack: false,
};

/* --------------------------------------------------------- font + palette */

const FONTS: { id: FontId; en: string; km: string; css: string }[] = [
  { id: "display", en: "Display", km: "ការបង្ហាញ", css: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif" },
  { id: "sans", en: "Sans", km: "អក្សរធម្មតា", css: "ui-sans-serif, system-ui, 'Segoe UI', Arial, sans-serif" },
  { id: "serif", en: "Serif", km: "អក្សរមានជើង", css: "Georgia, 'Times New Roman', serif" },
  { id: "mono", en: "Mono", km: "អក្សរម៉ូណូ", css: "var(--font-jetbrains-mono), ui-monospace, monospace" },
  { id: "khmer", en: "Khmer — Kantumruy", km: "ខ្មែរ — កន្ទុយម្រ", css: "var(--font-kantumruy-pro), 'Khmer OS', sans-serif" },
  { id: "moul", en: "Khmer — Moul", km: "ខ្មែរ — មូល", css: "var(--font-moul), 'Khmer OS Muol', serif" },
];
const fontCss = (id: FontId) => FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css;

const BG_PRESETS: { id: string; group: string; groupKm: string; en: string; km: string; css: (d: Design) => string }[] = [
  { id: "solid-dark", group: "Solid", groupKm: "ពណ៌តែមួយ", en: "Solid Dark", km: "ខ្មៅ", css: () => "#1e293b" },
  { id: "solid-light", group: "Solid", groupKm: "ពណ៌តែមួយ", en: "Solid Light", km: "ភ្លឺ", css: () => "#e2e8f0" },
  { id: "solid-custom", group: "Solid", groupKm: "ពណ៌តែមួយ", en: "Custom Solid", km: "ផ្ទាល់ខ្លួន", css: (d) => d.customSolid },
  { id: "gradient-blue", group: "Gradient", groupKm: "ជម្រាល", en: "Modern Blue", km: "ខៀវ", css: () => "linear-gradient(135deg,#1e3a8a,#2563eb)" },
  { id: "gradient-sunset", group: "Gradient", groupKm: "ជម្រាល", en: "Sunset", km: "ថ្ងៃលិច", css: () => "linear-gradient(135deg,#f97316,#db2777)" },
  { id: "gradient-emerald", group: "Gradient", groupKm: "ជម្រាល", en: "Emerald", km: "បៃតង", css: () => "linear-gradient(135deg,#065f46,#10b981)" },
  { id: "gradient-royal", group: "Gradient", groupKm: "ជម្រាល", en: "Royal Purple", km: "ស្វាយ", css: () => "linear-gradient(135deg,#4c1d95,#7c3aed)" },
  { id: "gradient-charcoal", group: "Gradient", groupKm: "ជម្រាល", en: "Charcoal", km: "ធ្យូង", css: () => "linear-gradient(135deg,#374151,#111827)" },
  { id: "gradient-ocean", group: "Gradient", groupKm: "ជម្រាល", en: "Ocean", km: "សមុទ្រ", css: () => "linear-gradient(135deg,#0e7490,#155e75)" },
  { id: "gradient-crimson", group: "Bold", groupKm: "ក្លាហាន", en: "Crimson", km: "ក្រហម", css: () => "linear-gradient(135deg,#7f1d1d,#dc2626)" },
  { id: "gradient-gold", group: "Bold", groupKm: "ក្លាហាន", en: "Black & Gold", km: "មាស", css: () => "linear-gradient(135deg,#0a0a0a,#b8860b)" },
  { id: "gradient-teal", group: "Bold", groupKm: "ក្លាហាន", en: "Teal", km: "បៃតងខៀវ", css: () => "linear-gradient(135deg,#0f766e,#14b8a6)" },
  { id: "gradient-rose", group: "Bold", groupKm: "ក្លាហាន", en: "Rose", km: "ផ្កាកុលាប", css: () => "linear-gradient(135deg,#9f1239,#fb7185)" },
  { id: "gradient-indigo", group: "Bold", groupKm: "ក្លាហាន", en: "Indigo", km: "ខៀវ​ចាស់", css: () => "linear-gradient(135deg,#312e81,#6366f1)" },
  { id: "gradient-custom", group: "Custom", groupKm: "ផ្ទាល់ខ្លួន", en: "Custom Gradient", km: "ជម្រាលផ្ទាល់ខ្លួន", css: (d) => `linear-gradient(${d.gradAngle}deg,${d.gradA},${d.gradB})` },
];
const bgCss = (d: Design) => (BG_PRESETS.find((p) => p.id === d.bg) ?? BG_PRESETS[3]).css(d);

const PATTERNS: { id: string; en: string; km: string }[] = [
  { id: "none", en: "None", km: "គ្មាន" },
  { id: "dots", en: "Dot Grid", km: "ចំណុច" },
  { id: "grid", en: "Grid Lines", km: "បន្ទាត់ក្រឡា" },
  { id: "diagonal", en: "Diagonal Stripes", km: "ឆ្នូតទ្រេត" },
  { id: "crosshatch", en: "Crosshatch", km: "ខ្វែង" },
  { id: "carbon", en: "Carbon", km: "កាបូន" },
];

function patternImage(pattern: string, color: string): string {
  switch (pattern) {
    case "dots": return `radial-gradient(${color} 1.2px, transparent 1.2px)`;
    case "grid": return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
    case "diagonal": return `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 12px)`;
    case "crosshatch": return `repeating-linear-gradient(45deg, ${color} 0 1px, transparent 1px 10px), repeating-linear-gradient(-45deg, ${color} 0 1px, transparent 1px 10px)`;
    case "carbon": return `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, ${color} 0 2px, transparent 2px 4px)`;
    default: return "none";
  }
}
function patternSize(pattern: string): string {
  switch (pattern) {
    case "dots": return "12px 12px";
    case "grid": return "18px 18px";
    default: return "auto";
  }
}

/* --------------------------------------------------------------- QR / bar */

function qrDataUrl(text: string): string {
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    const qr = qrcode(0, "M");
    qr.addData(text, "Byte");
    qr.make();
    const n = qr.getModuleCount();
    const cell = 6;
    const margin = 2;
    const size = (n + margin * 2) * cell;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

async function barcodeDataUrl(text: string): Promise<string> {
  try {
    const mod = await import("jsbarcode");
    const JsBarcode = (mod.default ?? mod) as (el: unknown, text: string, opts?: Record<string, unknown>) => void;
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text || " ", {
      format: "CODE128", lineColor: "#000000", background: "#ffffff",
      width: 2, height: 44, displayValue: false, margin: 6,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------- CSV import */

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch === "\r") { /* skip */ }
    else field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/* -------------------------------------------------------------- IdCard UI */

const BASE_W = 320; // portrait width (px) — CR80 ratio ≈ 2.125 : 3.375
const BASE_H = 508;

function CardBackground({ design }: { design: Design }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: bgCss(design) }} />
      {design.pattern !== "none" && (
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: patternImage(design.pattern, design.patternColor),
            backgroundSize: patternSize(design.pattern),
            opacity: design.patternOpacity / 100,
          }}
        />
      )}
      {design.overlayDark > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${design.overlayDark / 100})` }} />
      )}
    </>
  );
}

function Photo({ person, design, size }: { person: Person; design: Design; size: number }) {
  const shapeStyle: React.CSSProperties =
    design.photoShape === "circle" ? { borderRadius: "50%" }
      : design.photoShape === "rounded" ? { borderRadius: 14 }
        : design.photoShape === "hexagon" ? { clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)" }
          : { borderRadius: 2 };
  const border = design.photoBorderWidth > 0 && design.photoShape !== "hexagon"
    ? { border: `${design.photoBorderWidth}px solid ${design.photoBorderColor}` } : {};
  const { img } = person;
  return (
    <div
      style={{
        width: size, height: size, flexShrink: 0, overflow: "hidden",
        background: "rgba(255,255,255,0.12)", ...shapeStyle, ...border,
        display: "grid", placeItems: "center",
      }}
    >
      {person.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photo}
          alt=""
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${img.scale}) translate(${img.panX}%, ${img.panY}%)`,
            filter: `brightness(${img.brightness}%) contrast(${img.contrast}%) saturate(${img.saturate}%) ${img.grayscale ? "grayscale(1)" : ""}`,
          }}
        />
      ) : (
        <Users size={size * 0.42} color={design.text} style={{ opacity: 0.5 }} />
      )}
    </div>
  );
}

function CodeChip({ src, size }: { src: string; size: number }) {
  if (!src) return null;
  return (
    <div style={{ background: "#fff", borderRadius: 6, padding: 4, lineHeight: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="code" style={{ width: size, height: "auto", display: "block" }} />
    </div>
  );
}

function CompanyHeader({ company, design, align = "center" }: { company: Company; design: Design; align?: "center" | "left" }) {
  return (
    <div style={{ textAlign: align, lineHeight: 1.15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: align === "center" ? "center" : "flex-start" }}>
        {company.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo} alt="" style={{ height: design.sizeCompanyShort * 1.3, width: "auto", objectFit: "contain" }} />
        )}
        <span style={{ fontSize: design.sizeCompanyShort, fontWeight: 800, color: design.primary, letterSpacing: 0.4 }}>
          {company.short}
        </span>
      </div>
      {company.full && <div style={{ fontSize: design.sizeCompanyFull, fontWeight: 600, color: design.text, opacity: 0.92, marginTop: 2 }}>{company.full}</div>}
      {company.tagline && <div style={{ fontSize: design.sizeCompanyFull * 0.82, color: design.text, opacity: 0.7, marginTop: 1 }}>{company.tagline}</div>}
    </div>
  );
}

function NameBlock({ person, design, align = "center" }: { person: Person; design: Design; align?: "center" | "left" }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: design.sizeName, fontWeight: 800, color: design.text, lineHeight: 1.1 }}>{person.name || " "}</div>
      {person.jobTitle && (
        <div style={{ fontSize: design.sizeTitle, fontWeight: 600, color: design.primary, marginTop: 3 }}>{person.jobTitle}</div>
      )}
    </div>
  );
}

function FooterRow({ person, design, align = "center" }: { person: Person; design: Design; align?: "center" | "left" }) {
  return (
    <div style={{ textAlign: align, minWidth: 0 }}>
      {person.idValue && (
        <div style={{ fontSize: design.sizeFooter, color: design.text, opacity: 0.9 }}>
          <span style={{ opacity: 0.7 }}>{person.idLabel}: </span>
          <span style={{ fontWeight: 700 }}>{person.idValue}</span>
        </div>
      )}
      {person.dateValue && (
        <div style={{ fontSize: design.sizeFooter, color: design.text, opacity: 0.75 }}>
          {person.dateLabel}: {person.dateValue}
        </div>
      )}
    </div>
  );
}

function CardFront({ person, design, company, codeSrc }: { person: Person; design: Design; company: Company; codeSrc: string }) {
  const codeSize = design.orientation === "portrait" ? 54 : 48;
  const showCode = !design.showBack && codeSrc !== "";
  const code = showCode ? <CodeChip src={codeSrc} size={codeSize} /> : null;

  if (design.layout === "photo-left" || design.layout === "photo-right") {
    const photoFirst = design.layout === "photo-left";
    const photoCol = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Photo person={person} design={design} size={design.orientation === "portrait" ? 92 : 84} />
        {code}
      </div>
    );
    const textCol = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, minWidth: 0 }}>
        <CompanyHeader company={company} design={design} align="left" />
        <div style={{ height: 1, background: design.primary, opacity: 0.5 }} />
        <NameBlock person={person} design={design} align="left" />
        <div style={{ marginTop: "auto" }}>
          <FooterRow person={person} design={design} align="left" />
        </div>
      </div>
    );
    return (
      <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", gap: 14, alignItems: "stretch" }}>
        {photoFirst ? <>{photoCol}{textCol}</> : <>{textCol}{photoCol}</>}
      </div>
    );
  }

  if (design.layout === "banner") {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ background: design.primary, padding: "14px 16px 30px" }}>
          <CompanyHeader company={company} design={{ ...design, primary: design.text, text: "#0a0a0a" }} align="center" />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "0 18px 18px", marginTop: -26 }}>
          <Photo person={person} design={design} size={72} />
          <div style={{ marginTop: 10 }}><NameBlock person={person} design={design} /></div>
          <div style={{ marginTop: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {code}
            <FooterRow person={person} design={design} />
          </div>
        </div>
      </div>
    );
  }

  if (design.layout === "stripe") {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ width: 12, background: design.primary, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
          <CompanyHeader company={company} design={design} align="left" />
          <div style={{ alignSelf: "center" }}><Photo person={person} design={design} size={96} /></div>
          <NameBlock person={person} design={design} align="left" />
          <div style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
            <FooterRow person={person} design={design} align="left" />
            {code}
          </div>
        </div>
      </div>
    );
  }

  if (design.layout === "minimal") {
    return (
      <div style={{ position: "absolute", inset: 0, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Photo person={person} design={design} size={64} />
          <NameBlock person={person} design={design} align="left" />
        </div>
        <div style={{ height: 1, background: design.text, opacity: 0.2 }} />
        <CompanyHeader company={company} design={design} align="left" />
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <FooterRow person={person} design={design} align="left" />
          {code}
        </div>
      </div>
    );
  }

  // standard (default) — vertical, centered
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <CompanyHeader company={company} design={design} />
      <div style={{ marginTop: 4 }}><Photo person={person} design={design} size={design.orientation === "portrait" ? 104 : 88} /></div>
      <NameBlock person={person} design={design} />
      <div style={{ marginTop: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {code}
        <FooterRow person={person} design={design} />
      </div>
    </div>
  );
}

function CardBack({ person, design, company, codeSrc }: { person: Person; design: Design; company: Company; codeSrc: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
      <CompanyHeader company={company} design={design} />
      <div style={{ height: 1, width: "60%", background: design.primary, opacity: 0.5 }} />
      {person.backNote && <div style={{ fontSize: design.sizeFooter + 1, color: design.text, opacity: 0.95, fontWeight: 600 }}>{person.backNote}</div>}
      {company.backText && <div style={{ fontSize: design.sizeFooter, color: design.text, opacity: 0.8, lineHeight: 1.4 }}>{company.backText}</div>}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
        {codeSrc && <CodeChip src={codeSrc} size={design.orientation === "portrait" ? 90 : 76} />}
        {company.returnLine && <div style={{ fontSize: design.sizeFooter * 0.92, color: design.text, opacity: 0.7 }}>{company.returnLine}</div>}
      </div>
    </div>
  );
}

/** One full card face at fixed pixel size — reused for preview and export. */
function IdCardFace({
  person, design, company, codeSrc, side, cardRef,
}: {
  person: Person; design: Design; company: Company; codeSrc: string; side: "front" | "back";
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const w = design.orientation === "portrait" ? BASE_W : BASE_H;
  const h = design.orientation === "portrait" ? BASE_H : BASE_W;
  return (
    <div
      ref={cardRef}
      style={{
        position: "relative", width: w, height: h, overflow: "hidden",
        borderRadius: design.corner,
        border: design.border ? `${design.borderWidth}px solid ${design.borderColor}` : "none",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        fontFamily: fontCss(design.font),
        color: design.text,
      }}
    >
      <CardBackground design={design} />
      <div style={{ position: "absolute", inset: 0 }}>
        {side === "front"
          ? <CardFront person={person} design={design} company={company} codeSrc={codeSrc} />
          : <CardBack person={person} design={design} company={company} codeSrc={codeSrc} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ export util */

async function captureNode(node: HTMLElement, scale = 3): Promise<string> {
  const html2canvas = (await import("html2canvas")).default;
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
  const canvas = await html2canvas(node, { scale, backgroundColor: null, useCORS: true, logging: false });
  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function safeName(name: string, fallback: string) {
  const slug = name.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return slug || fallback;
}

/* -------------------------------------------------------- styled controls */

const COLOR_INPUT_CLASS = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

function Slider({ label, labelKm, value, min, max, step = 1, suffix = "", onChange }: {
  label: string; labelKm: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void;
}) {
  const { text: t } = useLanguage();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--ink-dim)]">
        <span>{t(label, labelKm)}</span><span className="font-mono-ui text-[var(--ink-faint)]">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--gold)]" />
    </div>
  );
}

function ColorField({ label, labelKm, value, onChange }: { label: string; labelKm: string; value: string; onChange: (v: string) => void }) {
  const { text: t } = useLanguage();
  return (
    <Field label={t(label, labelKm)}>
      <input type="color" aria-label={t(label, labelKm)} value={value} onChange={(e) => onChange(e.target.value)} className={COLOR_INPUT_CLASS} />
    </Field>
  );
}

function Toggle({ label, labelKm, checked, onChange }: { label: string; labelKm: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { text: t } = useLanguage();
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
      <span className="text-sm text-[var(--ink)]">{t(label, labelKm)}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
    </label>
  );
}

/* ------------------------------------------------------------------ shell */

const TABS: { id: TabId; en: string; km: string; icon: typeof Users }[] = [
  { id: "people", en: "People", km: "មនុស្ស", icon: Users },
  { id: "design", en: "Design", km: "រចនា", icon: Palette },
  { id: "type", en: "Type", km: "អក្សរ", icon: TypeIcon },
  { id: "company", en: "Company", km: "ក្រុមហ៊ុន", icon: Building2 },
  { id: "code", en: "ID & Code", km: "កូដ", icon: QrCode },
  { id: "export", en: "Export", km: "នាំចេញ", icon: Download },
];

export default function IdCardStudio() {
  const { text: t } = useLanguage();

  const [roster, setRoster] = useState<Person[]>(INITIAL_ROSTER);
  const [activeId, setActiveId] = useState<string>(INITIAL_ROSTER[0].id);
  const [company, setCompany] = useToolState<Company>("id-card-studio:company", INITIAL_COMPANY);
  const [design, setDesign] = useToolState<Design>("id-card-studio:design", INITIAL_DESIGN);
  const [codeType, setCodeType] = useToolState<CodeType>("id-card-studio:codeType", "qr");

  const [tab, setTab] = useState<TabId>("people");
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const frontRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const backRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const active = roster.find((p) => p.id === activeId) ?? roster[0];

  const patchDesign = useCallback((patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch })), [setDesign]);
  const patchCompany = useCallback((patch: Partial<Company>) => setCompany((c) => ({ ...c, ...patch })), [setCompany]);
  const patchActive = useCallback((patch: Partial<Person>) => {
    setRoster((r) => r.map((p) => (p.id === activeId ? { ...p, ...patch } : p)));
  }, [activeId]);
  const patchActiveImg = useCallback((patch: Partial<ImgAdjust>) => {
    setRoster((r) => r.map((p) => (p.id === activeId ? { ...p, img: { ...p.img, ...patch } } : p)));
  }, [activeId]);

  // Rebuild every card's code image whenever the roster text or code type changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const p of roster) {
        const txt = p.codeText.trim();
        if (!txt || codeType === "none") { map[p.id] = ""; continue; }
        map[p.id] = codeType === "qr" ? qrDataUrl(txt) : await barcodeDataUrl(txt);
      }
      if (!cancelled) setCodeMap(map);
    })();
    return () => { cancelled = true; };
  }, [roster, codeType]);

  /* ---- roster ops ---- */
  const addPerson = () => {
    const p = samplePerson("New Person", "Title", `ID-${(roster.length + 1).toString().padStart(3, "0")}`, `ID-${roster.length + 1}`);
    setRoster((r) => [...r, p]);
    setActiveId(p.id);
    setTab("people");
  };
  const duplicatePerson = () => {
    if (!active) return;
    const p: Person = { ...active, id: newId(), name: `${active.name} (copy)` };
    setRoster((r) => [...r, p]);
    setActiveId(p.id);
  };
  const deletePerson = () => {
    if (roster.length <= 1) { setStatus(t("Keep at least one person.", "រក្សាទុកយ៉ាងតិចម្នាក់។")); return; }
    setRoster((r) => {
      const next = r.filter((p) => p.id !== activeId);
      setActiveId(next[0].id);
      return next;
    });
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchActive({ photo: String(reader.result) });
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchCompany({ logo: String(reader.result) });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      if (rows.length < 2) { setStatus(t("CSV needs a header row and at least one data row.", "CSV ត្រូវការជួរក្បាល និងទិន្នន័យយ៉ាងតិចមួយជួរ។")); return; }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      const people: Person[] = rows.slice(1).map((cells) => {
        const get = (key: string, alt?: string) => {
          const i = idx(key);
          const j = alt ? idx(alt) : -1;
          const k = i >= 0 ? i : j;
          return k >= 0 ? (cells[k] ?? "").trim() : "";
        };
        const name = get("name") || "—";
        return {
          id: newId(), name,
          jobTitle: get("jobtitle", "title"),
          idLabel: get("idlabel") || "ID",
          idValue: get("idvalue", "id"),
          dateLabel: get("datelabel") || "Valid",
          dateValue: get("datevalue", "date"),
          codeText: get("qrtext", "codetext") || get("idvalue", "id"),
          backNote: get("backnote"),
          photo: null, img: { ...DEFAULT_IMG },
        };
      });
      if (people.length) {
        setRoster(people);
        setActiveId(people[0].id);
        setStatus(t(`Imported ${people.length} people.`, `នាំចូល ${people.length} នាក់។`));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ---- exports ---- */
  const waitForRefs = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

  const exportActivePng = async () => {
    const node = (previewSide === "front" ? frontRefs : backRefs).current.get(activeId);
    if (!node) return;
    setBusy("png");
    try {
      const url = await captureNode(node);
      downloadDataUrl(url, `id-${safeName(active.name, "card")}-${previewSide}.png`);
      recordExport();
    } finally { setBusy(null); }
  };

  const exportAllZip = async () => {
    setBusy("zip");
    setStatus(t("Rendering cards…", "កំពុងបង្កើតកាត…"));
    try {
      await waitForRefs();
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const p of roster) {
        const fn = frontRefs.current.get(p.id);
        if (fn) zip.file(`${safeName(p.name, p.id)}-front.png`, (await captureNode(fn)).split(",")[1], { base64: true });
        if (design.showBack) {
          const bn = backRefs.current.get(p.id);
          if (bn) zip.file(`${safeName(p.name, p.id)}-back.png`, (await captureNode(bn)).split(",")[1], { base64: true });
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      downloadDataUrl(url, "id-cards.zip");
      URL.revokeObjectURL(url);
      recordExport();
      setStatus(t(`Exported ${roster.length} cards.`, `នាំចេញ ${roster.length} កាត។`));
    } finally { setBusy(null); }
  };

  const exportA4Pdf = async () => {
    setBusy("pdf");
    setStatus(t("Building A4 sheet…", "កំពុងបង្កើតសន្លឹក A4…"));
    try {
      await waitForRefs();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = 210, pageH = 297, margin = 10, gap = 4;
      // CR80 physical size in mm.
      const cw = design.orientation === "portrait" ? 53.98 : 85.6;
      const ch = design.orientation === "portrait" ? 85.6 : 53.98;
      const cols = Math.max(1, Math.floor((pageW - margin * 2 + gap) / (cw + gap)));
      const rowsPerPage = Math.max(1, Math.floor((pageH - margin * 2 + gap) / (ch + gap)));
      const perPage = cols * rowsPerPage;

      const faces: { node: HTMLDivElement; label: string }[] = [];
      for (const p of roster) {
        const fn = frontRefs.current.get(p.id);
        if (fn) faces.push({ node: fn, label: "front" });
      }
      if (design.showBack) {
        for (const p of roster) {
          const bn = backRefs.current.get(p.id);
          if (bn) faces.push({ node: bn, label: "back" });
        }
      }

      for (let i = 0; i < faces.length; i++) {
        if (i > 0 && i % perPage === 0) pdf.addPage();
        const slot = i % perPage;
        const col = slot % cols;
        const rowN = Math.floor(slot / cols);
        const x = margin + col * (cw + gap);
        const y = margin + rowN * (ch + gap);
        const img = await captureNode(faces[i].node, 3);
        pdf.addImage(img, "PNG", x, y, cw, ch);
        // faint cut guides
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.1);
        pdf.rect(x, y, cw, ch);
      }
      pdf.save("id-cards-a4.pdf");
      recordExport();
      setStatus(t(`A4 sheet ready — ${faces.length} cards.`, `សន្លឹក A4 រួចរាល់ — ${faces.length} កាត។`));
    } finally { setBusy(null); }
  };

  return (
    <ToolShell
      title="ID Card Studio"
      khmerTitle="ស្ទូឌីយោធ្វើប័ណ្ណសម្គាល់ខ្លួន"
      description="Design staff ID badges and event cards in batches — photos, layouts, QR/barcodes, front & back — then export PNG, a print-ready A4 PDF, or a ZIP of every card. Everything runs locally in your browser."
      descriptionKm="រចនាប័ណ្ណសម្គាល់បុគ្គលិក និងកាតព្រឹត្តិការណ៍ជាបាច់ — រូបថត ប្លង់ QR/បាកូដ ផ្នែកមុខ និងក្រោយ — រួចនាំចេញជា PNG សន្លឹក A4 សម្រាប់បោះពុម្ព ឬ ZIP នៃកាតទាំងអស់។ ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------------- controls ---------------- */}
        <div className="min-w-0">
          {/* tab bar */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {TABS.map((tb) => {
              const Icon = tb.icon;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className="chip"
                  data-active={tab === tb.id}
                >
                  <Icon size={13} /> {t(tb.en, tb.km)}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            {/* PEOPLE */}
            {tab === "people" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {roster.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className="chip"
                      data-active={p.id === activeId}
                      title={p.name}
                    >
                      <span className="max-w-[90px] truncate">{p.name || "—"}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={addPerson}><span className="inline-flex items-center gap-1.5"><UserPlus size={14} />{t("Add", "បន្ថែម")}</span></Button>
                  <button onClick={duplicatePerson} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)]">
                    <span className="inline-flex items-center gap-1.5"><CopyPlus size={14} />{t("Duplicate", "ចម្លង")}</span>
                  </button>
                  <button onClick={deletePerson} className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)] transition hover:bg-[var(--danger)]/20">
                    <span className="inline-flex items-center gap-1.5"><Trash2 size={14} />{t("Delete", "លុប")}</span>
                  </button>
                </div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2.5 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
                  <FileSpreadsheet size={15} className="text-[var(--gold)]" />
                  {t("Import people from CSV", "នាំចូលមនុស្សពី CSV")}
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={onCsv} />
                </label>
                <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
                  {t("Header columns: name, jobTitle, idLabel, idValue, dateLabel, dateValue, qrText.",
                    "ជួរក្បាល៖ name, jobTitle, idLabel, idValue, dateLabel, dateValue, qrText។")}
                </p>

                <div className="border-t border-[var(--ground-line)] pt-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t("Full name", "ឈ្មោះពេញ")}><TextInput value={active.name} onChange={(e) => patchActive({ name: e.target.value })} /></Field>
                    <Field label={t("Job title", "តួនាទី")}><TextInput value={active.jobTitle} onChange={(e) => patchActive({ jobTitle: e.target.value })} /></Field>
                  </div>
                </div>

                <div className="border-t border-[var(--ground-line)] pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
                      <ImagePlus size={15} className="text-[var(--gold)]" />{t("Choose photo", "ជ្រើសរូបថត")}
                      <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                    </label>
                    <button onClick={() => patchActive({ photo: null })} title={t("Remove photo", "លុបរូបថត")} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-[var(--ink-dim)] hover:text-[var(--ink)]">
                      <RotateCcw size={15} />
                    </button>
                  </div>
                  {active.photo && (
                    <div className="space-y-3">
                      <Slider label="Zoom" labelKm="ពង្រីក" value={active.img.scale} min={0.5} max={3} step={0.05} suffix="x" onChange={(v) => patchActiveImg({ scale: v })} />
                      <div className="grid grid-cols-2 gap-3">
                        <Slider label="Pan X" labelKm="ផ្លាស់ X" value={active.img.panX} min={-60} max={60} suffix="%" onChange={(v) => patchActiveImg({ panX: v })} />
                        <Slider label="Pan Y" labelKm="ផ្លាស់ Y" value={active.img.panY} min={-60} max={60} suffix="%" onChange={(v) => patchActiveImg({ panY: v })} />
                      </div>
                      <Slider label="Brightness" labelKm="ពន្លឺ" value={active.img.brightness} min={40} max={160} suffix="%" onChange={(v) => patchActiveImg({ brightness: v })} />
                      <Slider label="Contrast" labelKm="កម្រិតពណ៌" value={active.img.contrast} min={40} max={160} suffix="%" onChange={(v) => patchActiveImg({ contrast: v })} />
                      <Slider label="Saturation" labelKm="តិត្ថិភាព" value={active.img.saturate} min={0} max={200} suffix="%" onChange={(v) => patchActiveImg({ saturate: v })} />
                      <Toggle label="Grayscale" labelKm="ស ខ្មៅ" checked={active.img.grayscale} onChange={(v) => patchActiveImg({ grayscale: v })} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DESIGN */}
            {tab === "design" && (
              <div className="space-y-4">
                <Field label={t("Card layout", "ប្លង់កាត")}>
                  <Select value={design.layout} onChange={(e) => patchDesign({ layout: e.target.value as LayoutId })}>
                    <option value="standard">{t("Standard — centered", "ស្តង់ដារ — កណ្តាល")}</option>
                    <option value="photo-left">{t("Photo left", "រូបខាងឆ្វេង")}</option>
                    <option value="photo-right">{t("Photo right", "រូបខាងស្តាំ")}</option>
                    <option value="banner">{t("Banner top", "បដាខាងលើ")}</option>
                    <option value="stripe">{t("Side stripe", "ឆ្នូតចំហៀង")}</option>
                    <option value="minimal">{t("Minimal", "សាមញ្ញ")}</option>
                  </Select>
                </Field>

                <Field label={t("Background", "ផ្ទៃខាងក្រោយ")}>
                  <Select value={design.bg} onChange={(e) => patchDesign({ bg: e.target.value })}>
                    {["Solid", "Gradient", "Bold", "Custom"].map((g) => (
                      <optgroup key={g} label={g}>
                        {BG_PRESETS.filter((p) => p.group === g).map((p) => (
                          <option key={p.id} value={p.id}>{t(p.en, p.km)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                </Field>
                {design.bg === "solid-custom" && (
                  <ColorField label="Solid color" labelKm="ពណ៌" value={design.customSolid} onChange={(v) => patchDesign({ customSolid: v })} />
                )}
                {design.bg === "gradient-custom" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <ColorField label="Color 1" labelKm="ពណ៌ ១" value={design.gradA} onChange={(v) => patchDesign({ gradA: v })} />
                      <ColorField label="Color 2" labelKm="ពណ៌ ២" value={design.gradB} onChange={(v) => patchDesign({ gradB: v })} />
                    </div>
                    <Slider label="Angle" labelKm="មុំ" value={design.gradAngle} min={0} max={360} suffix="°" onChange={(v) => patchDesign({ gradAngle: v })} />
                  </div>
                )}

                <div className="border-t border-[var(--ground-line)] pt-4 space-y-3">
                  <Field label={t("Pattern overlay", "លំនាំគ្របលើ")}>
                    <Select value={design.pattern} onChange={(e) => patchDesign({ pattern: e.target.value })}>
                      {PATTERNS.map((p) => <option key={p.id} value={p.id}>{t(p.en, p.km)}</option>)}
                    </Select>
                  </Field>
                  {design.pattern !== "none" && (
                    <>
                      <ColorField label="Pattern color" labelKm="ពណ៌លំនាំ" value={design.patternColor} onChange={(v) => patchDesign({ patternColor: v })} />
                      <Slider label="Pattern opacity" labelKm="ភាពថ្លា" value={design.patternOpacity} min={0} max={100} suffix="%" onChange={(v) => patchDesign({ patternOpacity: v })} />
                    </>
                  )}
                  <Slider label="Dark wash" labelKm="ស្រទាប់ខ្មៅ" value={design.overlayDark} min={0} max={60} suffix="%" onChange={(v) => patchDesign({ overlayDark: v })} />
                </div>

                <div className="border-t border-[var(--ground-line)] pt-4 grid grid-cols-2 gap-3">
                  <ColorField label="Primary / accent" labelKm="ពណ៌សំខាន់" value={design.primary} onChange={(v) => patchDesign({ primary: v })} />
                  <ColorField label="Text color" labelKm="ពណ៌អក្សរ" value={design.text} onChange={(v) => patchDesign({ text: v })} />
                </div>

                <div className="border-t border-[var(--ground-line)] pt-4 space-y-3">
                  <Slider label="Corner radius" labelKm="កាំជ្រុង" value={design.corner} min={0} max={40} suffix="px" onChange={(v) => patchDesign({ corner: v })} />
                  <Toggle label="Card border" labelKm="ស៊ុមកាត" checked={design.border} onChange={(v) => patchDesign({ border: v })} />
                  {design.border && (
                    <div className="grid grid-cols-2 gap-3">
                      <ColorField label="Border color" labelKm="ពណ៌ស៊ុម" value={design.borderColor} onChange={(v) => patchDesign({ borderColor: v })} />
                      <Slider label="Border width" labelKm="កម្រាស់ស៊ុម" value={design.borderWidth} min={1} max={10} suffix="px" onChange={(v) => patchDesign({ borderWidth: v })} />
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--ground-line)] pt-4 space-y-3">
                  <Field label={t("Photo shape", "រាងរូបថត")}>
                    <Select value={design.photoShape} onChange={(e) => patchDesign({ photoShape: e.target.value as PhotoShape })}>
                      <option value="circle">{t("Circle", "រង្វង់")}</option>
                      <option value="rounded">{t("Rounded", "ជ្រុងមូល")}</option>
                      <option value="square">{t("Square", "ការេ")}</option>
                      <option value="hexagon">{t("Hexagon", "ប្រាំមួយជ្រុង")}</option>
                    </Select>
                  </Field>
                  {design.photoShape !== "hexagon" && (
                    <div className="grid grid-cols-2 gap-3">
                      <ColorField label="Photo border" labelKm="ស៊ុមរូបថត" value={design.photoBorderColor} onChange={(v) => patchDesign({ photoBorderColor: v })} />
                      <Slider label="Photo border width" labelKm="កម្រាស់ស៊ុមរូប" value={design.photoBorderWidth} min={0} max={10} suffix="px" onChange={(v) => patchDesign({ photoBorderWidth: v })} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TYPE */}
            {tab === "type" && (
              <div className="space-y-4">
                <Field label={t("Font family", "ក្រុមអក្សរ")} hint={t("Khmer fonts render Khmer text correctly.", "ពុម្ពខ្មែរបង្ហាញអក្សរខ្មែរបានត្រឹមត្រូវ។")}>
                  <Select value={design.font} onChange={(e) => patchDesign({ font: e.target.value as FontId })}>
                    {FONTS.map((f) => <option key={f.id} value={f.id}>{t(f.en, f.km)}</option>)}
                  </Select>
                </Field>
                <div className="border-t border-[var(--ground-line)] pt-4 space-y-3">
                  <Slider label="Company short name" labelKm="ឈ្មោះខ្លីក្រុមហ៊ុន" value={design.sizeCompanyShort} min={10} max={30} suffix="px" onChange={(v) => patchDesign({ sizeCompanyShort: v })} />
                  <Slider label="Company full name" labelKm="ឈ្មោះពេញក្រុមហ៊ុន" value={design.sizeCompanyFull} min={8} max={22} suffix="px" onChange={(v) => patchDesign({ sizeCompanyFull: v })} />
                  <Slider label="Person name" labelKm="ឈ្មោះបុគ្គល" value={design.sizeName} min={14} max={40} suffix="px" onChange={(v) => patchDesign({ sizeName: v })} />
                  <Slider label="Job title" labelKm="តួនាទី" value={design.sizeTitle} min={8} max={26} suffix="px" onChange={(v) => patchDesign({ sizeTitle: v })} />
                  <Slider label="Footer text" labelKm="អក្សរផ្នែកខាងក្រោម" value={design.sizeFooter} min={7} max={18} suffix="px" onChange={(v) => patchDesign({ sizeFooter: v })} />
                </div>
              </div>
            )}

            {/* COMPANY */}
            {tab === "company" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t("Short name", "ឈ្មោះខ្លី")}><TextInput value={company.short} onChange={(e) => patchCompany({ short: e.target.value })} /></Field>
                  <Field label={t("Full name", "ឈ្មោះពេញ")}><TextInput value={company.full} onChange={(e) => patchCompany({ full: e.target.value })} /></Field>
                </div>
                <Field label={t("Tagline / address", "ពាក្យស្លោក / អាសយដ្ឋាន")}><TextInput value={company.tagline} onChange={(e) => patchCompany({ tagline: e.target.value })} /></Field>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
                  <ImagePlus size={15} className="text-[var(--gold)]" />{company.logo ? t("Replace logo", "ប្តូរនិមិត្តសញ្ញា") : t("Upload logo", "បញ្ចូលនិមិត្តសញ្ញា")}
                  <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
                </label>
                {company.logo && (
                  <button onClick={() => patchCompany({ logo: null })} className="text-xs text-[var(--danger)] hover:underline">{t("Remove logo", "លុបនិមិត្តសញ្ញា")}</button>
                )}
              </div>
            )}

            {/* CODE */}
            {tab === "code" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t("ID label", "ស្លាកអត្តលេខ")}><TextInput value={active.idLabel} onChange={(e) => patchActive({ idLabel: e.target.value })} /></Field>
                  <Field label={t("ID value", "តម្លៃអត្តលេខ")}><TextInput value={active.idValue} onChange={(e) => patchActive({ idValue: e.target.value })} /></Field>
                  <Field label={t("Date label", "ស្លាកកាលបរិច្ឆេទ")}><TextInput value={active.dateLabel} onChange={(e) => patchActive({ dateLabel: e.target.value })} /></Field>
                  <Field label={t("Date value", "តម្លៃកាលបរិច្ឆេទ")}><TextInput value={active.dateValue} onChange={(e) => patchActive({ dateValue: e.target.value })} /></Field>
                </div>
                <div className="border-t border-[var(--ground-line)] pt-4 space-y-3">
                  <Field label={t("Code type", "ប្រភេទកូដ")}>
                    <Select value={codeType} onChange={(e) => setCodeType(e.target.value as CodeType)}>
                      <option value="none">{t("None", "គ្មាន")}</option>
                      <option value="qr">{t("QR code", "កូដ QR")}</option>
                      <option value="barcode">{t("Barcode (CODE128)", "បាកូដ (CODE128)")}</option>
                    </Select>
                  </Field>
                  {codeType !== "none" && (
                    <Field label={t("Code content", "មាតិកាកូដ")} hint={t("Falls back to the ID value.", "ប្រើតម្លៃអត្តលេខ បើទទេ។")}>
                      <TextInput value={active.codeText} onChange={(e) => patchActive({ codeText: e.target.value })} placeholder={active.idValue} />
                    </Field>
                  )}
                </div>
                <div className="border-t border-[var(--ground-line)] pt-4 space-y-3">
                  <Toggle label="Add a back side" labelKm="បន្ថែមផ្នែកខាងក្រោយ" checked={design.showBack} onChange={(v) => { patchDesign({ showBack: v }); if (!v) setPreviewSide("front"); }} />
                  {design.showBack && (
                    <>
                      <Field label={t("Back note (this person)", "កំណត់ចំណាំក្រោយ (បុគ្គលនេះ)")}><TextInput value={active.backNote} onChange={(e) => patchActive({ backNote: e.target.value })} /></Field>
                      <Field label={t("Shared terms (all cards)", "លក្ខខណ្ឌរួម (កាតទាំងអស់)")}><TextInput value={company.backText} onChange={(e) => patchCompany({ backText: e.target.value })} /></Field>
                      <Field label={t("Return line", "បន្ទាត់ត្រឡប់")}><TextInput value={company.returnLine} onChange={(e) => patchCompany({ returnLine: e.target.value })} /></Field>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* EXPORT */}
            {tab === "export" && (
              <div className="space-y-4">
                <Field label={t("Orientation", "ទិសដៅ")}>
                  <Select value={design.orientation} onChange={(e) => patchDesign({ orientation: e.target.value as Orientation })}>
                    <option value="portrait">{t("Portrait (badge)", "បញ្ឈរ (ប័ណ្ណ)")}</option>
                    <option value="landscape">{t("Landscape", "ផ្តេក")}</option>
                  </Select>
                </Field>
                <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
                  {t("Cards are CR80 size (85.6 × 54 mm). The A4 sheet tiles every card with light cut guides for printing.",
                    "កាតមានទំហំ CR80 (85.6 × 54 mm)។ សន្លឹក A4 រៀបកាតទាំងអស់ ជាមួយបន្ទាត់កាត់ស្រាលសម្រាប់បោះពុម្ព។")}
                </p>
                <div className="space-y-2">
                  <Button className="w-full" disabled={busy !== null} onClick={exportActivePng}>
                    <span className="inline-flex items-center justify-center gap-2"><Download size={15} />{busy === "png" ? t("Rendering…", "កំពុងបង្កើត…") : t("Export active card (PNG)", "នាំចេញកាតបច្ចុប្បន្ន (PNG)")}</span>
                  </Button>
                  <button disabled={busy !== null} onClick={exportAllZip} className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40">
                    <FolderDown size={15} />{busy === "zip" ? t("Zipping…", "កំពុងបង្ហាប់…") : t("Export all cards (ZIP)", "នាំចេញកាតទាំងអស់ (ZIP)")}
                  </button>
                  <button disabled={busy !== null} onClick={exportA4Pdf} className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40">
                    <Printer size={15} />{busy === "pdf" ? t("Building…", "កំពុងបង្កើត…") : t("Print-ready A4 PDF", "PDF A4 ត្រៀមបោះពុម្ព")}
                  </button>
                </div>
                {status && <p className="text-xs text-[var(--ink-dim)]">{status}</p>}
              </div>
            )}
          </div>

          {/* provenance / credits */}
          <details className="mt-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm">
            <summary className="cursor-pointer font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</summary>
            <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-[var(--ink-dim)]">
              <p>{t("Adapted from an in-house HTML prototype and rebuilt on this app's shared components.", "កែសម្រួលពីគំរូ HTML ផ្ទៃក្នុង ហើយបង្កើតឡើងវិញលើសមាសភាគរួមរបស់កម្មវិធីនេះ។")}</p>
              <p>{t("QR generation: qrcode-generator (MIT). Barcodes: JsBarcode (MIT).", "ការបង្កើត QR: qrcode-generator (MIT)។ បាកូដ: JsBarcode (MIT)។")}</p>
              <p>{t("Image capture: html2canvas (MIT). PDF: jsPDF (MIT). Archive: JSZip (MIT/GPL).", "ការថតរូបភាព: html2canvas (MIT)។ PDF: jsPDF (MIT)។ ការបង្ហាប់: JSZip (MIT/GPL)។")}</p>
            </div>
          </details>
        </div>

        {/* ---------------- preview ---------------- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t("Live preview", "មើលផ្ទាល់")}</span>
            {design.showBack && (
              <div className="flex gap-1">
                <button onClick={() => setPreviewSide("front")} className="chip" data-active={previewSide === "front"}>{t("Front", "មុខ")}</button>
                <button onClick={() => setPreviewSide("back")} className="chip" data-active={previewSide === "back"}>{t("Back", "ក្រោយ")}</button>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-center rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-5" style={{ backgroundImage: "radial-gradient(var(--ground-line) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
            <div style={{ transform: design.orientation === "landscape" ? "scale(0.92)" : "none" }}>
              {active && (
                <IdCardFace
                  person={active}
                  design={design}
                  company={company}
                  codeSrc={codeMap[active.id] ?? ""}
                  side={design.showBack ? previewSide : "front"}
                />
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--ink-faint)]">
            {roster.length} {t(roster.length === 1 ? "card" : "cards", "កាត")} · {t("editing", "កំពុងកែ")} <span className="text-[var(--ink-dim)]">{active?.name || "—"}</span>
          </p>
        </div>
      </div>

      {/* off-screen batch stack — one node per card face, captured on export */}
      <div aria-hidden style={{ position: "absolute", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }}>
        {roster.map((p) => (
          <div key={p.id}>
            <IdCardFace person={p} design={design} company={company} codeSrc={codeMap[p.id] ?? ""} side="front" cardRef={(el) => { if (el) frontRefs.current.set(p.id, el); else frontRefs.current.delete(p.id); }} />
            {design.showBack && (
              <IdCardFace person={p} design={design} company={company} codeSrc={codeMap[p.id] ?? ""} side="back" cardRef={(el) => { if (el) backRefs.current.set(p.id, el); else backRefs.current.delete(p.id); }} />
            )}
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

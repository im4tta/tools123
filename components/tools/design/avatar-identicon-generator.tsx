"use client";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

/** FNV-1a 32-bit hash (Fowler–Noll–Vo, public domain) — deterministic per string. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "";
  const second = words.length > 1 ? (Array.from(words[1])[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

/** 5×3 bit grid derived from the hash (mirrored horizontally → 5×5). */
function identiconCells(text: string): boolean[] {
  const h = fnv1a(text.trim());
  const cells: boolean[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      cells.push(((h >>> (y * 3 + x)) & 1) === 1);
    }
  }
  return cells;
}

/** Escapes a value for embedding in SVG markup (used for the copied/downloaded string only). */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

const SIZES = ["64", "128", "256", "512"];

export default function AvatarIdenticonGenerator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("avatar-identicon:mode", "initials");
  const [name, setName] = useToolState("avatar-identicon:name", "Tools123 User");
  const [seed, setSeed] = useToolState("avatar-identicon:seed", "tools123");
  const [bg, setBg] = useToolState("avatar-identicon:bg", "#f0ede4");
  const [fg, setFg] = useToolState("avatar-identicon:fg", "#a5792a");
  const [shape, setShape] = useToolState("avatar-identicon:shape", "round");
  const [sizeStr, setSizeStr] = useToolState("avatar-identicon:size", "256");

  const size = Math.max(16, Math.min(1024, Number(sizeStr) || 256));
  const isInitials = mode === "initials";
  const initials = isInitials ? initialsOf(name) : "";
  const cells = isInitials ? [] : identiconCells(seed);

  const rects = isInitials
    ? ""
    : cells
        .map((on, i) => {
          if (!on) return "";
          const y = Math.floor(i / 3);
          const x = i % 3;
          const cell = size / 5;
          return `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${esc(fg)}"/><rect x="${(4 - x) * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${esc(fg)}"/>`;
        })
        .join("");

  const svg = isInitials
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n  <rect width="100%" height="100%" fill="${esc(bg)}" rx="${shape === "round" ? size / 2 : 0}"/>\n  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${esc(fg)}" font-family="system-ui, sans-serif" font-size="${size * 0.38}" font-weight="600">${esc(initials)}</text>\n</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n  <rect width="100%" height="100%" fill="${esc(bg)}"/>\n${rects}</svg>`;

  async function downloadPng() {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg render failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = isInitials ? "avatar.png" : "identicon.png";
      a.click();
      recordExport();
    }
    URL.revokeObjectURL(url);
  }

  const colorInput = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

  return (
    <ToolShell
      title="Avatar & Identicon Generator"
      khmerTitle="បង្កើត Avatar / Identicon"
      description="Create an initials avatar or a classic deterministic identicon, then copy the SVG or download a PNG."
      descriptionKm="បង្កើត avatar អក្សរកាត់ ឬ identicon តាមលំនាំដើម រួចចម្លង SVG ឬទាញយក PNG។"
    >
      <Row>
        <Field label={t("Type", "ប្រភេទ")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="initials">{t("Initials avatar", "Avatar អក្សរកាត់")}</option>
            <option value="identicon">{t("Identicon (5×5)", "Identicon (5×5)")}</option>
          </Select>
        </Field>
        {isInitials ? (
          <Field label={t("Name", "ឈ្មោះ")}>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t("e.g. Sok Dara", "ឧ. សុខ ដារ៉ា")} />
          </Field>
        ) : (
          <Field label={t("Seed string", "ខ្សែអក្សរសម្រាប់បង្កើត")}>
            <TextInput value={seed} onChange={(e) => setSeed(e.target.value)} placeholder={t("Any text — same text, same identicon", "អត្ថបទណាមួយ — អត្ថបទដូចគ្នា ផ្ដល់ identicon ដូចគ្នា")} />
          </Field>
        )}
        <Field label={t("Shape", "រាង")}>
          <Select value={shape} onChange={(e) => setShape(e.target.value)}>
            <option value="round">{t("Round", "មូល")}</option>
            <option value="square">{t("Square", "ការ៉េ")}</option>
          </Select>
        </Field>
        <Field label={t("Size (px)", "ទំហំ (px)")}>
          <Select value={sizeStr} onChange={(e) => setSizeStr(e.target.value)}>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s}×{s}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Background color", "ពណ៌ផ្ទៃខាងក្រោយ")}>
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className={colorInput} />
        </Field>
        <Field label={t("Foreground color", "ពណ៌អក្សរ / ក្រឡា")}>
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className={colorInput} />
        </Field>
      </Row>

      <div className="flex flex-col items-center gap-4 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 sm:flex-row sm:justify-center sm:gap-8">
        <div className="flex h-56 w-56 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[repeating-conic-gradient(#3a3f45_0%_25%,#26292d_0%_50%)] bg-[length:16px_16px] p-4">
          {isInitials ? (
            <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[200px]" role="img" aria-label={t("Initials avatar preview", "មើលជាមុន avatar អក្សរកាត់")}>
              <rect width="100%" height="100%" fill={bg} rx={shape === "round" ? size / 2 : 0} />
              <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={fg} fontFamily="system-ui, sans-serif" fontSize={size * 0.38} fontWeight={600}>{initials}</text>
            </svg>
          ) : (
            <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[200px]" role="img" aria-label={t("Identicon preview", "មើលជាមុន identicon")}>
              <rect width="100%" height="100%" fill={bg} />
              {cells.map((on, i) => {
                if (!on) return null;
                const y = Math.floor(i / 3);
                const x = i % 3;
                const cell = size / 5;
                return (
                  <g key={i}>
                    <rect x={x * cell} y={y * cell} width={cell} height={cell} fill={fg} />
                    <rect x={(4 - x) * cell} y={y * cell} width={cell} height={cell} fill={fg} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:w-56">
          <Button onClick={downloadPng}>{t("Download PNG", "ទាញយក PNG")}</Button>
          {isInitials && (
            <p className="text-xs text-[var(--ink-dim)]">{t("Initials are derived from the first letters of the first two words.", "អក្សរកាត់បានមកពីអក្សរដំបូងនៃពាក្យពីរដំបូង។")}</p>
          )}
        </div>
      </div>

      <Output label={t("SVG", "កូដ SVG")} value={svg} />

      <aside className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t("The identicon concept (a deterministic visual glyph derived from a string) was invented by Don Park in January 2007 and popularized by GitHub-style avatar identicons. This implementation is an original Tools123 implementation: the 5×5 mirrored grid is seeded with the public-domain FNV-1a hash (Fowler–Noll–Vo).", "គំនិត identicon (និមិត្តសញ្ញាដែលបង្កើតដោយកំណត់ពីខ្សែអក្សរ) ត្រូវបានបង្កើតឡើងដោយ Don Park ក្នុងខែមករា ២០០៧ ហើយត្រូវបានផ្សព្វផ្សាយតាមរយៈ avatar identicon បែប GitHub។ ការអនុវត្តនេះជាការអនុវត្តដើមរបស់ Tools123៖ ក្រឡាចត្រង្គ 5×5 ដែលឆ្លុះកញ្ចក់ ត្រូវបានផ្ដើមដោយ hash FNV-1a ដែលជាសាធារណៈ (Fowler–Noll–Vo)។")}{" "}
          <a href="https://blog.codinghorror.com/identicons-for-net/" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">codinghorror.com — Identicons for .NET</a>
        </p>
      </aside>
    </ToolShell>
  );
}

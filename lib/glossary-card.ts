// Renders one glossary entry as a shareable PNG card with a QR code of its link.
//
// Drawn directly on a canvas (not a DOM screenshot) so Khmer shaping, fonts and wrapping are fully under our
// control: text is measured with the page's own fonts and wrapped at the browser's word boundaries
// (Intl.Segmenter), which also handles Khmer, whose words are not separated by spaces.
// qrcode-generator is loaded only when a card is made, so the glossary pages do not pay for it.

import { splitTermAcronym, splitTermExpansion } from "@/lib/glossary-share";

export interface CardBlock {
  text: string;
  lang: "en" | "km";
  /** Sense number shown in the left gutter (English blocks); omitted for the Khmer line under it. */
  n?: number;
  muted?: boolean;
  italic?: boolean;
}

export interface GlossaryCardInput {
  term: string;
  termKm: string;
  /** Category label, already localized. */
  tag?: string;
  blocks: CardBlock[];
  /** Tool name shown above the term. */
  title: string;
  /** Absolute link the QR code opens. */
  url: string;
  /** Short readable form of the link, e.g. "123tool.app/construction-water-glossary". */
  urlLabel: string;
  credit?: string;
  scanLabel: string;
  /** Shown when the definition had to be cut to fit. */
  moreLabel: string;
  /** CSS font-family strings taken from the page (so next/font's hashed family names are used). */
  fonts: { latin: string; khmer: string };
}

const W = 1080;
const PAD = 84;
const GUTTER = 58;
const MAX_TEXT_LINES = 30;
const C = { paper: "#f4eee0", ink: "#221c13", dim: "#564d3f", faint: "#675e4d", line: "#d9d0ba", accent: "#a4302a", white: "#ffffff" };

type Ctx = CanvasRenderingContext2D;

/** A bracket opens a unit that must stay with the word after it; closing marks and hyphens stay with the word before. */
const OPENING = /[(\[{“‘«]$/;
const CLOSING = /^[)\]}”’»"'.,;:!?%/\-–—។៕៖ៗ]+$/u;
const DASHES = /^[/–—-]$/;

/** Break units for line wrapping: words keep their trailing space, and punctuation never gets a line to itself. */
function breakUnits(text: string, locale: string): string[] {
  const out: string[] = [];
  for (const { segment } of new Intl.Segmenter(locale, { granularity: "word" }).segment(text)) {
    const prev = out[out.length - 1];
    if (prev === undefined) {
      out.push(segment);
    } else if (/^\s+$/.test(segment)) {
      out[out.length - 1] = prev + segment;
    } else if (CLOSING.test(segment) && !/\s$/.test(prev)) {
      out[out.length - 1] = prev + segment;
    } else if (DASHES.test(segment) && /\s$/.test(prev)) {
      out[out.length - 1] = `${prev.trimEnd()} ${segment}`; // "Assurance / Quality": the slash stays on the earlier line
    } else if (OPENING.test(prev) && !/\s$/.test(prev)) {
      out[out.length - 1] = prev + segment;
    } else {
      out.push(segment);
    }
  }
  return out;
}

function wrap(ctx: Ctx, text: string, maxWidth: number, locale: string): string[] {
  const lines: string[] = [];
  const graphemes = new Intl.Segmenter(locale, { granularity: "grapheme" });
  const width = (value: string) => ctx.measureText(value).width;
  for (const paragraph of text.split("\n")) {
    let line = "";
    const flush = () => {
      if (line.trim()) lines.push(line.trimEnd());
      line = "";
    };
    for (const unit of breakUnits(paragraph, locale)) {
      if (width(unit.trimEnd()) > maxWidth) {
        // an unbreakable run wider than the line: split it by letter clusters
        flush();
        for (const { segment: g } of graphemes.segment(unit.trimEnd())) {
          if (line && width(line + g) > maxWidth) flush();
          line += g;
        }
        continue;
      }
      if (line && width((line + unit).trimEnd()) > maxWidth) {
        flush();
        line = unit.trimStart();
      } else line += unit;
    }
    flush();
  }
  return lines.length ? lines : [""];
}

/** Same number of lines as `wrap`, but with the lines as even as possible (no lone last word). */
function balance(ctx: Ctx, text: string, maxWidth: number, locale: string): string[] {
  const greedy = wrap(ctx, text, maxWidth, locale);
  if (greedy.length < 2) return greedy;
  let lo = maxWidth * 0.5;
  let hi = maxWidth;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (wrap(ctx, text, mid, locale).length <= greedy.length) hi = mid;
    else lo = mid;
  }
  return wrap(ctx, text, hi, locale);
}

/**
 * Largest font size at which the text fits: first in at most two lines (down to `minTwo`), otherwise in
 * three (down to `minThree`).
 */
function fitSize(ctx: Ctx, text: string, family: string, weight: number, start: number, minTwo: number, minThree: number, maxWidth: number, locale: string, maxLinesFirst = 2): number {
  for (const [maxLines, min] of [[maxLinesFirst, minTwo], [3, minThree]] as const) {
    for (let size = start; size >= min; size -= 4) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (wrap(ctx, text, maxWidth, locale).length <= maxLines) return size;
    }
  }
  return minThree;
}

function lay(ctx: Ctx, input: GlossaryCardInput, qrModules: boolean[][], draw: boolean): number {
  const { latin, khmer } = input.fonts;
  const innerW = W - PAD * 2;
  let y = 0;

  if (draw) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, 4000);
    ctx.fillStyle = C.accent;
    ctx.fillRect(0, 0, W, 10);
  }
  y = 78;

  // masthead
  ctx.textBaseline = "alphabetic";
  ctx.font = `italic 400 28px ${latin}`;
  if (draw) {
    ctx.fillStyle = C.faint;
    ctx.fillText(input.title, PAD, y);
  }
  y += 70;

  // English headword. A trailing acronym "(BOQ)" becomes a badge instead of part of the heading text.
  const expansion = splitTermExpansion(input.term);
  const split = expansion ? null : splitTermAcronym(input.term);
  const main = expansion ? expansion.abbr : (split?.main ?? input.term);
  const badgeFont = `600 26px ${latin}`;
  let badgeW = 0;
  if (split) {
    ctx.font = badgeFont;
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "2px";
    badgeW = ctx.measureText(split.abbr).width + 40;
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
  }
  // prefer one line with the badge beside it (down to 64px); otherwise two balanced lines, three at most
  let termSize = 0;
  if (split) {
    for (let size = 88; size >= 64; size -= 4) {
      ctx.font = `500 ${size}px ${latin}`;
      if (wrap(ctx, main, innerW - badgeW - 28, "en").length === 1) {
        termSize = size;
        break;
      }
    }
  }
  if (!termSize) termSize = fitSize(ctx, main, latin, 500, 88, 56, 44, innerW, "en");
  ctx.font = `500 ${termSize}px ${latin}`;
  const termLines = balance(ctx, main, innerW, "en");
  let lastWidth = 0;
  for (const line of termLines) {
    y += termSize * 1.0;
    lastWidth = ctx.measureText(line).width;
    if (draw) {
      ctx.fillStyle = C.ink;
      ctx.fillText(line, PAD, y);
    }
    y += termSize * 0.12;
  }
  if (split) {
    const beside = lastWidth + 28 + badgeW <= innerW;
    const badgeH = 46;
    const bx = beside ? PAD + lastWidth + 28 : PAD;
    const by = beside ? y - termSize * 0.12 - badgeH + 4 : y + 14;
    if (!beside) y += badgeH + 22;
    if (draw) {
      ctx.fillStyle = "rgba(164, 48, 42, 0.08)";
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, badgeW, badgeH, badgeH / 2);
      else ctx.rect(bx, by, badgeW, badgeH);
      ctx.fill();
      ctx.stroke();
      ctx.font = badgeFont;
      if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "2px";
      ctx.fillStyle = C.accent;
      ctx.fillText(split.abbr, bx + 22, by + badgeH - 13);
      if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
    }
  }

  // "AADT (Annual Average Daily Traffic)": the acronym is the headline, the expansion a lighter subtitle
  if (expansion) {
    y += 8;
    ctx.font = `italic 400 38px ${latin}`;
    for (const line of balance(ctx, expansion.expansion, innerW, "en")) {
      y += 38 * 1.35;
      if (draw) {
        ctx.fillStyle = C.dim;
        ctx.fillText(line, PAD, y);
      }
    }
  }

  // Khmer term
  y += expansion ? 20 : 30;
  const kmSize = fitSize(ctx, input.termKm, khmer, 400, 60, 44, 34, innerW, "km");
  ctx.font = `400 ${kmSize}px ${khmer}`;
  for (const line of balance(ctx, input.termKm, innerW, "km")) {
    y += kmSize * 1.18;
    if (draw) {
      ctx.fillStyle = C.accent;
      ctx.fillText(line, PAD, y);
    }
    y += kmSize * 0.3;
  }

  // category
  if (input.tag) {
    y += 34;
    if (draw) {
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(PAD + 8, y - 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = `600 22px ${latin}`;
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "3px";
    if (draw) {
      ctx.fillStyle = C.faint;
      ctx.fillText(input.tag.toUpperCase(), PAD + 30, y);
    }
    if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
  }

  // divider
  y += 40;
  if (draw) {
    ctx.fillStyle = C.line;
    ctx.fillRect(PAD, y, innerW, 2);
  }
  y += 18;

  // definitions
  let linesUsed = 0;
  let cut = false;
  for (const block of input.blocks) {
    const km = block.lang === "km";
    const size = km ? 32 : 36;
    const family = km ? khmer : latin;
    const lineH = size * (km ? 1.85 : 1.45);
    ctx.font = `${block.italic ? "italic " : ""}400 ${size}px ${family}`;
    const lines = wrap(ctx, block.text, innerW - GUTTER, km ? "km" : "en");
    if (linesUsed + lines.length > MAX_TEXT_LINES) {
      cut = true;
      break;
    }
    y += 12;
    if (block.n !== undefined && draw) {
      ctx.font = `400 26px ${latin}`;
      ctx.fillStyle = C.faint;
      ctx.textAlign = "right";
      ctx.fillText(String(block.n), PAD + GUTTER - 18, y + size * 0.95);
      ctx.textAlign = "left";
      ctx.font = `${block.italic ? "italic " : ""}400 ${size}px ${family}`;
    }
    for (const line of lines) {
      y += lineH;
      if (draw) {
        ctx.fillStyle = block.muted || km ? C.dim : C.ink;
        ctx.fillText(line, PAD + GUTTER, y - (km ? size * 0.28 : size * 0.18));
      }
    }
    linesUsed += lines.length;
  }
  if (cut) {
    y += 40;
    ctx.font = `italic 400 26px ${latin}`;
    if (draw) {
      ctx.fillStyle = C.faint;
      ctx.fillText(`… ${input.moreLabel}`, PAD + GUTTER, y);
    }
  }

  // footer: link + credit on the left, QR on the right
  y += 56;
  if (draw) {
    ctx.fillStyle = C.line;
    ctx.fillRect(PAD, y, innerW, 2);
  }
  y += 40;
  const qrBox = 232;
  const qrTop = y;
  if (draw) {
    ctx.fillStyle = C.white;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - PAD - qrBox, qrTop, qrBox, qrBox, 16);
    else ctx.rect(W - PAD - qrBox, qrTop, qrBox, qrBox);
    ctx.fill();
    const n = qrModules.length;
    const ms = Math.max(3, Math.floor((qrBox - 32) / n));
    const size = ms * n;
    const ox = W - PAD - qrBox + (qrBox - size) / 2;
    const oy = qrTop + (qrBox - size) / 2;
    ctx.fillStyle = C.ink;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qrModules[r][c]) ctx.fillRect(ox + c * ms, oy + r * ms, ms, ms);
  }
  const leftW = innerW - qrBox - 40;
  let ly = qrTop + 34;
  ctx.font = `500 30px ${latin}`;
  for (const line of wrap(ctx, input.urlLabel, leftW, "en")) {
    if (draw) {
      ctx.fillStyle = C.ink;
      ctx.fillText(line, PAD, ly);
    }
    ly += 40;
  }
  ctx.font = `italic 400 24px ${latin}`;
  const scan = wrap(ctx, input.scanLabel, leftW, "en");
  ly += 6;
  for (const line of scan) {
    if (draw) {
      ctx.fillStyle = C.faint;
      ctx.fillText(line, PAD, ly);
    }
    ly += 32;
  }
  if (input.credit) {
    ctx.font = `400 22px ${latin}`;
    ly += 10;
    for (const line of wrap(ctx, input.credit, leftW, "en")) {
      if (draw) {
        ctx.fillStyle = C.faint;
        ctx.fillText(line, PAD, ly);
      }
      ly += 30;
    }
  }
  return Math.max(qrTop + qrBox, ly) + PAD - 10;
}

export async function renderGlossaryCard(input: GlossaryCardInput): Promise<Blob> {
  const { default: qrcode } = await import("qrcode-generator");
  const qr = qrcode(0, "M");
  qr.addData(input.url);
  qr.make();
  const count = qr.getModuleCount();
  const modules = Array.from({ length: count }, (_, r) => Array.from({ length: count }, (_, c) => qr.isDark(r, c)));

  // make sure the page's fonts (including the Khmer subset) are ready before text is measured
  if (document.fonts) {
    const wanted = [input.term, input.termKm, input.title, ...input.blocks.map((b) => b.text)].join(" ");
    await Promise.allSettled([
      document.fonts.load(`500 40px ${input.fonts.latin}`, wanted),
      document.fonts.load(`italic 400 28px ${input.fonts.latin}`, input.title),
      document.fonts.load(`400 40px ${input.fonts.khmer}`, wanted),
    ]);
    await document.fonts.ready;
  }

  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("Canvas is not available");
  const height = Math.ceil(lay(probe, input, modules, false));

  const scale = Math.min(2, Math.sqrt(12_000_000 / (W * height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.scale(scale, scale);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, height);
  lay(ctx, input, modules, true);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"));
}

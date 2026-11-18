// Renders one glossary entry as a shareable PNG card with a QR code of its link.
//
// Drawn directly on a canvas (not a DOM screenshot) so Khmer shaping, fonts and wrapping are fully under our
// control: text is measured with the page's own fonts and wrapped at the browser's word boundaries
// (Intl.Segmenter), which also handles Khmer, whose words are not separated by spaces.
// qrcode-generator is loaded only when a card is made, so the glossary pages do not pay for it.

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

function wrap(ctx: Ctx, text: string, maxWidth: number, locale: string): string[] {
  const lines: string[] = [];
  const graphemes = new Intl.Segmenter(locale, { granularity: "grapheme" });
  const words = new Intl.Segmenter(locale, { granularity: "word" });
  for (const paragraph of text.split("\n")) {
    let line = "";
    const push = () => {
      if (line.trim()) lines.push(line.trimEnd());
      line = "";
    };
    for (const { segment } of words.segment(paragraph)) {
      if (ctx.measureText(segment).width > maxWidth) {
        // an unbreakable run wider than the line: split it by letter clusters
        push();
        for (const { segment: g } of graphemes.segment(segment)) {
          if (line && ctx.measureText(line + g).width > maxWidth) push();
          line += g;
        }
        continue;
      }
      if (line && ctx.measureText(line + segment).width > maxWidth) {
        push();
        line = segment.trimStart();
      } else line += segment;
    }
    push();
  }
  return lines.length ? lines : [""];
}

/** Largest font size (from `start` down to `min`) at which the text fits in `maxLines` lines. */
function fit(ctx: Ctx, text: string, family: string, weight: number, start: number, min: number, maxWidth: number, maxLines: number, locale: string): number {
  for (let size = start; size > min; size -= 4) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (wrap(ctx, text, maxWidth, locale).length <= maxLines) return size;
  }
  return min;
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

  // English term
  const termSize = fit(ctx, input.term, latin, 500, 88, 48, innerW, 3, "en");
  ctx.font = `500 ${termSize}px ${latin}`;
  for (const line of wrap(ctx, input.term, innerW, "en")) {
    y += termSize * 0.95;
    if (draw) {
      ctx.fillStyle = C.ink;
      ctx.fillText(line, PAD, y);
    }
    y += termSize * 0.2;
  }

  // Khmer term
  y += 14;
  const kmSize = fit(ctx, input.termKm, khmer, 400, 60, 36, innerW, 3, "km");
  ctx.font = `400 ${kmSize}px ${khmer}`;
  for (const line of wrap(ctx, input.termKm, innerW, "km")) {
    y += kmSize * 1.18;
    if (draw) {
      ctx.fillStyle = C.accent;
      ctx.fillText(line, PAD, y);
    }
    y += kmSize * 0.32;
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

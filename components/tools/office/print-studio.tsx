"use client";

// Print Studio — lay out images AND characters (the full Khmer script, Latin,
// symbols, and emoji from lib/glyphs) onto A4 sheets, packed or one-per-page,
// then export a print-ready PDF or a ZIP of PNGs. Typed/picked characters are
// rendered to tiles with a chosen fill/outline. Everything runs locally.

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, ArrowUp, ArrowDown, Download, FolderDown, Plus } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";
import { GLYPH_CATEGORIES, GLYPH_GROUPS, type GlyphGroup } from "@/lib/glyphs";

type Mode = "grid" | "single";
type FontKey = "sans" | "display" | "serif" | "mono";

interface Item {
  id: string; name: string; img: HTMLImageElement;
  w: number; h: number; trimX: number; trimY: number; trimW: number; trimH: number; dataURL: string;
}
interface CharStyle { font: FontKey; bold: boolean; fill: string; outline: boolean; outlineColor: string; outlineWidth: number }
interface Settings { mode: Mode; targetMm: number; spacingMm: number; marginMm: number; orientation: "auto" | "portrait" | "landscape"; dpi: number; trim: boolean; stretch: boolean }

const PREVIEW_DPI = 110;

const FONT_STACKS: Record<FontKey, string> = {
  sans: `'Kantumruy Pro Variable','Noto Sans Khmer',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`,
  display: `'Kantumruy Pro Variable','Arial Black',Impact,system-ui,sans-serif`,
  serif: `Georgia,'Noto Serif Khmer','Times New Roman',serif`,
  mono: `ui-monospace,'Courier New',monospace`,
};

const GROUP_KM: Record<GlyphGroup, string> = { Khmer: "ខ្មែរ", Latin: "ឡាតាំង", Symbols: "និមិត្តសញ្ញា", Emoji: "អុីម៉ូជី" };

let uid = 0;
const nextId = () => `it_${uid++}`;
const mm2px = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi);

function splitGraphemes(str: string): string[] {
  const Seg = (Intl as unknown as {
    Segmenter?: new (locale?: string, opts?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> };
  }).Segmenter;
  try {
    if (typeof Seg === "function") {
      return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(str), (s) => s.segment);
    }
  } catch { /* fall through */ }
  return Array.from(str);
}
function isEmojiLike(ch: string): boolean {
  try { return /\p{Extended_Pictographic}/u.test(ch); } catch { return false; }
}

function trimBounds(img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const full = { x: 0, y: 0, w, h };
  try {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return full;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      const rs = y * w * 4;
      for (let x = 0; x < w; x++) {
        const i = rs + x * 4;
        if (data[i + 3] < 12) continue;
        if (data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248) continue;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) return full;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  } catch { return full; }
}

function renderCharTile(ch: string, s: CharStyle): HTMLCanvasElement {
  const size = 640;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = Math.round(size * 0.62);
  const emoji = isEmojiLike(ch);
  const weight = !emoji && s.bold ? "800" : "400";
  ctx.font = `${weight} ${fontSize}px ${FONT_STACKS[s.font]}`;
  const cx = size / 2, cy = size / 2 + fontSize * 0.04;
  if (!emoji && s.outline && s.outlineWidth > 0) {
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = s.outlineColor;
    ctx.lineWidth = s.outlineWidth;
    ctx.strokeText(ch, cx, cy);
  }
  ctx.fillStyle = emoji ? "#000" : s.fill;
  ctx.fillText(ch, cx, cy);
  return c;
}

let fontsReady = false;
async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load("800 100px 'Kantumruy Pro Variable'"),
      document.fonts.load("400 100px 'Kantumruy Pro Variable'"),
    ]);
    await document.fonts.ready;
  } catch { /* fonts may already be present */ }
  fontsReady = true;
}

export default function PrintStudio() {
  const { text: t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [style, setStyle] = useState<CharStyle>({ font: "display", bold: true, fill: "#9c2aa0", outline: true, outlineColor: "#2a0e3d", outlineWidth: 18 });
  const [splitChars, setSplitChars] = useState(true);
  const [typed, setTyped] = useState("");
  const [catId, setCatId] = useState(GLYPH_CATEGORIES[0].id);
  const [settings, setSettings] = useState<Settings>({ mode: "grid", targetMm: 80, spacingMm: 3, marginMm: 4, orientation: "auto", dpi: 300, trim: true, stretch: false });
  const [previews, setPreviews] = useState<{ url: string; count: number }[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [modalIdx, setModalIdx] = useState<number | null>(null);
  const seq = useRef(0);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));
  const setSt = <K extends keyof CharStyle>(k: K, v: CharStyle[K]) => setStyle((s) => ({ ...s, [k]: v }));
  const category = GLYPH_CATEGORIES.find((c) => c.id === catId) ?? GLYPH_CATEGORIES[0];

  const addFromDataURL = useCallback((name: string, dataURL: string) => {
    const im = new Image();
    im.onload = () => {
      const b = trimBounds(im);
      setItems((prev) => [...prev, { id: nextId(), name, img: im, w: im.naturalWidth, h: im.naturalHeight, trimX: b.x, trimY: b.y, trimW: b.w, trimH: b.h, dataURL }]);
    };
    im.src = dataURL;
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).filter((f) => f.type.startsWith("image/")).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => addFromDataURL(file.name, String(ev.target?.result));
      reader.readAsDataURL(file);
    });
  }, [addFromDataURL]);

  const addChar = useCallback(async (ch: string) => {
    if (!ch || !ch.trim()) return;
    await ensureFonts();
    const dataURL = renderCharTile(ch, style).toDataURL("image/png");
    addFromDataURL(ch, dataURL);
  }, [style, addFromDataURL]);

  const addTyped = async () => {
    const text = typed;
    if (!text.trim()) return;
    await ensureFonts();
    if (splitChars) for (const ch of splitGraphemes(text)) { if (ch.trim()) await addChar(ch); }
    else await addChar(text.trim());
    setTyped("");
  };

  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const moveItem = (id: string, dir: number) => setItems((p) => {
    const idx = p.findIndex((i) => i.id === id);
    const j = idx + dir;
    if (j < 0 || j >= p.length) return p;
    const next = [...p];
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });

  // ---- layout engine ----
  const buildSheets = useCallback((list: Item[], s: Settings, dpi: number): { canvas: HTMLCanvasElement; count: number }[] => {
    const pages: { canvas: HTMLCanvasElement; count: number }[] = [];
    if (list.length === 0) return pages;
    const orientation = s.orientation !== "auto" ? s.orientation : (list.filter((i) => i.w > i.h).length > list.length / 2 ? "landscape" : "portrait");
    let wmm = 210, hmm = 297;
    if (orientation === "landscape") { wmm = 297; hmm = 210; }
    const pageW = mm2px(wmm, dpi), pageH = mm2px(hmm, dpi);
    const marginPx = mm2px(s.marginMm, dpi);
    const region = (it: Item) => (s.trim ? { x: it.trimX, y: it.trimY, w: it.trimW, h: it.trimH } : { x: 0, y: 0, w: it.w, h: it.h });
    const newCanvas = () => { const c = document.createElement("canvas"); c.width = pageW; c.height = pageH; const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, pageW, pageH); return c; };

    if (s.mode === "single") {
      for (const it of list) {
        const c = newCanvas();
        const ctx = c.getContext("2d")!;
        const r = region(it);
        const availW = pageW - 2 * marginPx, availH = pageH - 2 * marginPx;
        let dw, dh, dx, dy;
        if (s.stretch) { dw = availW; dh = availH; dx = marginPx; dy = marginPx; }
        else { const sc = Math.min(availW / r.w, availH / r.h); dw = r.w * sc; dh = r.h * sc; dx = (pageW - dw) / 2; dy = (pageH - dh) / 2; }
        ctx.drawImage(it.img, r.x, r.y, r.w, r.h, dx, dy, dw, dh);
        pages.push({ canvas: c, count: 1 });
      }
      return pages;
    }

    const targetPx = mm2px(s.targetMm, dpi), spacingPx = mm2px(s.spacingMm, dpi);
    let c = newCanvas(), ctx = c.getContext("2d")!, x = marginPx, y = marginPx, rowH = 0, placed = 0;
    for (const it of list) {
      const r = region(it);
      const sc = targetPx / r.h;
      const dw = r.w * sc, dh = r.h * sc;
      if (x !== marginPx && x + dw > pageW - marginPx) { x = marginPx; y += rowH + spacingPx; rowH = 0; }
      if (y + dh > pageH - marginPx) { pages.push({ canvas: c, count: placed }); c = newCanvas(); ctx = c.getContext("2d")!; x = marginPx; y = marginPx; rowH = 0; placed = 0; }
      ctx.drawImage(it.img, r.x, r.y, r.w, r.h, x, y, dw, dh);
      x += dw + spacingPx; rowH = Math.max(rowH, dh); placed++;
    }
    if (placed > 0 || pages.length === 0) pages.push({ canvas: c, count: placed });
    return pages;
  }, []);

  // Rebuild the low-res preview whenever items or settings change (debounced).
  useEffect(() => {
    const mySeq = ++seq.current;
    const timer = setTimeout(() => {
      if (items.length === 0) { setPreviews([]); return; }
      const sheets = buildSheets(items, settings, PREVIEW_DPI);
      if (seq.current !== mySeq) return;
      setPreviews(sheets.map((p) => ({ url: p.canvas.toDataURL("image/png"), count: p.count })));
    }, 200);
    return () => clearTimeout(timer);
  }, [items, settings, buildSheets]);

  const orientationLabel = settings.orientation !== "auto" ? settings.orientation : (items.filter((i) => i.w > i.h).length > items.length / 2 ? "landscape" : "portrait");

  const exportPdf = useCallback(async () => {
    if (items.length === 0) return;
    setBusy("pdf");
    setError("");
    try {
      const sheets = buildSheets(items, settings, settings.dpi);
      const { jsPDF } = await import("jspdf");
      const ori = orientationLabel === "landscape" ? "l" : "p";
      const wmm = orientationLabel === "landscape" ? 297 : 210;
      const hmm = orientationLabel === "landscape" ? 210 : 297;
      const doc = new jsPDF({ orientation: ori, unit: "mm", format: "a4", compress: true });
      for (let i = 0; i < sheets.length; i++) {
        if (i > 0) doc.addPage("a4", ori);
        doc.addImage(sheets[i].canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, wmm, hmm, undefined, "FAST");
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      }
      doc.save("print-studio-sheets.pdf");
      recordExport();
    } catch {
      setError(t("Could not build the PDF — try the ZIP export or a lower resolution.", "មិនអាចបង្កើត PDF — សាកល្បង ZIP ឬគុណភាពទាបជាង។"));
    } finally { setBusy(""); }
  }, [items, settings, orientationLabel, buildSheets, t]);

  const exportZip = useCallback(async () => {
    if (items.length === 0) return;
    setBusy("zip");
    try {
      const sheets = buildSheets(items, settings, settings.dpi);
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < sheets.length; i++) {
        zip.file(`sheet-${String(i + 1).padStart(2, "0")}.png`, sheets[i].canvas.toDataURL("image/png").split(",")[1], { base64: true });
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "print-studio-sheets.zip"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
    } finally { setBusy(""); }
  }, [items, settings, buildSheets]);

  const inputCls = "w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]";

  return (
    <ToolShell
      title="Print Studio"
      khmerTitle="ស្ទូឌីយោបោះពុម្ព"
      description="Lay out images and characters — the full Khmer script, Latin, symbols, and emoji — onto A4 sheets, packed many-per-page or one-per-page, then export a print-ready PDF or a ZIP of PNGs. Type or click to add glyphs with your own fill and outline. Everything runs locally."
      descriptionKm="រៀបចំរូបភាព និងតួអក្សរ — អក្សរខ្មែរពេញលេញ ឡាតាំង និមិត្តសញ្ញា និងអុីម៉ូជី — លើសន្លឹក A4 ដាក់ច្រើនក្នុងមួយទំព័រ ឬមួយក្នុងមួយទំព័រ រួចនាំចេញ PDF ត្រៀមបោះពុម្ព ឬ ZIP។ វាយ ឬចុចដើម្បីបន្ថែមតួអក្សរជាមួយពណ៌ និងគែមផ្ទាល់ខ្លួន។ ដំណើរការក្នុងម៉ាស៊ីន។"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ---------------- controls ---------------- */}
        <div className="space-y-5">
          {/* import */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Import", "នាំចូល")}</h3>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-5 text-center text-sm transition ${dragging ? "border-[var(--gold)] bg-[var(--ground-raised-hi)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)]"}`}
            >
              <Upload size={20} className="text-[var(--ink-faint)]" />
              <span className="font-medium text-[var(--ink)]">{t("Drop images or click", "ទម្លាក់រូប ឬចុច")}</span>
              <span className="text-[11px] text-[var(--ink-faint)]">{t("PNG, JPG, SVG · multiple", "PNG, JPG, SVG · ច្រើន")}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            </label>
            {items.length > 0 && (
              <>
                <ul className="mt-2 max-h-52 space-y-1.5 overflow-y-auto">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.dataURL} alt="" className="h-8 w-8 flex-none rounded-sm border border-[var(--ground-line)] bg-white object-contain" />
                      <span className="min-w-0 flex-1 truncate text-xs text-[var(--ink)]">{it.name}</span>
                      <button onClick={() => moveItem(it.id, -1)} className="p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]"><ArrowUp size={13} /></button>
                      <button onClick={() => moveItem(it.id, 1)} className="p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]"><ArrowDown size={13} /></button>
                      <button onClick={() => removeItem(it.id)} className="p-1 text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
                <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--ink-faint)]">
                  <span>{items.length} {t(items.length === 1 ? "item" : "items", "ធាតុ")}</span>
                  <button onClick={() => setItems([])} className="text-[var(--gold)] hover:underline">{t("Clear all", "សម្អាតទាំងអស់")}</button>
                </div>
              </>
            )}
          </section>

          {/* add characters */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Add characters", "បន្ថែមតួអក្សរ")}</h3>
            <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={2} placeholder={t("Type anything — កខគ ABC 😀🔥⭐", "វាយអ្វីក៏បាន — កខគ ABC 😀🔥⭐")} className={`${inputCls} font-khmer resize-y`} />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-dim)]">
              <input type="checkbox" checked={splitChars} onChange={(e) => setSplitChars(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
              {t("One tile per character", "មួយប្លុកក្នុងមួយតួ")}
            </label>
            <Button onClick={addTyped} className="mt-2 inline-flex w-full items-center justify-center gap-1.5"><Plus size={14} />{t("Add to sheets", "បន្ថែមទៅសន្លឹក")}</Button>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label={t("Font", "ពុម្ព")}>
                <Select value={style.font} onChange={(e) => setSt("font", e.target.value as FontKey)}>
                  <option value="sans">{t("Sans (Khmer + Latin)", "Sans (ខ្មែរ + ឡាតាំង)")}</option>
                  <option value="display">{t("Bold display", "ដិត")}</option>
                  <option value="serif">{t("Serif", "មានជើង")}</option>
                  <option value="mono">{t("Mono", "ម៉ូណូ")}</option>
                </Select>
              </Field>
              <Field label={t("Weight", "ទម្ងន់")}>
                <Select value={style.bold ? "bold" : "normal"} onChange={(e) => setSt("bold", e.target.value === "bold")}>
                  <option value="bold">{t("Bold", "ដិត")}</option>
                  <option value="normal">{t("Normal", "ធម្មតា")}</option>
                </Select>
              </Field>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label={t("Fill", "ពណ៌")}><input type="color" value={style.fill} onChange={(e) => setSt("fill", e.target.value)} className="h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1" /></Field>
              <Field label={t("Outline", "គែម")}><input type="color" value={style.outlineColor} onChange={(e) => setSt("outlineColor", e.target.value)} className="h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1" /></Field>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-dim)]">
              <input type="checkbox" checked={style.outline} onChange={(e) => setSt("outline", e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
              {t("Outline", "គែម")}
              <input type="range" min={0} max={50} value={style.outlineWidth} onChange={(e) => setSt("outlineWidth", Number(e.target.value))} className="ml-2 flex-1 accent-[var(--gold)]" />
            </label>
            <p className="mt-1 text-[11px] text-[var(--ink-faint)]">{t("Fill & outline apply to text; emoji keep their native colours.", "ពណ៌ និងគែមអនុវត្តលើអក្សរ; អុីម៉ូជីរក្សាពណ៌ដើម។")}</p>

            <div className="mt-3">
              <Field label={t("Quick pick", "ជ្រើសរហ័ស")}>
                <Select value={catId} onChange={(e) => setCatId(e.target.value)}>
                  {GLYPH_GROUPS.map((g) => (
                    <optgroup key={g} label={t(g, GROUP_KM[g])}>
                      {GLYPH_CATEGORIES.filter((c) => c.group === g).map((c) => <option key={c.id} value={c.id}>{t(c.en, c.km)}</option>)}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <div className="mt-2 grid max-h-56 grid-cols-6 gap-1 overflow-y-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5">
                {category.chars.map((ch, i) => (
                  <button key={`${ch}-${i}`} type="button" onClick={() => addChar(ch)} title={t("Add", "បន្ថែម")} className="flex aspect-square items-center justify-center rounded border border-[var(--ground-line)] bg-[var(--ground)] text-lg text-[var(--ink)] transition hover:border-[var(--gold)] hover:bg-[var(--ground-raised-hi)]">
                    <span className="font-khmer">{ch}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* layout */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Layout", "ប្លង់")}</h3>
            <div className="mb-2 flex gap-1.5">
              <button onClick={() => set("mode", "grid")} className="chip flex-1 justify-center" data-active={settings.mode === "grid"}>{t("Pack per sheet", "ដាក់ច្រើន")}</button>
              <button onClick={() => set("mode", "single")} className="chip flex-1 justify-center" data-active={settings.mode === "single"}>{t("One per sheet", "មួយក្នុងសន្លឹក")}</button>
            </div>
            {settings.mode === "grid" ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("Item height (mm)", "កម្ពស់ (ម.ម)")}><input type="number" value={settings.targetMm} min={5} max={280} onChange={(e) => set("targetMm", Number(e.target.value) || 40)} className={inputCls} /></Field>
                <Field label={t("Spacing (mm)", "គម្លាត (ម.ម)")}><input type="number" value={settings.spacingMm} min={0} max={60} onChange={(e) => set("spacingMm", Number(e.target.value) || 0)} className={inputCls} /></Field>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
                <input type="checkbox" checked={settings.stretch} onChange={(e) => set("stretch", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
                {t("Stretch to fill page", "ទាញឲ្យពេញទំព័រ")}
              </label>
            )}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
              <input type="checkbox" checked={settings.trim} onChange={(e) => set("trim", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              {t("Trim empty space around each item", "កាត់ចន្លោះទំនេរជុំវិញធាតុនីមួយៗ")}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label={t("Page margin (mm)", "គែមទំព័រ (ម.ម)")}><input type="number" value={settings.marginMm} min={0} max={60} onChange={(e) => set("marginMm", Number(e.target.value) || 0)} className={inputCls} /></Field>
              <Field label={t("Orientation", "ទិសដៅ")}>
                <Select value={settings.orientation} onChange={(e) => set("orientation", e.target.value as Settings["orientation"])}>
                  <option value="auto">{t("Auto", "ស្វ័យ")}</option>
                  <option value="portrait">{t("Portrait", "បញ្ឈរ")}</option>
                  <option value="landscape">{t("Landscape", "ផ្តេក")}</option>
                </Select>
              </Field>
            </div>
            <Field label={t("Print resolution", "គុណភាពបោះពុម្ព")}>
              <Select value={String(settings.dpi)} onChange={(e) => set("dpi", Number(e.target.value))}>
                <option value="150">{t("150 dpi — draft", "150 dpi — សាកល្បង")}</option>
                <option value="300">{t("300 dpi — print", "300 dpi — បោះពុម្ព")}</option>
                <option value="600">{t("600 dpi — high detail", "600 dpi — លម្អិត")}</option>
              </Select>
            </Field>
          </section>

          <section>
            <div className="space-y-2">
              <Button onClick={exportPdf} disabled={items.length === 0 || busy !== ""} className="inline-flex w-full items-center justify-center gap-2"><Download size={15} />{busy === "pdf" ? t("Building PDF…", "កំពុងបង្កើត PDF…") : t("Download PDF (all sheets)", "ទាញយក PDF (គ្រប់សន្លឹក)")}</Button>
              <button onClick={exportZip} disabled={items.length === 0 || busy !== ""} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40"><FolderDown size={15} />{busy === "zip" ? t("Building ZIP…", "កំពុងបង្កើត ZIP…") : t("Download ZIP (PNG per sheet)", "ទាញយក ZIP")}</button>
              {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            </div>
          </section>
        </div>

        {/* ---------------- preview ---------------- */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
            <span>{t("Sheets", "សន្លឹក")}</span>
            {previews.length > 0 && <span>{previews.length} {t(previews.length === 1 ? "sheet" : "sheets", "សន្លឹក")} · A4 · {orientationLabel} · {settings.dpi}dpi</span>}
          </div>
          {previews.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--ground-line)] text-center text-sm text-[var(--ink-faint)]">
              <Upload size={28} className="opacity-40" />
              {t("Add images or characters — sheets lay out automatically.", "បន្ថែមរូប ឬតួអក្សរ — សន្លឹករៀបចំដោយស្វ័យប្រវត្តិ។")}
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {previews.map((p, i) => (
                <button key={i} onClick={() => setModalIdx(i)} className="overflow-hidden rounded-md border border-[var(--ground-line)] bg-white text-left transition hover:border-[var(--gold)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Sheet ${i + 1}`} className="block w-full" />
                  <div className="flex justify-between px-2 py-1.5 font-mono-ui text-[11px] text-[var(--ink-dim)]"><span className="font-bold text-[var(--ink)]">{t("Sheet", "សន្លឹក")} {i + 1}</span><span>{p.count} {t(p.count === 1 ? "item" : "items", "ធាតុ")}</span></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalIdx !== null && previews[modalIdx] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8" onClick={() => setModalIdx(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previews[modalIdx].url} alt="" className="max-h-full max-w-full border border-[var(--ground-line)] bg-white" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("PDF export: jsPDF (MIT). ZIP packaging: JSZip (MIT/GPL).", "នាំចេញ PDF: jsPDF (MIT)។ ការខ្ចប់ ZIP: JSZip (MIT/GPL)។")}</li>
          <li>{t("Original Tools123 implementation; runs locally in your browser — nothing is uploaded.", "ការសរសេរដើមរបស់ Tools123; ដំណើរការក្នុងកម្មវិធីរុករក — គ្មានការផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

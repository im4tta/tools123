"use client";

// ID / Passport Photo Studio — crop a portrait to a common ID-photo size,
// optionally replace the background with a plain colour (local AI matting via
// @imgly/background-removal), and export a single photo or a tiled print sheet.
// Physical sizes are common presets, not an official spec — always check the
// exact requirement for your document. Everything runs locally in the browser.

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Download, Loader2, RotateCcw } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

const DPI = 300;
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

const SIZES: { id: string; en: string; km: string; w: number; h: number }[] = [
  { id: "35x45", en: "35 × 45 mm (common passport)", km: "៣៥ × ៤៥ ម.ម", w: 35, h: 45 },
  { id: "40x60", en: "40 × 60 mm (4 × 6 cm)", km: "៤០ × ៦០ ម.ម", w: 40, h: 60 },
  { id: "30x40", en: "30 × 40 mm (3 × 4 cm)", km: "៣០ × ៤០ ម.ម", w: 30, h: 40 },
  { id: "51x51", en: "51 × 51 mm (2 × 2 in)", km: "៥១ × ៥១ ម.ម", w: 51, h: 51 },
  { id: "custom", en: "Custom", km: "ផ្ទាល់ខ្លួន", w: 35, h: 45 },
];

const BGS: { id: string; en: string; km: string; color: string | null }[] = [
  { id: "none", en: "Keep original", km: "រក្សាដើម", color: null },
  { id: "white", en: "White", km: "ស", color: "#ffffff" },
  { id: "blue", en: "Light blue", km: "ខៀវ​ស្រាល", color: "#d6e4f2" },
  { id: "gray", en: "Grey", km: "ប្រផេះ", color: "#c9ced6" },
  { id: "custom", en: "Custom colour", km: "ពណ៌ផ្ទាល់ខ្លួន", color: "#ffffff" },
];

function drawPhoto(ctx: CanvasRenderingContext2D, fw: number, fh: number, img: HTMLImageElement | null, bg: string | null, zoom: number, panX: number, panY: number) {
  ctx.clearRect(0, 0, fw, fh);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, fw, fh); }
  if (!img || !img.width) return;
  const cover = Math.max(fw / img.width, fh / img.height);
  const s = cover * zoom;
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, (fw - dw) / 2 + panX * fw, (fh - dh) / 2 + panY * fh, dw, dh);
}

export default function PassportPhoto() {
  const { text: t } = useLanguage();
  const [origImg, setOrigImg] = useState<HTMLImageElement | null>(null);
  const [subjectImg, setSubjectImg] = useState<HTMLImageElement | null>(null);
  const [sizeId, setSizeId] = useState("35x45");
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [bgId, setBgId] = useState("white");
  const [customColor, setCustomColor] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [copies, setCopies] = useState(8);
  const [sheet, setSheet] = useState<"4R" | "A4">("4R");
  const [removing, setRemoving] = useState(false);
  const [status, setStatus] = useState("");
  const fileRef = useRef<File | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[0];
  const wmm = sizeId === "custom" ? customW : size.w;
  const hmm = sizeId === "custom" ? customH : size.h;
  const bgDef = BGS.find((b) => b.id === bgId) ?? BGS[0];
  const bgColor = bgDef.id === "custom" ? customColor : bgDef.color;
  const wantsMatte = bgDef.id !== "none";
  const activeImg = wantsMatte ? subjectImg : origImg;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current = file;
    setSubjectImg(null);
    setStatus("");
    const img = new Image();
    img.onload = () => setOrigImg(img);
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  };

  // Run background matting the first time a colour background is needed.
  useEffect(() => {
    if (!wantsMatte || !fileRef.current || subjectImg || removing) return;
    let cancelled = false;
    (async () => {
      setRemoving(true);
      setStatus(t("Loading matting model…", "កំពុងផ្ទុកគំរូ…"));
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(fileRef.current as File, {
          progress: (key: string, cur: number, total: number) => {
            if (!cancelled) setStatus(key.startsWith("fetch") ? `${t("Downloading model…", "កំពុងទាញយកគំរូ…")} ${Math.round((cur / total) * 100)}%` : t("Removing background…", "កំពុងលុបផ្ទៃខាងក្រោយ…"));
          },
        });
        if (cancelled) return;
        const img = new Image();
        img.onload = () => { if (!cancelled) { setSubjectImg(img); setStatus(""); } };
        img.src = URL.createObjectURL(blob);
      } catch {
        if (!cancelled) setStatus(t("Background removal failed — try 'Keep original', a smaller image, or a browser with WebAssembly support.", "ការលុបផ្ទៃខាងក្រោយបរាជ័យ — សាកល្បង 'រក្សាដើម' រូបតូចជាង ឬកម្មវិធីរុករកដែលគាំទ្រ WebAssembly។"));
      } finally {
        if (!cancelled) setRemoving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [wantsMatte, subjectImg, removing, t]);

  // Redraw the preview.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const scale = 2;
    const pw = 220;
    const ph = Math.round((pw * hmm) / wmm);
    canvas.width = pw * scale;
    canvas.height = ph * scale;
    canvas.style.width = `${pw}px`;
    canvas.style.height = `${ph}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) drawPhoto(ctx, canvas.width, canvas.height, activeImg, wantsMatte ? bgColor : null, zoom, panX, panY);
  }, [activeImg, wantsMatte, bgColor, zoom, panX, panY, wmm, hmm]);

  const renderPhotoCanvas = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = mmToPx(wmm);
    canvas.height = mmToPx(hmm);
    const ctx = canvas.getContext("2d");
    if (ctx) drawPhoto(ctx, canvas.width, canvas.height, activeImg, wantsMatte ? bgColor : null, zoom, panX, panY);
    return canvas;
  }, [wmm, hmm, activeImg, wantsMatte, bgColor, zoom, panX, panY]);

  const download = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.click();
    recordExport();
  };

  const exportPhoto = () => {
    if (!activeImg) return;
    download(renderPhotoCanvas().toDataURL("image/jpeg", 0.95), `id-photo-${wmm}x${hmm}mm.jpg`);
  };

  const exportSheet = () => {
    if (!activeImg) return;
    const photo = renderPhotoCanvas();
    const sheetW = sheet === "A4" ? mmToPx(210) : mmToPx(152.4);
    const sheetH = sheet === "A4" ? mmToPx(297) : mmToPx(101.6);
    const canvas = document.createElement("canvas");
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sheetW, sheetH);
    const gap = mmToPx(4);
    const cols = Math.max(1, Math.floor((sheetW - gap) / (photo.width + gap)));
    const rows = Math.max(1, Math.floor((sheetH - gap) / (photo.height + gap)));
    const maxCells = cols * rows;
    const gridW = cols * photo.width + (cols - 1) * gap;
    const gridH = rows * photo.height + (rows - 1) * gap;
    const ox = (sheetW - gridW) / 2;
    const oy = (sheetH - gridH) / 2;
    let placed = 0;
    for (let r = 0; r < rows && placed < copies && placed < maxCells; r++) {
      for (let c = 0; c < cols && placed < copies; c++) {
        const x = ox + c * (photo.width + gap);
        const y = oy + r * (photo.height + gap);
        ctx.drawImage(photo, x, y);
        ctx.strokeStyle = "#d0d0d0";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, photo.width, photo.height);
        placed++;
      }
    }
    download(canvas.toDataURL("image/jpeg", 0.92), `id-photo-sheet-${sheet}.jpg`);
  };

  return (
    <ToolShell
      title="ID / Passport Photo Studio"
      khmerTitle="ស្ទូឌីយោរូបថតសម្គាល់ខ្លួន"
      description="Crop a portrait to a common ID-photo size, optionally swap the background to a plain colour (matting runs locally on your device), and export a single photo or a print-ready sheet of copies. Sizes are common presets — check your document's exact requirement. Nothing is uploaded."
      descriptionKm="កាត់រូបបញ្ឈរទៅទំហំរូបថតសម្គាល់ខ្លួនធម្មតា ប្តូរផ្ទៃខាងក្រោយទៅពណ៌រាបស្មើ (ដំណើរការក្នុងឧបករណ៍) រួចនាំចេញរូបតែមួយ ឬសន្លឹកច្បាប់ចម្លងត្រៀមបោះពុម្ព។ ទំហំជាគំរូទូទៅ — សូមពិនិត្យតម្រូវការជាក់លាក់នៃឯកសាររបស់អ្នក។ គ្មានការផ្ទុកឡើងទេ។"
    >
      {!origImg ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <ImagePlus size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{t("Choose a portrait photo", "ជ្រើសរូបថតបញ្ឈរ")}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="relative">
                <canvas ref={previewRef} className="rounded-sm border border-[var(--ground-line)]" />
                {removing && <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-sm bg-black/50 text-center text-[11px] text-white"><Loader2 size={18} className="animate-spin" />{status}</div>}
              </div>
              <p className="mt-2 text-center text-[11px] text-[var(--ink-faint)]">{wmm} × {hmm} mm · {mmToPx(wmm)} × {mmToPx(hmm)} px @ {DPI}dpi</p>
            </div>
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
              <ImagePlus size={15} className="text-[var(--gold)]" />{t("Change photo", "ប្តូររូប")}<input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t("Photo size", "ទំហំរូប")}>
                <Select value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
                  {SIZES.map((s) => <option key={s.id} value={s.id}>{t(s.en, s.km)}</option>)}
                </Select>
              </Field>
              <Field label={t("Background", "ផ្ទៃខាងក្រោយ")}>
                <Select value={bgId} onChange={(e) => setBgId(e.target.value)}>
                  {BGS.map((b) => <option key={b.id} value={b.id}>{t(b.en, b.km)}</option>)}
                </Select>
              </Field>
            </div>
            {sizeId === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("Width (mm)", "ទទឹង (ម.ម)")}><input type="number" value={customW} onChange={(e) => setCustomW(Math.max(10, Number(e.target.value) || 10))} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]" /></Field>
                <Field label={t("Height (mm)", "កម្ពស់ (ម.ម)")}><input type="number" value={customH} onChange={(e) => setCustomH(Math.max(10, Number(e.target.value) || 10))} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]" /></Field>
              </div>
            )}
            {bgDef.id === "custom" && (
              <Field label={t("Background colour", "ពណ៌ផ្ទៃខាងក្រោយ")}>
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-9 w-20 cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1" />
              </Field>
            )}

            <div className="space-y-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Position", "ទីតាំង")}
                <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} className="inline-flex items-center gap-1 text-[10px] font-normal text-[var(--gold)] hover:underline"><RotateCcw size={11} />{t("Reset", "កំណត់ឡើងវិញ")}</button>
              </div>
              {[
                { label: t("Zoom", "ពង្រីក"), v: zoom, min: 0.5, max: 3, step: 0.02, set: setZoom, fmt: `${zoom.toFixed(2)}x` },
                { label: t("Move X", "ផ្លាស់ X"), v: panX, min: -0.5, max: 0.5, step: 0.01, set: setPanX, fmt: `${Math.round(panX * 100)}%` },
                { label: t("Move Y", "ផ្លាស់ Y"), v: panY, min: -0.5, max: 0.5, step: 0.01, set: setPanY, fmt: `${Math.round(panY * 100)}%` },
              ].map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-xs text-[var(--ink-dim)]"><span>{s.label}</span><span className="font-mono-ui text-[var(--ink-faint)]">{s.fmt}</span></div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-[var(--gold)]" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <Field label={t("Sheet", "សន្លឹក")}>
                <Select value={sheet} onChange={(e) => setSheet(e.target.value as "4R" | "A4")}>
                  <option value="4R">{t("4R (6×4 in)", "4R (៦×៤ អ៊ិញ)")}</option>
                  <option value="A4">A4</option>
                </Select>
              </Field>
              <Field label={t("Copies", "ច្បាប់ចម្លង")}>
                <input type="number" value={copies} min={1} max={60} onChange={(e) => setCopies(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} className="w-24 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]" />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={exportPhoto} disabled={!activeImg || removing} className="inline-flex items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"><Download size={15} />{t("Download photo", "ទាញយករូប")}</button>
              <button onClick={exportSheet} disabled={!activeImg || removing} className="inline-flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40"><Download size={15} />{t("Download print sheet", "ទាញយកសន្លឹកបោះពុម្ព")}</button>
            </div>
            {status && !removing && <p className="text-xs text-[var(--danger)]">{status}</p>}
          </div>
        </div>
      )}
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Optional background removal runs an AI model in your browser via @imgly/background-removal.", "ការលុបផ្ទៃខាងក្រោយ (ជាជម្រើស) ដំណើរការគំរូ AI ក្នុងកម្មវិធីរុករករបស់អ្នកតាម @imgly/background-removal។")}</li>
          <li>{t("Original Tools123 implementation; photos are processed locally and never uploaded.", "ការសរសេរដើមរបស់ Tools123; រូបថតត្រូវដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

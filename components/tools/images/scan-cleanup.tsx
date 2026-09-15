"use client";

// Scan Cleanup — turn phone photos of documents into clean scans: auto-deskew
// (shared projection-profile engine), then adaptive-threshold to crisp
// black-and-white (or keep grayscale/colour), and export a small multipage
// PDF. Everything runs locally; nothing is uploaded.

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Download, Loader2, Trash2, ScanLine } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { estimateSkew, rotateFine, toGrayscale, adaptiveThreshold, SKEW_MIN_DEG } from "@/lib/scan";
import { recordExport } from "@/lib/export";

type Mode = "bw" | "gray" | "color";
interface Item { id: string; name: string; img: HTMLImageElement }
interface Settings { mode: Mode; deskew: boolean; strength: number }

const MAX_SIDE = 2200;
const OUT_DPI = 150;

function processOne(img: HTMLImageElement, s: Settings): HTMLCanvasElement {
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let out = canvas;
  if (s.deskew) {
    const skew = estimateSkew(out);
    if (Math.abs(skew) >= SKEW_MIN_DEG) out = rotateFine(out, skew);
  }
  if (s.mode === "gray") toGrayscale(out);
  else if (s.mode === "bw") adaptiveThreshold(out, s.strength);
  return out;
}

export default function ScanCleanup() {
  const { text: t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>({ mode: "bw", deskew: true, strength: 0.5 });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const seq = useRef(0);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    let pending = imgs.length;
    if (!pending) return;
    imgs.forEach((f) => {
      const img = new Image();
      img.onload = () => {
        setItems((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, img }]);
        pending--;
      };
      img.src = URL.createObjectURL(f);
    });
  };

  // Rebuild previews whenever the images or settings change (debounced).
  useEffect(() => {
    const mySeq = ++seq.current;
    const timer = setTimeout(() => {
      if (items.length === 0) { setPreviews([]); setBusy(false); return; }
      setBusy(true);
      // Yield to the event loop between pages so the UI stays responsive.
      const run = async () => {
        const urls: string[] = [];
        for (const it of items) {
          if (seq.current !== mySeq) return;
          const canvas = processOne(it.img, settings);
          urls.push(canvas.toDataURL(settings.mode === "bw" ? "image/png" : "image/jpeg", 0.85));
          await new Promise((r) => setTimeout(r, 0));
        }
        if (seq.current === mySeq) { setPreviews(urls); setBusy(false); }
      };
      void run();
    }, 250);
    return () => clearTimeout(timer);
  }, [items, settings]);

  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const exportPdf = useCallback(async () => {
    if (items.length === 0) return;
    setBusy(true);
    setStatus(t("Building PDF…", "កំពុងបង្កើត PDF…"));
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      for (const it of items) {
        const canvas = processOne(it.img, settings);
        const ptW = (canvas.width * 72) / OUT_DPI;
        const ptH = (canvas.height * 72) / OUT_DPI;
        const embedded = settings.mode === "bw"
          ? await doc.embedPng(canvas.toDataURL("image/png"))
          : await doc.embedJpg(canvas.toDataURL("image/jpeg", 0.85));
        const page = doc.addPage([ptW, ptH]);
        page.drawImage(embedded, { x: 0, y: 0, width: ptW, height: ptH });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scan.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
      setStatus(t(`Exported ${items.length}-page PDF.`, `នាំចេញ PDF ${items.length} ទំព័រ។`));
    } catch {
      setStatus(t("Could not build the PDF.", "មិនអាចបង្កើត PDF បានទេ។"));
    } finally { setBusy(false); }
  }, [items, settings, t]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <ToolShell
      title="Scan Cleanup"
      khmerTitle="សម្អាតរូបស្កេន"
      description="Turn phone photos of documents into clean scans — pages are auto-straightened, then thresholded to crisp black-and-white (or kept grayscale/colour) — and exported as a small multipage PDF. Everything runs locally in your browser."
      descriptionKm="បម្លែងរូបថតឯកសារពីទូរស័ព្ទទៅជាការស្កេនស្អាត — ទំព័រត្រូវតម្រង់ស្វ័យប្រវត្តិ រួចបម្លែងទៅ ស-ខ្មៅ ច្បាស់ (ឬរក្សាប្រផេះ/ពណ៌) — ហើយនាំចេញជា PDF ច្រើនទំព័រតូច។ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {items.length === 0 ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <ImagePlus size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{t("Choose document photos", "ជ្រើសរូបថតឯកសារ")}</span>
            <span className="text-xs text-[var(--ink-faint)]">{t("JPG or PNG — you can pick several", "JPG ឬ PNG — អាចជ្រើសច្រើន")}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <Field label={t("Output", "លទ្ធផល")}>
              <Select value={settings.mode} onChange={(e) => set("mode", e.target.value as Mode)}>
                <option value="bw">{t("Black & white", "ស-ខ្មៅ")}</option>
                <option value="gray">{t("Grayscale", "ប្រផេះ")}</option>
                <option value="color">{t("Keep colour", "រក្សាពណ៌")}</option>
              </Select>
            </Field>
            {settings.mode === "bw" && (
              <div className="min-w-[160px]">
                <div className="mb-1 flex justify-between text-xs text-[var(--ink-dim)]"><span>{t("Ink strength", "កម្រិតទឹកខ្មៅ")}</span><span className="font-mono-ui text-[var(--ink-faint)]">{Math.round(settings.strength * 100)}%</span></div>
                <input type="range" min={0} max={1} step={0.05} value={settings.strength} onChange={(e) => set("strength", Number(e.target.value))} className="w-full accent-[var(--gold)]" />
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 pb-1 text-sm text-[var(--ink-dim)]">
              <input type="checkbox" checked={settings.deskew} onChange={(e) => set("deskew", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              {t("Auto-straighten", "តម្រង់ស្វ័យប្រវត្តិ")}
            </label>
            <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)]">
              <ImagePlus size={15} className="text-[var(--gold)]" />{t("Add more", "បន្ថែម")}<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {items.map((it, i) => (
              <div key={it.id} className="flex flex-col items-center">
                <div className="relative w-full">
                  {previews[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[i]} alt="" className="w-full rounded-md border border-[var(--ground-line)] bg-white" style={{ aspectRatio: `${it.img.width} / ${it.img.height}`, objectFit: "contain" }} />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"><Loader2 size={18} className="animate-spin text-[var(--ink-faint)]" /></div>
                  )}
                  <button onClick={() => remove(it.id)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-[var(--danger)]" aria-label={t("Remove", "លុប")}><Trash2 size={12} /></button>
                </div>
                <span className="mt-1 max-w-full truncate text-[10px] text-[var(--ink-faint)]">{i + 1}. {it.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-[var(--ink-faint)]">{items.length} {t(items.length === 1 ? "page" : "pages", "ទំព័រ")}{settings.deskew ? ` · ${t("auto-straighten on", "តម្រង់បើក")}` : ""}</span>
            <Button onClick={exportPdf} disabled={busy} className="inline-flex items-center gap-2">{busy ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}{busy ? t("Working…", "កំពុងដំណើរការ…") : t("Export PDF", "នាំចេញ PDF")}</Button>
            <button onClick={() => setItems([])} className="rounded-md px-3 py-2 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"><span className="inline-flex items-center gap-1"><Download size={12} className="rotate-180" />{t("Clear all", "សម្អាតទាំងអស់")}</span></button>
            {status && <span className="text-xs text-[var(--ink-dim)]">{status}</span>}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

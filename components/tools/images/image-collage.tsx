"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface CollageImage {
  url: string;
  img: HTMLImageElement;
}

const GRID_OPTIONS = ["1", "2", "3", "4", "5", "6"];

export default function ImageCollage() {
  const { text: t } = useLanguage();
  const [images, setImages] = useState<CollageImage[]>([]);
  const [cols, setCols] = useToolState("image-collage:cols", "2");
  const [rows, setRows] = useToolState("image-collage:rows", "2");
  const [gap, setGap] = useToolState("image-collage:gap", "8");
  const [bg, setBg] = useToolState("image-collage:bg", "#ffffff");
  const [mode, setMode] = useToolState("image-collage:mode", "cover");
  const [scale, setScale] = useToolState("image-collage:scale", "1");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => images.forEach((im) => URL.revokeObjectURL(im.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: FileList) {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => setImages((prev) => [...prev, { url, img }]);
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }
  }

  function removeAt(index: number) {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const c = Math.max(1, Math.min(6, Number(cols) || 2));
    const r = Math.max(1, Math.min(6, Number(rows) || 2));
    const g = Math.max(0, Math.min(64, Number(gap) || 0));
    const s = scale === "2" ? 2 : 1;
    const W = 1200 * s;
    const cellW = (W - (c - 1) * g) / c;
    const cellH = cellW;
    const H = Math.round(r * cellH + (r - 1) * g);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    images.slice(0, c * r).forEach((item, i) => {
      const col = i % c;
      const rowI = Math.floor(i / c);
      const x = col * (cellW + g);
      const y = rowI * (cellH + g);
      const ir = item.img.naturalWidth / Math.max(1, item.img.naturalHeight);
      const cr = cellW / cellH;
      let dw: number, dh: number;
      if (mode === "contain") {
        if (ir > cr) {
          dw = cellW;
          dh = cellW / ir;
        } else {
          dh = cellH;
          dw = cellH * ir;
        }
      } else {
        if (ir > cr) {
          dh = cellH;
          dw = cellH * ir;
        } else {
          dw = cellW;
          dh = cellW / ir;
        }
      }
      ctx.drawImage(item.img, x + (cellW - dw) / 2, y + (cellH - dh) / 2, dw, dh);
    });
  }, [images, cols, rows, gap, bg, mode, scale]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "collage.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, "image/png");
  }

  return (
    <ToolShell
      title="Image Collage Maker"
      khmerTitle="បង្កើតរូបភាពផ្សំគ្នា"
      description="Combine several photos into a grid collage and export it as a single PNG (1x or 2x)."
      descriptionKm="ផ្សំរូបថតជាច្រើនទៅជា Grid មួយ ហើយនាំចេញជា PNG តែមួយ (១x ឬ ២x)។"
    >
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-8 text-center transition hover:border-[var(--gold)]/40"
        >
          <Upload size={28} className="text-[var(--ink-dim)]" />
          <span className="text-sm font-semibold text-[var(--ink)]">{t("Add images (in order)", "បន្ថែមរូបភាព (តាមលំដាប់)")}</span>
          <span className="text-xs text-[var(--ink-dim)]">{t("First image fills the first cell", "រូបភាពទីមួយបំពេញក្រឡាទីមួយ")}</span>
        </button>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((im, i) => (
              <div key={im.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt={t("Image", "រូបភាព")} className="h-16 w-16 rounded-md border border-[var(--ground-line)] object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={t("Remove image", "លុបរូបភាព")}
                  className="absolute -right-1.5 -top-1.5 rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1 text-[var(--ink-dim)] transition hover:text-[var(--danger)]"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Row>
          <Field label={t("Columns", "ចំនួនជួរឈរ")}>
            <Select value={cols} onChange={(e) => setCols(e.target.value)}>
              {GRID_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("Rows", "ចំនួនជួរដេក")}>
            <Select value={rows} onChange={(e) => setRows(e.target.value)}>
              {GRID_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("Gap (px)", "ចន្លោះ (px)")}>
            <TextInput inputMode="numeric" value={gap} onChange={(e) => setGap(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Background color", "ពណ៌ផ្ទៃខាងក្រោយ")}>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-1" />
          </Field>
          <Field label={t("Fit mode", "របៀបសម្រួល")}>
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="cover">{t("Cover (fill cell)", "ពេញក្រឡា")}</option>
              <option value="contain">{t("Contain (fit whole image)", "សមទាំងរូប")}</option>
            </Select>
          </Field>
          <Field label={t("Export size", "ទំហំនាំចេញ")}>
            <Select value={scale} onChange={(e) => setScale(e.target.value)}>
              <option value="1">1× (1200 px)</option>
              <option value="2">2× (2400 px)</option>
            </Select>
          </Field>
        </Row>

        {images.length > 0 && (
          <div className="space-y-3">
            <canvas ref={canvasRef} className="w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]" />
            <Button type="button" onClick={download} className="w-full">
              <Download size={15} className="mr-1.5 inline" />
              {t("Download PNG", "ទាញយក PNG")}
            </Button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}

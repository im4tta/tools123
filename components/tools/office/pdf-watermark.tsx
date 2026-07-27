"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { useToolState } from "@/lib/storage";

interface Settings {
  text: string;
  size: number;
  opacity: number;
  rotation: number;
  color: string;
  position: "center" | "diagonal" | "bottom-right";
}

const initial: Settings = { text: "CONFIDENTIAL", size: 48, opacity: 0.25, rotation: 45, color: "#c9a24b", position: "diagonal" };

function hexToRgb01(hex: string) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return { r, g, b };
}

export default function PdfWatermarkTool() {
  const [s, setS] = useToolState<Settings>("pdf-watermark", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  // First-page thumbnail (unwatermarked) + its true PDF point-size, so the
  // live overlay below can map watermark coordinates the same way pdf-lib
  // will when the real file is generated.
  const [pageImg, setPageImg] = useState<HTMLImageElement | null>(null);
  const [pagePt, setPagePt] = useState<{ w: number; h: number } | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function loadPreview(f: File) {
    setPreviewBusy(true);
    setPageImg(null);
    setPagePt(null);
    try {
      const pdfjs = await loadPdfJs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const page = await doc.getPage(1);
      const unscaled = page.getViewport({ scale: 1 });
      const targetW = 520;
      const scale = targetW / unscaled.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("thumb load failed"));
          img.src = canvas.toDataURL("image/png");
        });
        setPageImg(img);
        setPagePt({ w: unscaled.width, h: unscaled.height });
      }
    } catch {
      // Preview is best-effort — the Apply step below still works even if
      // pdf.js can't render this particular file for a thumbnail.
    } finally {
      setPreviewBusy(false);
    }
  }

  // Redraw the live overlay any time the source page or the watermark
  // settings change — this is what makes it a "live" preview rather than
  // something you only see after clicking Apply.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pageImg || !pagePt) return;
    canvas.width = pageImg.width;
    canvas.height = pageImg.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(pageImg, 0, 0);

    const pxPerPt = canvas.width / pagePt.w;
    const sizePx = s.size * pxPerPt;
    ctx.font = `bold ${sizePx}px Arial, sans-serif`;
    const textWidthPx = ctx.measureText(s.text).width;

    // Same placement math as the real pdf-lib pass, converted from PDF
    // point-space (origin bottom-left, y-up) to canvas pixel-space
    // (origin top-left, y-down).
    let xPtCenter = (pagePt.w - textWidthPx / pxPerPt) / 2;
    let yPt = pagePt.h / 2;
    let rot = s.rotation;
    if (s.position === "bottom-right") {
      xPtCenter = pagePt.w - textWidthPx / pxPerPt - 24;
      yPt = 24;
      rot = 0;
    } else if (s.position === "center") {
      rot = 0;
    }

    const xPx = xPtCenter * pxPerPt;
    const yPx = canvas.height - yPt * pxPerPt;

    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = s.color;
    ctx.translate(xPx, yPx);
    ctx.rotate((-rot * Math.PI) / 180);
    ctx.textBaseline = "alphabetic";
    ctx.fillText(s.text, 0, 0);
    ctx.restore();
  }, [pageImg, pagePt, s]);

  async function apply() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb01(s.color);
      const textWidth = font.widthOfTextAtSize(s.text, s.size);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        let x = (width - textWidth) / 2;
        let y = height / 2;
        let rot = s.rotation;
        if (s.position === "bottom-right") {
          x = width - textWidth - 24;
          y = 24;
          rot = 0;
        } else if (s.position === "center") {
          rot = 0;
        }
        page.drawText(s.text, {
          x,
          y,
          size: s.size,
          font,
          color: rgb(r, g, b),
          opacity: s.opacity,
          rotate: degrees(rot),
        });
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError("Could not watermark this PDF — it may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="PDF Watermark"
      description="Stamp a text watermark — like CONFIDENTIAL or a company name — across every page of a PDF, entirely in your browser. The preview below updates live as you adjust the settings."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose a PDF file"}</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setResultUrl(null);
              loadPreview(f);
            }
          }}
        />
      </label>

      {(previewBusy || pageImg) && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
            {previewBusy && <div className="flex h-64 items-center justify-center text-xs text-[var(--ink-faint)]">Rendering preview…</div>}
            <canvas ref={canvasRef} className={previewBusy ? "hidden" : "block w-full"} />
          </div>
          {pageImg && <span className="text-[11px] text-[var(--ink-faint)]">Live preview — page 1 of {file?.name}</span>}
        </div>
      )}

      <Field label="Watermark text"><TextInput value={s.text} onChange={(e) => update({ text: e.target.value })} /></Field>

      <Row>
        <Field label="Position">
          <Select value={s.position} onChange={(e) => update({ position: e.target.value as Settings["position"] })}>
            <option value="diagonal">Diagonal, centered</option>
            <option value="center">Horizontal, centered</option>
            <option value="bottom-right">Bottom right corner</option>
          </Select>
        </Field>
        <Field label="Color">
          <div className="flex items-center gap-2">
            <input type="color" value={s.color} onChange={(e) => update({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.color} onChange={(e) => update({ color: e.target.value })} />
          </div>
        </Field>
      </Row>

      <Row>
        <Field label="Font size" hint={`${s.size}pt`}>
          <input type="range" min={12} max={120} value={s.size} onChange={(e) => update({ size: Number(e.target.value) })} className="w-full" />
        </Field>
        <Field label="Opacity" hint={`${Math.round(s.opacity * 100)}%`}>
          <input type="range" min={0.05} max={1} step={0.05} value={s.opacity} onChange={(e) => update({ opacity: Number(e.target.value) })} className="w-full" />
        </Field>
      </Row>

      <Button onClick={apply} disabled={!file || busy}>{busy ? "Applying…" : "Apply watermark"}</Button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {resultUrl && (
        <div className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm">
          <span className="text-[var(--ink-dim)]">Ready — {formatBytes(resultSize)}</span>
          <a href={resultUrl} download="watermarked.pdf" className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
            <Download size={13} /> Download
          </a>
        </div>
      )}
    </ToolShell>
  );
}

"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { loadPdfJs } from "@/lib/pdfjs";
import { useToolState } from "@/lib/storage";

interface PageImg {
  page: number;
  url: string;
}
interface Settings {
  scale: number;
  format: "image/png" | "image/jpeg";
}

export default function PdfToImagesTool() {
  const [s, setS] = useToolState<Settings>("pdf-to-images", { scale: 2, format: "image/png" });
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<PageImg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function render() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setImages([]);
    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const out: PageImg[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: s.scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (ctx) await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        out.push({ page: i, url: canvas.toDataURL(s.format, 0.92) });
      }
      setImages(out);
    } catch {
      setError("Could not read this PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadAll() {
    if (images.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const ext = s.format === "image/png" ? "png" : "jpg";
    for (const img of images) {
      const data = img.url.split(",")[1];
      zip.file(`page-${String(img.page).padStart(3, "0")}.${ext}`, data, { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pdf-pages.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="PDF → Images"
      description="Render every page of a PDF as a PNG or JPEG at a resolution you choose, and download them all as a zip — all done locally with pdf.js."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose a PDF file"}</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setImages([]); } }} />
      </label>

      <Row>
        <Field label="Resolution" hint={`${s.scale}×`}>
          <input type="range" min={1} max={4} step={0.5} value={s.scale} onChange={(e) => update({ scale: Number(e.target.value) })} className="w-full" />
        </Field>
        <Field label="Format">
          <Select value={s.format} onChange={(e) => update({ format: e.target.value as Settings["format"] })}>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
          </Select>
        </Field>
      </Row>

      <Button onClick={render} disabled={!file || busy}>{busy ? "Rendering…" : "Render pages"}</Button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ink-faint)]">{images.length} page{images.length === 1 ? "" : "s"} rendered</span>
            <Button onClick={downloadAll} className="!px-3 !py-1.5 !text-xs"><Download size={12} className="mr-1 inline" />Download all (.zip)</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.page} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Page ${img.page}`} className="w-full rounded object-contain" />
                <div className="mt-1 text-center text-[10px] text-[var(--ink-faint)]">Page {img.page}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </ToolShell>
  );
}

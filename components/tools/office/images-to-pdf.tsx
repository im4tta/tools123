"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Download, Trash2 } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { formatBytes } from "@/lib/pdfjs";
import { useToolState } from "@/lib/storage";

interface Item {
  id: string;
  file: File;
  url: string;
}

interface Settings {
  pageSize: "auto" | "a4" | "letter";
  margin: number;
}

export default function ImagesToPdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [s, setS] = useToolState<Settings>("images-to-pdf", { pageSize: "auto", margin: 0 });
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, url: URL.createObjectURL(file) }));
    setItems((prev) => [...prev, ...list]);
    setResultUrl(null);
  }
  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function build() {
    if (items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const PAGE_SIZES: Record<string, [number, number] | null> = { auto: null, a4: [595.28, 841.89], letter: [612, 792] };

      for (const item of items) {
        const bytes = await item.file.arrayBuffer();
        const isPng = item.file.type.includes("png");
        const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes).catch(async () => {
          // fall back through canvas re-encode for formats pdf-lib can't embed directly (webp, gif, etc.)
          const converted = await reencodeToJpeg(item.url);
          return doc.embedJpg(converted);
        });

        const fixed = PAGE_SIZES[s.pageSize];
        const pageW = fixed ? fixed[0] : img.width + s.margin * 2;
        const pageH = fixed ? fixed[1] : img.height + s.margin * 2;
        const page = doc.addPage([pageW, pageH]);

        const availW = pageW - s.margin * 2;
        const availH = pageH - s.margin * 2;
        const scale = Math.min(availW / img.width, availH / img.height, 1) || 1;
        const w = img.width * scale;
        const h = img.height * scale;
        page.drawImage(img, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError("Could not build the PDF — one of the images may be an unsupported format.");
    } finally {
      setBusy(false);
    }
  }

  async function reencodeToJpeg(url: string): Promise<ArrayBuffer> {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("load failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92));
    return blob.arrayBuffer();
  }

  return (
    <ToolShell
      title="Images → PDF"
      description="Combine JPG, PNG, or WebP images into a single PDF — reorder them first, choose a page size, then export. Built entirely in your browser."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>Click to add images</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); }} />
      </label>

      <Row>
        <Field label="Page size">
          <Select value={s.pageSize} onChange={(e) => update({ pageSize: e.target.value as Settings["pageSize"] })}>
            <option value="auto">Fit each image</option>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </Select>
        </Field>
        <Field label="Margin (pt)" hint={`${s.margin}pt`}>
          <input type="range" min={0} max={72} value={s.margin} onChange={(e) => update({ margin: Number(e.target.value) })} className="w-full" />
        </Field>
      </Row>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item, i) => (
            <div key={item.id} className="relative rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.file.name} className="aspect-square w-full rounded object-cover" />
              <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
                <span>#{i + 1}</span>
                <div className="flex gap-1">
                  <button onClick={() => move(item.id, -1)} disabled={i === 0} className="rounded p-0.5 hover:bg-[var(--ground-raised-hi)] disabled:opacity-30"><ArrowUp size={11} /></button>
                  <button onClick={() => move(item.id, 1)} disabled={i === items.length - 1} className="rounded p-0.5 hover:bg-[var(--ground-raised-hi)] disabled:opacity-30"><ArrowDown size={11} /></button>
                  <button onClick={() => remove(item.id)} className="rounded p-0.5 hover:bg-[var(--ground-raised-hi)] hover:text-[var(--danger)]"><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={build} disabled={items.length === 0 || busy}>{busy ? "Building…" : `Build PDF from ${items.length} image${items.length === 1 ? "" : "s"}`}</Button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {resultUrl && (
        <div className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm">
          <span className="text-[var(--ink-dim)]">Ready — {formatBytes(resultSize)}</span>
          <a href={resultUrl} download="images.pdf" className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
            <Download size={13} /> Download
          </a>
        </div>
      )}
    </ToolShell>
  );
}

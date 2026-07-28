"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, Trash2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";

interface Item {
  id: string;
  file: File;
  thumb: string | null;
  pages: number | null;
}

async function makeThumb(file: File): Promise<{ thumb: string | null; pages: number | null }> {
  try {
    const pdfjs = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.22 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { thumb: null, pages: doc.numPages };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    return { thumb: canvas.toDataURL("image/png"), pages: doc.numPages };
  } catch {
    return { thumb: null, pages: null };
  }
}

export default function PdfMergeTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      thumb: null as string | null,
      pages: null as number | null,
    }));
    setItems((prev) => [...prev, ...list]);
    setResultUrl(null);

    // Render thumbnails as they finish — each item updates independently
    // so a slow/large PDF doesn't block the others from showing up.
    for (const item of list) {
      makeThumb(item.file).then(({ thumb, pages }) => {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, thumb, pages } : i)));
      });
    }
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

  async function merge() {
    if (items.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const item of items) {
        const bytes = await item.file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError("Could not merge these PDFs — one of them may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="PDF Merge"
      description="Combine multiple PDFs into a single file, in any order you choose — merged entirely in your browser, nothing is uploaded. First-page thumbnails let you confirm the order before merging."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>Click to add PDF files (2 or more)</span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
        />
      </label>

      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)]">
              <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--ground-line)] bg-[var(--ground)]">
                {item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileText size={14} className="text-[var(--gold)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate">{i + 1}. {item.file.name}</div>
                <div className="text-[var(--ink-faint)]">
                  {formatBytes(item.file.size)}{item.pages ? ` · ${item.pages} page${item.pages === 1 ? "" : "s"}` : ""}
                </div>
              </div>
              <button onClick={() => move(item.id, -1)} disabled={i === 0} className="shrink-0 rounded p-1 hover:bg-[var(--ground-raised-hi)] disabled:opacity-30"><ArrowUp size={12} /></button>
              <button onClick={() => move(item.id, 1)} disabled={i === items.length - 1} className="shrink-0 rounded p-1 hover:bg-[var(--ground-raised-hi)] disabled:opacity-30"><ArrowDown size={12} /></button>
              <button onClick={() => remove(item.id)} className="shrink-0 rounded p-1 hover:bg-[var(--ground-raised-hi)] hover:text-[var(--danger)]"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <Button onClick={merge} disabled={items.length < 2 || busy}>
        {busy ? "Merging…" : `Merge ${items.length} PDFs`}
      </Button>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {resultUrl && (
        <div className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm">
          <span className="text-[var(--ink-dim)]">Merged PDF ready — {formatBytes(resultSize)}</span>
          <a href={resultUrl} download="merged.pdf" className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
            Download
          </a>
        </div>
      )}
    </ToolShell>
  );
}

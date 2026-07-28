"use client";
import { useState } from "react";
import { RotateCw, Trash2, Download, Undo2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { formatBytes, loadPdfJs } from "@/lib/pdfjs";

interface PageItem {
  key: string;
  originalIndex: number;
  rotation: 0 | 90 | 180 | 270;
  thumb: string;
  removed: boolean;
}

export default function PdfOrganizerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  async function handleFile(f: File) {
    setFile(f);
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      const pdfjs = await loadPdfJs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const items: PageItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (ctx) await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        items.push({ key: `p${i}`, originalIndex: i - 1, rotation: 0, thumb: canvas.toDataURL("image/png"), removed: false });
      }
      setPages(items);
    } catch {
      setError("Could not read this PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  function rotate(key: string) {
    setPages((prev) => prev.map((p) => (p.key === key ? { ...p, rotation: ((p.rotation + 90) % 360) as PageItem["rotation"] } : p)));
  }
  function toggleRemove(key: string) {
    setPages((prev) => prev.map((p) => (p.key === key ? { ...p, removed: !p.removed } : p)));
  }
  function reset() {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0, removed: false })));
  }

  function onDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    setPages((prev) => {
      const next = [...prev];
      const from = next.findIndex((p) => p.key === dragKey);
      const to = next.findIndex((p) => p.key === targetKey);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragKey(null);
  }

  async function exportPdf() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const kept = pages.filter((p) => !p.removed);
      const copied = await out.copyPages(src, kept.map((p) => p.originalIndex));
      copied.forEach((page, i) => {
        const rot = kept[i].rotation;
        if (rot) page.setRotation(degrees(page.getRotation().angle + rot));
        out.addPage(page);
      });
      const outBytes = await out.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError("Could not export — try again or reload the source file.");
    } finally {
      setBusy(false);
    }
  }

  const keptCount = pages.filter((p) => !p.removed).length;

  return (
    <ToolShell
      title="PDF Page Organizer"
      description="Reorder pages by dragging, rotate or remove individual pages, then export exactly the document you need — all rendered and rebuilt locally in your browser."
    >
      {!file && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
          <span>{busy ? "Reading…" : "Click to choose a PDF file"}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {pages.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-[var(--ink-faint)]">
            <span>{pages.length} pages · {keptCount} kept · drag to reorder</span>
            <button onClick={reset} className="flex items-center gap-1 hover:text-[var(--ink)]"><Undo2 size={11} /> Reset changes</button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {pages.map((p) => (
              <div
                key={p.key}
                draggable
                onDragStart={() => setDragKey(p.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(p.key)}
                className={`group relative cursor-grab rounded-md border p-1.5 ${
                  p.removed ? "border-[var(--danger)]/40 opacity-40" : "border-[var(--ground-line)] bg-[var(--ground-raised)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumb}
                  alt={`Page ${p.originalIndex + 1}`}
                  className="w-full rounded object-contain"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
                  <span>#{p.originalIndex + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => rotate(p.key)} className="rounded p-0.5 hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"><RotateCw size={11} /></button>
                    <button onClick={() => toggleRemove(p.key)} className="rounded p-0.5 hover:bg-[var(--ground-raised-hi)] hover:text-[var(--danger)]"><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={exportPdf} disabled={keptCount === 0 || busy}>
            {busy ? "Exporting…" : `Export ${keptCount} page${keptCount === 1 ? "" : "s"}`}
          </Button>

          {resultUrl && (
            <div className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm">
              <span className="text-[var(--ink-dim)]">Ready — {formatBytes(resultSize)}</span>
              <a href={resultUrl} download="organized.pdf" className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download
              </a>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}

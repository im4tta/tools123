"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";

interface Info {
  fileName: string;
  sizeLabel: string;
  pageCount: number;
  title: string | null;
  author: string | null;
  producer: string | null;
  encrypted: boolean;
}

export default function PdfInfoTool() {
  const [info, setInfo] = useState<Info | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setThumb(null);
    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const meta = await doc.getMetadata().catch(() => null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info1 = (meta?.info ?? {}) as any;

      setInfo({
        fileName: file.name,
        sizeLabel: formatBytes(file.size),
        pageCount: doc.numPages,
        title: info1.Title || null,
        author: info1.Author || null,
        producer: info1.Producer || null,
        encrypted: Boolean(info1.IsEncrypted),
      });

      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        setThumb(canvas.toDataURL("image/png"));
      }
    } catch {
      setError("Could not read this PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const summary = info
    ? [
        `File: ${info.fileName}`,
        `Size: ${info.sizeLabel}`,
        `Pages: ${info.pageCount}`,
        info.title ? `Title: ${info.title}` : null,
        info.author ? `Author: ${info.author}` : null,
        info.producer ? `Producer: ${info.producer}` : null,
        info.encrypted ? "Encrypted: yes" : "Encrypted: no",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <ToolShell
      title="PDF Info & Preview"
      description="Drop in a PDF to see its exact page count, metadata, and a first-page thumbnail — parsed entirely in your browser with pdf.js, nothing is uploaded."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{busy ? "Reading…" : "Click to choose a PDF file"}</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {error && <Output label="Error" value={error} error mono={false} />}
      {info && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="First page" className="rounded-md border border-[var(--ground-line)] object-contain" />
          )}
          <Output label="File info" value={summary} mono={false} />
        </div>
      )}
    </ToolShell>
  );
}

"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { ActionBar } from "@/components/ui/ActionBar";
import { Dropzone } from "@/components/ui/Dropzone";
import { FileList } from "@/components/ui/FileList";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { toKhmerNumerals } from "@/lib/khmer-number-words";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/components/LanguageProvider";

const kh = (n: number) => toKhmerNumerals(String(n));

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
  const { text: t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  function addFiles(files: File[]) {
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
      toast(t(`Merged ${items.length} PDFs into one file (${formatBytes(blob.size)}).`, `បានបញ្ចូល PDF ${kh(items.length)} ទៅជាឯកសារតែមួយ (${formatBytes(blob.size)})។`));
    } catch {
      setError(t("Could not merge these PDFs — one of them may be encrypted or damaged.", "មិនអាចបញ្ចូល PDF ទាំងនេះបានទេ — ឯកសារមួយអាចត្រូវបានចាក់សោ ឬខូច។"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="PDF Merge"
      description="Combine multiple PDFs into a single file, in any order you choose — merged entirely in your browser, nothing is uploaded. First-page thumbnails let you confirm the order before merging."
      descriptionKm="បញ្ចូល PDF ច្រើនទៅជាឯកសារតែមួយ តាមលំដាប់ដែលអ្នកជ្រើសរើស — ធ្វើទាំងស្រុងក្នុងកម្មវិធីរុករក គ្មានអ្វីត្រូវបានផ្ទុកឡើងទេ។ រូបតូចនៃទំព័រដំបូងជួយអ្នកពិនិត្យលំដាប់មុនពេលបញ្ចូល។"
    >
      <Dropzone
        accept="application/pdf"
        multiple
        onFiles={addFiles}
        label="Drop PDF files here or click to choose"
        labelKm="ទម្លាក់ឯកសារ PDF នៅទីនេះ ឬចុចដើម្បីជ្រើសរើស"
        hint="Add 2 or more; you can reorder them below."
        hintKm="បន្ថែម ២ ឬច្រើនជាងនេះ; អ្នកអាចប្ដូរលំដាប់នៅខាងក្រោម។"
      />

      <FileList
        items={items.map((item) => ({
          id: item.id,
          name: item.file.name,
          size: item.file.size,
          detail: item.pages ? t(`${item.pages} page${item.pages === 1 ? "" : "s"}`, `${kh(item.pages)} ទំព័រ`) : undefined,
          // eslint-disable-next-line @next/next/no-img-element
          thumbnail: item.thumb ? <img src={item.thumb} alt="" className="h-full w-full object-cover" /> : undefined,
        }))}
        onMove={move}
        onRemove={remove}
      />

      <ActionBar
        note={items.length < 2 ? "Add at least 2 PDFs to merge." : undefined}
        noteKm={items.length < 2 ? "បន្ថែម PDF យ៉ាងហោចណាស់ ២ ដើម្បីបញ្ចូល។" : undefined}
      >
        {(noteId) => (
          <Button onClick={merge} disabled={items.length < 2 || busy} aria-describedby={noteId}>
            {busy
              ? t("Merging…", "កំពុងបញ្ចូល…")
              : items.length < 2
                ? t("Merge PDFs", "បញ្ចូល PDF")
                : t(`Merge ${items.length} PDFs into one`, `បញ្ចូល PDF ${kh(items.length)} ទៅជាឯកសារតែមួយ`)}
          </Button>
        )}
      </ActionBar>

      {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}

      {resultUrl && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm">
          <span className="text-[var(--ink-dim)]">{t(`Merged PDF ready — ${formatBytes(resultSize)}`, `PDF ដែលបានបញ្ចូលរួចរាល់ — ${formatBytes(resultSize)}`)}</span>
          <a href={resultUrl} download="merged.pdf" className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[var(--on-gold)] hover:bg-[var(--gold-hover)]">
            <Download size={13} aria-hidden /> {t("Download merged.pdf", "ទាញយក merged.pdf")}
          </a>
        </div>
      )}
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Reading: pdf.js (Apache-2.0, Mozilla). Merging: pdf-lib (MIT).", "ការអាន: pdf.js (Apache-2.0, Mozilla)។ ការបញ្ចូលគ្នា: pdf-lib (MIT)។")}</li>
          <li>{t("Original Tools123 implementation; files are processed locally and never uploaded.", "ការសរសេរដើមរបស់ Tools123; ឯកសារត្រូវដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

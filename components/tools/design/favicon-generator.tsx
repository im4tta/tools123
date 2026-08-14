"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { recordExport } from "@/lib/export";

const SIZES = [
  { size: 16, name: "favicon-16x16.png", label: "Browser tab (16×16)" },
  { size: 32, name: "favicon-32x32.png", label: "Browser tab (32×32)" },
  { size: 48, name: "favicon-48x48.png", label: "Windows taskbar (48×48)" },
  { size: 180, name: "apple-touch-icon.png", label: "Apple touch icon (180×180)" },
  { size: 192, name: "android-chrome-192x192.png", label: "Android / PWA (192×192)" },
  { size: 512, name: "android-chrome-512x512.png", label: "Android / PWA (512×512)" },
];

interface Rendered {
  name: string;
  size: number;
  label: string;
  url: string;
}

const SNIPPET = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
<link rel="manifest" href="/site.webmanifest">`;

export default function FaviconGeneratorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [rendered, setRendered] = useState<Rendered[]>([]);
  const [busy, setBusy] = useState(false);
  const [bg, setBg] = useState<"transparent" | "white">("transparent");

  async function handleFile(f: File) {
    setFile(f);
    setBusy(true);
    setRendered([]);
    try {
      const url = URL.createObjectURL(f);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = url;
      });

      const items: Rendered[] = [];
      for (const spec of SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = spec.size;
        canvas.height = spec.size;
        const ctx = canvas.getContext("2d")!;
        if (bg === "white") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, spec.size, spec.size);
        }
        // fit the source image within the square, centered
        const scale = Math.min(spec.size / img.naturalWidth, spec.size / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (spec.size - w) / 2, (spec.size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL("image/png");
        items.push({ name: spec.name, size: spec.size, label: spec.label, url: dataUrl });
      }
      setRendered(items);
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    if (rendered.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const r of rendered) zip.file(r.name, r.url.split(",")[1], { base64: true });
    zip.file(
      "site.webmanifest",
      JSON.stringify(
        {
          name: "",
          icons: [
            { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
          ],
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
        },
        null,
        2
      )
    );
    zip.file("head-snippet.html", SNIPPET);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "favicons.zip";
    a.click();
    URL.revokeObjectURL(url);
    recordExport();
  }

  return (
    <ToolShell
      title="Favicon Generator"
      description="Upload a logo or square image and get every favicon size a modern site needs — browser tab, Apple touch icon, and Android/PWA icons — plus the HTML snippet to wire them up. All rendered locally."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose a logo (square images work best)"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      <div className="flex items-center gap-3 text-xs text-[var(--ink-dim)]">
        <span>Background:</span>
        <label className="flex items-center gap-1.5"><input type="radio" checked={bg === "transparent"} onChange={() => { setBg("transparent"); if (file) handleFile(file); }} /> Transparent</label>
        <label className="flex items-center gap-1.5"><input type="radio" checked={bg === "white"} onChange={() => { setBg("white"); if (file) handleFile(file); }} /> White</label>
      </div>

      {busy && <p className="text-xs text-[var(--ink-faint)]">Rendering sizes…</p>}

      {rendered.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {rendered.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[repeating-conic-gradient(#2a2e31_0%_25%,#1c1f21_0%_50%)] bg-[length:12px_12px] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt={r.label} className="h-10 w-10 object-contain" />
                <span className="text-center text-[9px] text-[var(--ink-faint)]">{r.size}px</span>
              </div>
            ))}
          </div>

          <Button onClick={downloadZip} className="w-full"><Download size={13} className="mr-1.5 inline" />Download all sizes (.zip)</Button>

          <Output label="HTML to paste into <head>" value={SNIPPET} />
        </>
      )}
    </ToolShell>
  );
}

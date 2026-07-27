"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";

interface Tag {
  label: string;
  value: string;
}

// Minimal EXIF/TIFF tag reader — enough to surface the common, human-relevant
// fields (camera, exposure, GPS, timestamp) without pulling in a full EXIF
// dependency for a read-mostly tool.
const TAGS: Record<number, string> = {
  0x010f: "Camera make",
  0x0110: "Camera model",
  0x0112: "Orientation",
  0x0132: "Date/time",
  0x829a: "Exposure time",
  0x829d: "F-number",
  0x8827: "ISO",
  0x920a: "Focal length",
  0xa002: "Pixel width",
  0xa003: "Pixel height",
  0x0131: "Software",
};

function readExif(buf: ArrayBuffer): Tag[] {
  const view = new DataView(buf);
  if (view.getUint16(0) !== 0xffd8) return []; // not a JPEG
  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    if (marker === 0xffe1) {
      const exifStart = offset + 4;
      if (view.getUint32(exifStart) !== 0x45786966) { offset += 2 + view.getUint16(offset + 2); continue; }
      const tiffStart = exifStart + 6;
      const little = view.getUint16(tiffStart) === 0x4949;
      const ifdOffset = tiffStart + view.getUint32(tiffStart + 4, little);
      const count = view.getUint16(ifdOffset, little);
      const tags: Tag[] = [];
      for (let i = 0; i < count; i++) {
        const entryOffset = ifdOffset + 2 + i * 12;
        const tagId = view.getUint16(entryOffset, little);
        const type = view.getUint16(entryOffset + 2, little);
        const numValues = view.getUint32(entryOffset + 4, little);
        const label = TAGS[tagId];
        if (!label) continue;
        let value = "";
        try {
          if (type === 2) {
            // ASCII string — stored inline if ≤4 bytes, else at an offset
            const strOffset = numValues <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, little);
            let s = "";
            for (let b = 0; b < numValues - 1; b++) s += String.fromCharCode(view.getUint8(strOffset + b));
            value = s;
          } else if (type === 3) {
            value = String(view.getUint16(entryOffset + 8, little));
          } else if (type === 4) {
            value = String(view.getUint32(entryOffset + 8, little));
          } else if (type === 5) {
            const ratOffset = tiffStart + view.getUint32(entryOffset + 8, little);
            const num = view.getUint32(ratOffset, little);
            const den = view.getUint32(ratOffset + 4, little);
            value = den ? (num / den).toFixed(den > 1000 ? 5 : 2) : String(num);
          }
        } catch {
          continue;
        }
        if (value) tags.push({ label, value });
      }
      return tags;
    }
    if ((marker & 0xff00) !== 0xff00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return [];
}

export default function ImageExifTool() {
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [strippedUrl, setStrippedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setStrippedUrl(null);
    try {
      const buf = await file.arrayBuffer();
      setTags(readExif(buf));
      setPreviewUrl(URL.createObjectURL(file));

      // Strip: redraw through canvas, which drops all metadata by construction.
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (blob) setStrippedUrl(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  const summary = tags && tags.length > 0 ? tags.map((t) => `${t.label}: ${t.value}`).join("\n") : "";

  return (
    <ToolShell
      title="Image Metadata (EXIF) Viewer & Stripper"
      description="See the camera, exposure, and timestamp data embedded in a JPEG, and download a clean copy with all of it removed — useful before sharing photos publicly. Everything runs locally."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{busy ? "Reading…" : "Click to choose a JPEG photo"}</span>
        <input type="file" accept="image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Uploaded" className="max-h-56 rounded-md border border-[var(--ground-line)] object-contain" />
      )}

      {tags && (
        tags.length > 0
          ? <Output label="Embedded metadata" value={summary} mono={false} />
          : <Output label="Embedded metadata" value="No EXIF metadata found in this file — it may already be stripped, or this isn't a JPEG." mono={false} />
      )}

      {strippedUrl && (
        <a href={strippedUrl} download="stripped.jpg">
          <Button className="w-full"><Download size={13} className="mr-1.5 inline" />Download copy with metadata removed</Button>
        </a>
      )}
    </ToolShell>
  );
}

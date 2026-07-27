"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

export default function ImageToBase64Tool() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <ToolShell
      title="Image ⇄ Base64 Converter"
      description="Convert an image file into a Base64 data URL you can paste directly into CSS, HTML, or JSON — done fully client-side."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{fileName ?? "Click to choose an image"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>
      {dataUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="Preview" className="max-h-56 rounded-md border border-[var(--ground-line)] object-contain" />
          <Output label={`Data URL (${dataUrl.length.toLocaleString()} characters)`} value={dataUrl} />
        </>
      )}
    </ToolShell>
  );
}

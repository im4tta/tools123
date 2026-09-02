"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

export default function PixelateImage() {
  const { text: t } = useLanguage();
  const [blockStr, setBlockStr] = useToolState("pixelate-image:block", "12");
  const [url, setUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const smallRef = useRef<HTMLCanvasElement | null>(null);

  const block = Math.max(2, Math.min(64, Number(blockStr) || 12));
  const blockRef = useRef(block);
  useEffect(() => {
    blockRef.current = block;
  }, [block]);

  /** Downscales the loaded image to a coarse grid, then draws it crisply on the preview canvas. */
  const render = () => {
    const img = imgRef.current;
    const canvas = previewRef.current;
    if (!img || !canvas) return;
    const b = blockRef.current;
    const w = Math.max(1, Math.round(img.naturalWidth / b));
    const h = Math.max(1, Math.round(img.naturalHeight / b));
    const small = document.createElement("canvas");
    small.width = w;
    small.height = h;
    const sctx = small.getContext("2d");
    if (!sctx) return;
    sctx.drawImage(img, 0, 0, w, h);
    smallRef.current = small;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, w, h);
  };

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      render();
    };
    img.onerror = () => {
      setError(t("Could not load the image. Try a PNG or JPG file.", "មិនអាចផ្ទុករូបភាពបានទេ។ សាកល្បងឯកសារ PNG ឬ JPG។"));
      setUrl(null);
    };
    img.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (imgRef.current && url) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block]);

  const pick = (file: File) => {
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.onerror = () => setError(t("Could not read the file.", "មិនអាចអានឯកសារបានទេ។"));
    reader.readAsDataURL(file);
  };

  const downloadPng = () => {
    const img = imgRef.current;
    const small = smallRef.current;
    if (!img || !small) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pixelated.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      recordExport();
    }, "image/png");
  };

  return (
    <ToolShell
      title="Pixelate Image"
      khmerTitle="ធ្វើឱ្យរូបភាពជា Pixel"
      description="Upload an image, choose a block size, and get a pixelated preview rendered locally in your browser — export it as a PNG."
      descriptionKm="ផ្ទុករូបភាព ជ្រើសរើសទំហំដុំ រួចទទួលបានការមើលមុនបែប pixel ដែលត្រូវបានបង្ហាញក្នុងកម្មវិធីរុករករបស់អ្នក — នាំចេញជា PNG។"
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
          <Upload size={22} className="text-[var(--ink-dim)]" />
          <span>{fileName || t("Click to choose an image", "ចុចដើម្បីជ្រើសរូបភាព")}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
        </label>

        {url && (
          <Field label={t("Block size (px)", "ទំហំដុំ (px)")}>
            <input
              type="range"
              min={2}
              max={64}
              step={1}
              value={block}
              onChange={(e) => setBlockStr(e.target.value)}
              className="w-full accent-[var(--gold)]"
            />
            <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{block}px</div>
          </Field>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {url && (
          <div className="space-y-3">
            <canvas
              ref={previewRef}
              className="mx-auto w-full max-w-xl rounded-md border border-[var(--ground-line)]"
              style={{ imageRendering: "pixelated" }}
            />
            <Button type="button" onClick={downloadPng} className="w-full">
              <Download size={15} className="mr-1.5 inline" />
              {t("Download PNG", "ទាញយក PNG")}
            </Button>
            <p className="text-center text-xs text-[var(--ink-faint)]">
              {t("Everything stays in your browser — nothing is uploaded.", "អ្វីៗស្ថិតក្នុងកម្មវិធីរុករករបស់អ្នក — គ្មានការផ្ទុកឡើងទេ។")}
            </p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}

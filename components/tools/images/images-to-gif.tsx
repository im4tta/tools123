"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, Download, Trash2, Upload } from "lucide-react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

interface Frame {
  name: string;
  url: string;
  img: HTMLImageElement;
}

export default function ImagesToGif() {
  const { text: t } = useLanguage();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [delay, setDelay] = useState("500");
  const [widthStr, setWidth] = useState("480");
  const [quality, setQuality] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      frames.forEach((f) => URL.revokeObjectURL(f.url));
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: FileList) {
    const pending: Frame[] = [];
    let left = files.length;
    setError("");
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          pending.push({ name: file.name, url: reader.result as string, img });
          left--;
          if (left === 0) setFrames((prev) => [...prev, ...pending]);
        };
        img.onerror = () => {
          left--;
          if (left === 0) setFrames((prev) => [...prev, ...pending]);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function move(index: number, dir: -1 | 1) {
    setFrames((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setFrames((prev) => prev.filter((_, i) => i !== index));
  }

  async function loadGifJs(): Promise<void> {
    const w = window as unknown as { GIF?: unknown };
    if (w.GIF) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/gif.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("load failed"));
      document.head.appendChild(script);
    });
  }

  async function generate() {
    if (frames.length < 2) {
      setError(t("Add at least two images.", "សូមបន្ថែមរូបភាពយ៉ាងតិចពីរ។"));
      return;
    }
    setBusy(true);
    setError("");
    setGifUrl(null);
    try {
      await loadGifJs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GIF = (window as any).GIF;
      const width = Math.max(16, Math.min(1280, Number(widthStr) || 480));
      const gif = new GIF({
        workers: 2,
        quality: Math.max(1, Math.min(30, Number(quality) || 10)),
        width,
        workerScript: "/gif.worker.js",
      });
      const delayMs = Math.max(20, Number(delay) || 500);
      for (const frame of frames) {
        const scale = width / frame.img.naturalWidth;
        const height = Math.max(1, Math.round(frame.img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(frame.img, 0, 0, width, height);
        gif.addFrame(canvas, { copy: true, delay: delayMs });
      }
      gif.on("finished", (blob: Blob) => {
        setGifUrl(URL.createObjectURL(blob));
        setBusy(false);
      });
      gif.render();
    } catch {
      setError(t("Could not generate the GIF.", "មិនអាចបង្កើត GIF បានទេ។"));
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Images to Animated GIF"
      khmerTitle="រូបភាពទៅជា GIF មានចលនា"
      description="Combine multiple images into an animated GIF — ordered frames, adjustable delay and quality."
      descriptionKm="ផ្គុំរូបភាពច្រើនទៅជា GIF មានចលនា — រៀបលំដាប់ កំណត់ពេល និងគុណភាព។"
    >
      <div className="space-y-4">
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-8 transition hover:border-[var(--gold)]/40">
          <Upload size={28} className="text-[var(--ink-faint)]" />
          <span className="text-sm font-semibold text-[var(--ink)]">{t("Add images (in order)", "បន្ថែមរូបភាព (តាមលំដាប់)")}</span>
        </button>

        {frames.length > 0 && (
          <div className="space-y-2">
            {frames.map((f, i) => (
              <div key={f.url} className="flex items-center gap-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} className="h-12 w-12 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--ink-dim)]">{i + 1}. {f.name}</span>
                <button type="button" onClick={() => move(i, -1)} className="px-2 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">↑</button>
                <button type="button" onClick={() => move(i, 1)} className="px-2 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">↓</button>
                <button type="button" onClick={() => remove(i)} className="text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={14} /></button>
              </div>
            ))}
            <p className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)]"><ArrowDown size={12} />{t("Frames play top to bottom", "ស៊ុមដំណើរការពីលើចុះក្រោម")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label={t("Delay per frame (ms)", "ពេលក្នុងមួយស៊ុម (ms)")}>
            <TextInput inputMode="numeric" value={delay} onChange={(e) => setDelay(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Width (px)", "ទទឹង (px)")}>
            <TextInput inputMode="numeric" value={widthStr} onChange={(e) => setWidth(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Quality (1–30)", "គុណភាព (១–៣០)")} hint={t("lower = better", "តូច = ល្អ")}>
            <TextInput inputMode="numeric" value={quality} onChange={(e) => setQuality(e.target.value)} className="font-mono-ui" />
          </Field>
        </div>

        <button type="button" onClick={generate} disabled={busy || frames.length < 2} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
          {busy ? t("Generating…", "កំពុងបង្កើត…") : t("Generate GIF", "បង្កើត GIF")}
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {gifUrl && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gifUrl} alt="GIF preview" className="w-full rounded-xl border border-[var(--ground-line)] bg-white" />
            <a href={gifUrl} download="animation.gif" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              <Download size={16} />{t("Download GIF", "ទាញយក GIF")}
            </a>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
"use client";
import { useCallback, useRef, useState } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Lang = "eng" | "khm";
const LANG_STORE_KEY = "screenshot-ocr:lang";

/** Detect if the extracted text contains any Khmer code points. */
function containsKhmer(text: string): boolean {
  // Khmer block U+1780–U+17FF (plus a few Khmer symbols).
  return /[\u1780-\u17FF\u19E0-\u19FF]/u.test(text);
}

export default function ScreenshotOcrTool() {
  const [lang, setLang] = useToolState<Lang>(LANG_STORE_KEY, "khm");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const prevUrlRef = useRef<string | null>(null);

  const detectLang = useCallback((full: string): Lang => {
    if (containsKhmer(full)) return "khm";
    return "eng";
  }, []);

  function onFile(f: File | null) {
    if (!f) return;
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    setFile(f);
    setText("");
    setError("");
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      // Auto-pick the language if none chosen yet or the stored value isn't Khmer.
      const target = lang === "khm" ? "khm" : "eng";
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(target, 1, {
        logger: () => {},
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const detected = detectLang(data.text || "");
      setText(data.text || "");
      if (detected !== target) setLang(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed.");
    } finally {
      setBusy(false);
    }
  }

  function copyAll() {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(() => {});
    }
  }

  return (
    <ToolShell
      title="Screenshot OCR"
      description="Paste a screenshot or upload an image, then extract the text with in-browser OCR — tuned for Khmer (ភាសាខ្មែរ) and English. Files never leave your device."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image / screenshot"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Row>
        <Field label="Language" hint="auto-detects Khmer vs English">
          <Select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="khm">Khmer (ភាសាខ្មែរ)</option>
            <option value="eng">English</option>
          </Select>
        </Field>
        <Field label="Actions">
          <div className="flex gap-2 pt-1">
            <Button onClick={run} disabled={!file || busy}>{busy ? "Recognizing…" : "Extract text"}</Button>
            {text && <Button onClick={copyAll}>Copy text</Button>}
          </div>
        </Field>
      </Row>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {previewUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Source" className="max-h-72 w-full rounded-md border border-[var(--ground-line)] object-contain" />
          <div className="mb-3 rounded-md bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-faint)]">
            {containsKhmer(text) ? "Khmer text detected" : text ? "English text detected" : "Run OCR to extract text"} · works offline after the first model download.
          </div>
        </>
      )}

      <Output label="Extracted text" value={text} mono={false} />
    </ToolShell>
  );
}

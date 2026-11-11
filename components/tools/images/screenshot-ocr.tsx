"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ScanText, Trash2 } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { SourceCredits } from "@/components/ui/SourceCredits";
import type { ChakkhuMode } from "@/lib/chakkhu-ocr";
import { createOcrEngine, ENGINES, KhmerOcr, resultsToText, type EngineId, type OcrOutput } from "@/lib/khmer-ocr";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const kh = (n: number) => toKhmerNumerals(String(n));

export default function KhmerOcrTool() {
  const { text: t } = useLanguage();
  const [img, setImg] = useState<{ url: string; file: string } | null>(null);
  const [engineId, setEngineId] = useState<EngineId>("chakkhu");
  const [mode, setMode] = useState<ChakkhuMode>("best");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [engine, setEngine] = useState<KhmerOcr | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelError, setModelError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OcrOutput | null>(null);
  const [boxesOn, setBoxesOn] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadEngine = useCallback(async (id: EngineId) => {
    setLoadingModel(true);
    setModelError("");
    setEngine(null);
    setResult(null);
    try {
      // Chakkhu (Apache-2.0) / KhmerOCR (MIT) / Kiri OCR (Apache-2.0). Run locally via ONNX Runtime WASM.
      const e = await createOcrEngine(id);
      setEngine(e);
    } catch (e) {
      setModelError(e instanceof Error ? e.message : "Model load failed.");
    } finally {
      setLoadingModel(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEngine(engineId);
  }, [engineId, loadEngine]);

  function onFile(f: File | null) {
    if (!f) return;
    if (img) URL.revokeObjectURL(img.url);
    setImg({ url: URL.createObjectURL(f), file: f.name });
    setResult(null);
    setError("");
  }

  // Draw the image + detected boxes on the canvas.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const im = imgRef.current;
    if (!canvas || !im || !img) return;
    canvas.width = im.naturalWidth;
    canvas.height = im.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(im, 0, 0);
    if (result && boxesOn) {
      ctx.lineWidth = Math.max(2, canvas.width * 0.002);
      ctx.strokeStyle = "#22c55e";
      ctx.font = `${Math.max(14, canvas.width * 0.014)}px sans-serif`;
      for (const line of result.lines) {
        for (const b of line.boxes) {
          if (b.classId !== 1) { ctx.strokeStyle = "#f59e0b"; } else { ctx.strokeStyle = "#22c55e"; }
          ctx.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);
        }
      }
    }
  }, [img, result, boxesOn]);

  useEffect(() => {
    if (img?.url) {
      const im = new Image();
      im.onload = () => { imgRef.current = im; draw(); };
      im.src = img.url;
    }
  }, [img, draw]);

  async function run() {
    const canvas = canvasRef.current;
    if (!canvas || !engine || !img) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(imgRef.current!, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const out = await engine.ocr(imageData, { mode, onProgress: (done, total) => setProgress({ done, total }) });
      setResult(out);
      draw();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("OCR failed.", "ការអានអក្សរបរាជ័យ។"));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const fullText = result ? resultsToText(result.results) : "";

  return (
    <ToolShell
      title="Khmer OCR"
      khmerTitle="អានអក្សរខ្មែរពីរូបភាព"
      description="Accurate Khmer OCR in your browser — choose from multiple engines (Chakkhu, KhmerOCR CRNN or Kiri OCR transformer), with detected region boxes, confidence, and full-text extraction. No upload."
      descriptionKm="អានអក្សរខ្មែរយ៉ាងត្រឹមត្រូវក្នុងកម្មវិធីរុករក — ជ្រើសរើសពីម៉ាស៊ីនជាច្រើន (Chakkhu, KhmerOCR CRNN ឬ Kiri OCR transformer) ជាមួយប្រអប់តំបន់ ភាពជឿជាក់ និងការទាញយកអត្ថបទពេញ។ គ្មានការបញ្ចូលឡើយ។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{img ? img.file : t("Click to choose an image", "ចុចដើម្បីជ្រើសរើសរូបភាព")}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>

      <Field label={t("OCR engine", "ម៉ាស៊ីនអានអក្សរ")}>
        <Select value={engineId} onChange={(e) => setEngineId(e.target.value as EngineId)}>
          {ENGINES.map((eng) => (
            <option key={eng.id} value={eng.id}>{eng.label} — {t(eng.description, eng.descriptionKm)} ({eng.license})</option>
          ))}
        </Select>
        <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
          {ENGINES.find((e) => e.id === engineId)?.author} · {ENGINES.find((e) => e.id === engineId)?.source}
        </p>
      </Field>

      {engineId === "chakkhu" && (
        <Field label={t("Reading quality", "គុណភាពការអាន")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value as ChakkhuMode)}>
            <option value="best">{t("Best — beam search checked by the CTC head (slower)", "ល្អបំផុត — ស្វែងរកបែប beam ផ្ទៀងផ្ទាត់ដោយ CTC (យឺតជាង)")}</option>
            <option value="fast">{t("Fast — CTC head only (quicker, slightly less accurate)", "លឿន — CTC តែមួយ (លឿនជាង ត្រឹមត្រូវតិចជាងបន្តិច)")}</option>
          </Select>
        </Field>
      )}

      {loadingModel && (
        <div className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink-dim)]">
          <Loader2 size={15} className="animate-spin" />
          {engineId === "chakkhu"
            ? t("Loading Chakkhu (first use downloads about 39 MB of models; later visits use the browser cache)…", "កំពុងផ្ទុក Chakkhu (ការប្រើលើកដំបូងទាញយកម៉ូដេលប្រហែល ៣៩ MB ដងក្រោយប្រើឃ្លាំងសម្ងាត់របស់កម្មវិធីរុករក)…")
            : t("Loading OCR engine (det + rec models)…", "កំពុងផ្ទុកម៉ាស៊ីនអានអក្សរ (ម៉ូដេល det + rec)…")}
        </div>
      )}
      {modelError && <p className="text-sm text-[var(--danger)]">{modelError}</p>}

      {img && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-[var(--ground-line)] bg-black/10">
            <canvas ref={canvasRef} className="block max-h-[520px] w-full object-contain" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={!engine || busy || loadingModel}>
              {busy ? <Loader2 size={15} className="mr-1 inline animate-spin" /> : <ScanText size={15} className="mr-1 inline" />}
              {busy
                ? progress && progress.total > 0
                  ? t(`Reading region ${progress.done} of ${progress.total}…`, `កំពុងអានតំបន់ ${kh(progress.done)} នៃ ${kh(progress.total)}…`)
                  : t("Reading…", "កំពុងអាន…")
                : t("Read text", "អានអត្ថបទ")}
            </Button>
            {result && (
              <>
                <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
                  <input type="checkbox" checked={boxesOn} onChange={(e) => setBoxesOn(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
                  {t("Show boxes", "បង្ហាញប្រអប់")}
                </label>
                <Button onClick={() => { if (result) { void navigator.clipboard?.writeText(fullText); } }}>
                  {t("Copy text", "ចម្លងអត្ថបទ")}
                </Button>
                <button type="button" onClick={() => { if (img) URL.revokeObjectURL(img.url); setImg(null); setResult(null); setError(""); }} className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] px-3 py-2 text-sm text-[var(--ink-dim)] hover:border-[var(--danger)]/50 hover:text-[var(--danger)]">
                  <Trash2 size={14} /> {t("Clear", "ជម្រះ")}
                </button>
              </>
            )}
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--ink-dim)]">{t(`${result.results.length} text region(s) detected`, `បានរកឃើញ ${result.results.length} តំបន់អត្ថបទ`)}</p>
          {result.results.map((r, i) => (
            <div key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Line", "បន្ទាត់")} {i + 1}</span>
                <span className="text-[10px] text-[var(--ink-faint)]">{t("conf", "ភាពជឿជាក់")} {Math.round(r.confidence * 100)}%</span>
              </div>
              <p lang="km" className="whitespace-pre-wrap break-words font-khmer text-lg leading-relaxed text-[var(--ink)]">{r.text}</p>
            </div>
          ))}
          <Output label={t("Full text", "អត្ថបទពេញ")} value={fullText} mono={false} />
        </div>
      )}

      <SourceCredits>
        {engineId === "chakkhu" ? (
          <p>
            {t(
              "OCR engine: Chakkhu by Ing Muyleang, Apache-2.0 — the official ONNX export (int8) of the Chakkhu Khmer + English text-line model, which writes whole Khmer letter clusters and rates its confidence in every line. Its author reports a 4.50% character error rate on all 4,018 lines of the KHOB benchmark. The reading steps (line picture, beam search scored by the CTC and decoder heads, Khmer normalization) are ported from the author's reference reader. Text regions are found with the KhmerOCR detector (Seanghay Yath, MIT). The models download from Hugging Face on first use and run on your device via ONNX Runtime WASM; images never leave your browser.",
              "ម៉ាស៊ីនអានអក្សរ: Chakkhu ដោយ Ing Muyleang, Apache-2.0 — កំណែ ONNX ផ្លូវការ (int8) នៃម៉ូដេលអានបន្ទាត់អក្សរខ្មែរ និងអង់គ្លេស Chakkhu ដែលសរសេរចង្កោមអក្សរខ្មែរទាំងមូល និងវាយតម្លៃភាពជឿជាក់សម្រាប់បន្ទាត់នីមួយៗ។ អ្នកបង្កើតរាយការណ៍អត្រាកំហុសតួអក្សរ ៤.៥០% លើបន្ទាត់ទាំង ៤០១៨ នៃតេស្តស្តង់ដារ KHOB។ ជំហានអាន (រូបភាពបន្ទាត់ ការស្វែងរកបែប beam ដែលដាក់ពិន្ទុដោយក្បាល CTC និង decoder ការធ្វើឱ្យអក្សរខ្មែរមានទម្រង់ស្តង់ដារ) ត្រូវបានផ្ទេរពីកម្មវិធីអានគំរូរបស់អ្នកបង្កើត។ តំបន់អត្ថបទត្រូវបានរកឃើញដោយម៉ូដេលរកឃើញរបស់ KhmerOCR (Seanghay Yath, MIT)។ ម៉ូដេលទាញយកពី Hugging Face នៅពេលប្រើលើកដំបូង ហើយដំណើរការលើឧបករណ៍របស់អ្នកតាម ONNX Runtime WASM; រូបភាពមិនចាកចេញពីកម្មវិធីរុករកឡើយ។",
            )}{" "}
            <a href="https://huggingface.co/muyleanging/Chakkhu-OCR-Khmer" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">{t("Model card", "ព័ត៌មានម៉ូដេល")}</a>
            {" · "}
            <a href="https://huggingface.co/muyleanging/Chakkhu-OCR-Khmer-ONNX" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">ONNX</a>
            {" · "}
            <a href="https://muyleanging.github.io/chakkhu-web/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">{t("Website", "គេហទំព័រ")}</a>
            {" · "}
            <a href="https://huggingface.co/spaces/muyleanging/Chakkhu-OCR-Demo" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">{t("Official demo", "ការបង្ហាញផ្លូវការ")}</a>
          </p>
        ) : engineId === "kiri" ? (
          <p>{t("OCR engine: Kiri OCR by mrrtmob, Apache-2.0 (github.com/mrrtmob/kiri-ocr) - transformer encoder with CTC, trained on ~12M Khmer/English lines; exported to ONNX for the browser. Runs locally via ONNX Runtime WASM; images never leave your device.", "ម៉ាស៊ីនអានអក្សរ: Kiri OCR ដោយ mrrtmob, Apache-2.0 (github.com/mrrtmob/kiri-ocr) - transformer encoder ជាមួយ CTC បណ្តុះបណ្តាលលើ ~12M ជួរខ្មែរ/អង់គ្លេស; បម្លែងទៅ ONNX សម្រាប់កម្មវិធីរុករក។ ដំណើរការក្នុងម៉ាស៊ីនតាម ONNX Runtime WASM; រូបភាពមិនចាកចេញពីឧបករណ៍ឡើយ។")}</p>
        ) : (
          <p>{t("OCR engine: KhmerOCR by Seanghay Yath, MIT (github.com/seanghay/KhmerOCR) - detection + CRNN recognition, trained on ~3M text lines across 800+ Khmer fonts. Runs locally via ONNX Runtime WASM; images never leave your browser.", "ម៉ាស៊ីនអានអក្សរ: KhmerOCR ដោយ Seanghay Yath, MIT (github.com/seanghay/KhmerOCR) - ការរកឃើញ + CRNN recognition បណ្តុះបណ្តាលលើ ~3M ជួរអត្ថបទ ជាង 800 ពុម្ពអក្សរខ្មែរ។ ដំណើរការក្នុងម៉ាស៊ីនតាម ONNX Runtime WASM; រូបភាពមិនចាកចេញពីកម្មវិធីរុករកឡើយ។")}</p>
        )}
      </SourceCredits>
    </ToolShell>
  );
}

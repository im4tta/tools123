"use client";

// PDF Sign — draw or type a signature and place it on a PDF page.
//
// Two coordinate systems have to be reconciled. pdf.js renders a page the way a
// reader sees it (with /Rotate applied, origin top-left, y growing downwards),
// while pdf-lib draws into the unrotated page space (origin bottom-left, y
// growing upwards). `toPdfPoint` inverts the rotation so a click lands where it
// looks like it should, and the signature is drawn rotated by -R with its
// bottom-left anchor solved from the desired centre so it sits upright.
//
// The signature is a transparent PNG composed in a canvas; the PDF is rebuilt
// with pdf-lib, so the rest of the document is copied untouched. Nothing is
// uploaded — the file never leaves your browser. Original Tools123
// implementation.

import { useCallback, useMemo, useRef, useState } from "react";
import { FileUp, Download, Eraser, PenLine, Type } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { downloadBlob } from "@/lib/download";
import { recordExport } from "@/lib/export";

interface PagePreview {
  index: number; // 0-based
  url: string;
  /** Visual size in CSS px of the rendered preview (rotation already applied). */
  vw: number;
  vh: number;
}

interface Placement {
  page: number; // 0-based
  u: number; // 0..1 across the visual page
  v: number; // 0..1 down the visual page
}

const SIG_W = 640;
const SIG_H = 220;

/**
 * Map a point in the *visual* (rendered) page to unrotated PDF user space.
 * `u`/`v` are 0..1 from the visual top-left. W/H are the unrotated page size.
 */
function toPdfPoint(u: number, v: number, W: number, H: number, rotation: number) {
  const r = ((rotation % 360) + 360) % 360;
  // Visual dimensions swap on the quarter turns.
  const vw = r === 90 || r === 270 ? H : W;
  const vh = r === 90 || r === 270 ? W : H;
  const Vx = u * vw;
  const Vy = v * vh;
  switch (r) {
    case 90:
      return { x: Vy, y: Vx };
    case 180:
      return { x: W - Vx, y: Vy };
    case 270:
      return { x: W - Vy, y: H - Vx };
    default:
      return { x: Vx, y: H - Vy };
  }
}

export default function PdfSign() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState("");
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [drawnSig, setDrawnSig] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState("");
  const [sizePct, setSizePct] = useState(28);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const padRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);

  // ---- signature pad ----
  const padPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = padRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * c.width, y: ((e.clientY - rect.top) / rect.height) * c.height };
  };

  const onPadDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    padRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = padPoint(e);
  };

  const onPadMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = padRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !last.current) return;
    const p = padPoint(e);
    ctx.strokeStyle = "#111318";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  };

  const onPadUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (hasInk.current && padRef.current) setDrawnSig(padRef.current.toDataURL("image/png"));
  };

  const clearPad = () => {
    const c = padRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    hasInk.current = false;
    setDrawnSig("");
    setStatus("");
  };

  // Typed signatures render into the same kind of transparent canvas as the pad,
  // so both modes hand pdf-lib an identical PNG. Derived from the name rather
  // than stored, and guarded for SSR where there is no document to draw into.
  const typedSig = useMemo(() => {
    const name = typed.trim();
    if (mode !== "type" || !name || typeof document === "undefined") return "";
    const c = document.createElement("canvas");
    c.width = SIG_W;
    c.height = SIG_H;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#111318";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 92;
    // Shrink until the name fits the pad, so long names never clip.
    do {
      ctx.font = `italic ${size}px "Kantumruy Pro", "Noto Sans Khmer", Georgia, serif`;
      if (ctx.measureText(name).width <= SIG_W - 60) break;
      size -= 4;
    } while (size > 24);
    ctx.fillText(name, SIG_W / 2, SIG_H / 2);
    return c.toDataURL("image/png");
  }, [typed, mode]);

  const sig = mode === "draw" ? drawnSig : typedSig;

  // ---- pdf ----
  const load = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        setError(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។"));
        return;
      }
      setBusy(true);
      setError("");
      setStatus("");
      setPlacement(null);
      setPages([]);
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
        const out: PagePreview[] = [];
        const cap = Math.min(doc.numPages, 30);
        for (let i = 1; i <= cap; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(1.4, 820 / base.width) });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (ctx) await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          out.push({ index: i - 1, url: canvas.toDataURL("image/png"), vw: viewport.width, vh: viewport.height });
        }
        setFile(f);
        setPages(out);
        setInfo(
          `${doc.numPages} ${t("pages", "ទំព័រ")} · ${formatBytes(f.size)}${
            doc.numPages > cap ? ` · ${t(`first ${cap} shown`, `បង្ហាញ ${cap} ដំបូង`)}` : ""
          }`,
        );
      } catch {
        setError(t("Could not read this PDF — it may be corrupted or password-protected.", "មិនអាចអានឯកសារ PDF នេះ — វាប្រហែលខូច ឬបានការពារដោយពាក្យសម្ងាត់។"));
        setFile(null);
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const place = (e: React.MouseEvent<HTMLImageElement>, pageIndex: number) => {
    if (!sig) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPlacement({
      page: pageIndex,
      u: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      v: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    });
    setStatus("");
  };

  const exportPdf = useCallback(async () => {
    if (!file || !sig || !placement) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const page = doc.getPages()[placement.page];
      if (!page) throw new Error("page out of range");

      const png = await doc.embedPng(sig);
      const mb = page.getMediaBox();
      const W = mb.width;
      const H = mb.height;
      const rot = page.getRotation().angle;
      const r = ((rot % 360) + 360) % 360;

      // Width is a share of the page as the reader sees it.
      const visualW = r === 90 || r === 270 ? H : W;
      const w = (sizePct / 100) * visualW;
      const h = (w * png.height) / png.width;

      const c = toPdfPoint(placement.u, placement.v, W, H, r);
      // Undo the page rotation so the signature reads upright, then solve the
      // bottom-left anchor that puts the image's centre on the clicked point.
      const theta = (-r * Math.PI) / 180;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const x = mb.x + c.x - ((w / 2) * cos - (h / 2) * sin);
      const y = mb.y + c.y - ((w / 2) * sin + (h / 2) * cos);

      page.drawImage(png, { x, y, width: w, height: h, rotate: degrees(-r) });

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_signed.pdf`);
      recordExport();
      setStatus(t(`Saved — signed on page ${placement.page + 1} · ${formatBytes(blob.size)}`, `រក្សាទុករួច — ចុះហត្ថលេខាទំព័រ ${placement.page + 1} · ${formatBytes(blob.size)}`));
    } catch {
      setError(t("Could not build the signed PDF — try again or reload the source file.", "មិនអាចបង្កើត PDF ដែលចុះហត្ថលេខាបានទេ — សូមព្យាយាមម្តងទៀត។"));
    } finally {
      setBusy(false);
    }
  }, [file, sig, placement, sizePct, t]);

  return (
    <ToolShell
      title="Sign a PDF"
      khmerTitle="ចុះហត្ថលេខាលើ PDF"
      description="Add your signature to a PDF without printing it. Draw your signature with a finger or mouse — or type your name — then click the spot on the page where it belongs, size it, and download the signed file. The rest of the document is copied untouched, and nothing is ever uploaded: the file stays in your browser."
      descriptionKm="បន្ថែមហត្ថលេខារបស់អ្នកទៅលើ PDF ដោយមិនចាំបាច់បោះពុម្ព។ គូរហត្ថលេខាដោយម្រាមដៃ ឬកណ្តុរ — ឬវាយឈ្មោះរបស់អ្នក — រួចចុចលើទីតាំងក្នុងទំព័រដែលត្រូវដាក់ កំណត់ទំហំ ហើយទាញយកឯកសារដែលចុះហត្ថលេខារួច។ ផ្នែកផ្សេងទៀតនៃឯកសារត្រូវចម្លងដដែល ហើយគ្មានការផ្ទុកឡើងទេ។"
    >
      {/* 1 — signature */}
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">1. {t("Your signature", "ហត្ថលេខារបស់អ្នក")}</span>
          <div className="ml-auto inline-flex rounded-md border border-[var(--ground-line)] p-0.5">
            <button
              type="button"
              onClick={() => setMode("draw")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${mode === "draw" ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
            >
              <PenLine size={12} /> {t("Draw", "គូរ")}
            </button>
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${mode === "type" ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
            >
              <Type size={12} /> {t("Type", "វាយ")}
            </button>
          </div>
        </div>

        {mode === "draw" ? (
          <>
            <canvas
              ref={padRef}
              width={SIG_W}
              height={SIG_H}
              onPointerDown={onPadDown}
              onPointerMove={onPadMove}
              onPointerUp={onPadUp}
              onPointerLeave={onPadUp}
              className="w-full cursor-crosshair touch-none rounded-md border border-dashed border-[var(--ground-line)] bg-white"
              style={{ aspectRatio: `${SIG_W} / ${SIG_H}` }}
              aria-label={t("Signature pad", "កន្លែងគូរហត្ថលេខា")}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--ink-faint)]">{t("Draw with your finger or mouse.", "គូរដោយម្រាមដៃ ឬកណ្តុរ។")}</span>
              <button onClick={clearPad} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
                <Eraser size={12} /> {t("Clear", "សម្អាត")}
              </button>
            </div>
          </>
        ) : (
          <Field label="Your name" labelKm="ឈ្មោះរបស់អ្នក">
            <TextInput value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t("Sok Dara", "សុខ ដារ៉ា")} />
          </Field>
        )}
      </div>

      {/* 2 — document */}
      {!file ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{busy ? t("Reading…", "កំពុងអាន…") : t("2. Choose the PDF to sign", "2. ជ្រើស PDF ដែលត្រូវចុះហត្ថលេខា")}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void load(f);
                e.target.value = "";
              }}
            />
          </label>
          {error && <p className="mt-3 text-center text-sm text-[var(--danger)]">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--ink)]">{file.name}</div>
              <div className="text-xs text-[var(--ink-faint)]">{info}</div>
            </div>
            <button
              onClick={() => { setFile(null); setPages([]); setPlacement(null); setStatus(""); }}
              className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
            >
              {t("Choose another", "ជ្រើសផ្សេង")}
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[10rem] flex-1">
              <Field label="Signature width" labelKm="ទទឹងហត្ថលេខា" hint={`${sizePct}% ${t("of page", "នៃទំព័រ")}`} hintKm={`${sizePct}% នៃទំព័រ`}>
                <input
                  type="range"
                  min={8}
                  max={60}
                  value={sizePct}
                  onChange={(e) => setSizePct(Number(e.target.value))}
                  className="w-full accent-[var(--gold)]"
                  aria-label={t("Signature width", "ទទឹងហត្ថលេខា")}
                />
              </Field>
            </div>
            {pages.length > 1 && (
              <div className="min-w-[8rem]">
                <Field label="Jump to page" labelKm="ទៅកាន់ទំព័រ">
                  <Select
                    value={String(placement?.page ?? 0)}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      document.getElementById(`sign-page-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    {pages.map((p) => (
                      <option key={p.index} value={p.index}>
                        {t("Page", "ទំព័រ")} {p.index + 1}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--ink-faint)]">
            {!sig
              ? t("Draw or type your signature above first, then click where it should go.", "សូមគូរ ឬវាយហត្ថលេខាខាងលើសិន រួចចុចលើទីតាំងដែលត្រូវដាក់។")
              : placement
                ? t(`Placed on page ${placement.page + 1} — click again to move it.`, `ដាក់នៅទំព័រ ${placement.page + 1} — ចុចម្តងទៀតដើម្បីផ្លាស់ទី។`)
                : t("Click the spot on a page where the signature should go.", "ចុចលើទីតាំងក្នុងទំព័រដែលហត្ថលេខាត្រូវដាក់។")}
          </p>

          <div className="space-y-4">
            {pages.map((p) => (
              <div key={p.index} id={`sign-page-${p.index}`} className="flex flex-col items-center gap-1">
                <div className="relative inline-block max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={t(`Page ${p.index + 1}`, `ទំព័រ ${p.index + 1}`)}
                    onClick={(e) => place(e, p.index)}
                    className={`block max-h-[34rem] w-auto max-w-full rounded-md border border-[var(--ground-line)] bg-white ${sig ? "cursor-crosshair" : ""}`}
                  />
                  {placement?.page === p.index && sig && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sig}
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${placement.u * 100}%`, top: `${placement.v * 100}%`, width: `${sizePct}%` }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-[var(--ink-faint)]">
                  {t("Page", "ទំព័រ")} {p.index + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={exportPdf} disabled={busy || !sig || !placement} className="inline-flex items-center gap-2">
              <Download size={15} />
              {busy ? t("Working…", "កំពុងដំណើរការ…") : t("Download signed PDF", "ទាញយក PDF ចុះហត្ថលេខា")}
            </Button>
            {status && <span className="text-xs text-[var(--ink-dim)]">{status}</span>}
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Page rendering: pdf.js (Apache-2.0, Mozilla). Signing: pdf-lib (MIT).", "ការបង្ហាញទំព័រ: pdf.js (Apache-2.0, Mozilla)។ ការចុះហត្ថលេខា: pdf-lib (MIT)។")}</li>
          <li>{t("Signature pad, placement and rotation handling are an original Tools123 implementation.", "កន្លែងគូរហត្ថលេខា ការដាក់ទីតាំង និងការគ្រប់គ្រងការបង្វិល ជាការសរសេរដើមរបស់ Tools123។")}</li>
          <li>
            {t(
              "This stamps a visible signature image onto the page. It is not a cryptographic digital signature and does not certify the document.",
              "ឧបករណ៍នេះបិទរូបហត្ថលេខាដែលមើលឃើញលើទំព័រ។ វាមិនមែនជាហត្ថលេខាឌីជីថលតាមគ្រីបតូ ហើយមិនបញ្ជាក់សុពលភាពឯកសារទេ។",
            )}
          </li>
          <li>{t("Files are processed locally and never uploaded.", "ឯកសារដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

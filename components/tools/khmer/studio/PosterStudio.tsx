"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Align,
  generatePosterPdf,
  POSTER_SIZES,
  POSTER_SWATCHES,
} from "@/lib/studio/generatePoster";
import { STUDIO_FONTS, getStudioFont } from "@/lib/studio/pdfShared";
import { useToolState } from "@/lib/storage";

const DEFAULTS = {
  headline: "រស់រវើក",
  subline: "Type design for the Khmer script, instanced live.",
  caption: "Kantumruy Pro — Variable",
};

const WEIGHT_LABELS: [number, string][] = [
  [100, "Thin"],
  [300, "Light"],
  [400, "Regular"],
  [500, "Medium"],
  [700, "Bold"],
];

export default function PosterStudio() {
  const [headline, setHeadline] = useToolState("khmer-studio:poster:headline", DEFAULTS.headline);
  const [subline, setSubline] = useToolState("khmer-studio:poster:subline", DEFAULTS.subline);
  const [caption, setCaption] = useToolState("khmer-studio:poster:caption", DEFAULTS.caption);
  const [weight, setWeight] = useToolState("khmer-studio:poster:weight", 600);
  const [align, setAlign] = useToolState<Align>("khmer-studio:poster:align", "left");
  const [sizeId, setSizeId] = useToolState("khmer-studio:poster:size", POSTER_SIZES[0].id);
  const [fontId, setFontId] = useToolState("khmer-studio:font", "kantumruy");
  const [paperHex, setPaperHex] = useToolState("khmer-studio:poster:paper", POSTER_SWATCHES[0].paper);
  const [inkHex, setInkHex] = useToolState("khmer-studio:poster:ink", POSTER_SWATCHES[0].ink);
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const size = useMemo(
    () => POSTER_SIZES.find((s) => s.id === sizeId) ?? POSTER_SIZES[0],
    [sizeId],
  );
  const font = useMemo(() => getStudioFont(fontId), [fontId]);

  function applySwatch(id: string) {
    const s = POSTER_SWATCHES.find((sw) => sw.id === id) ?? POSTER_SWATCHES[0];
    setPaperHex(s.paper);
    setInkHex(s.ink);
  }

  // Live PDF preview — regenerated (debounced) whenever any setting changes.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setRendering(true);
      generatePosterPdf({
        headline,
        subline,
        caption,
        weight,
        align,
        size,
        fontId,
        paper: paperHex,
        ink: inkHex,
      })
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          setPdfUrl(url);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setRendering(false);
        });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [headline, subline, caption, weight, align, size, fontId, paperHex, inkHex]);

  useEffect(() => () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
  }, []);

  const aspect = size.widthPt / size.heightPt;
  const weightLabel =
    WEIGHT_LABELS.slice().reverse().find(([w]) => weight >= w)?.[1] ?? "Thin";

  async function handleExport() {
    setStatus("working");
    setErrorMsg("");
    try {
      const blob = await generatePosterPdf({
        headline,
        subline,
        caption,
        weight,
        align,
        size,
        fontId,
        paper: paperHex,
        ink: inkHex,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(headline || "poster").trim().slice(0, 40) || "poster"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Export failed.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Controls */}
      <aside className="w-full shrink-0 border-b border-ink-800 bg-ink-900 px-6 py-8 lg:h-full lg:w-[400px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-8">
          <Field label="Headline">
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-none border border-ink-700 bg-ink-950 px-3 py-2 font-[family-name:var(--font-display)] text-lg text-bone outline-none focus:border-gold"
              placeholder="Poster headline"
            />
          </Field>

          <Field label="Subline">
            <input
              value={subline}
              onChange={(e) => setSubline(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-bone outline-none focus:border-gold"
              placeholder="Optional supporting line"
            />
          </Field>

          <Field label="Caption">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 font-[family-name:var(--font-mono)] text-xs tracking-wide text-bone outline-none focus:border-gold"
              placeholder="Optional colophon line"
            />
          </Field>

          <Field label="Font">
            <select
              value={fontId}
              onChange={(e) => {
                setFontId(e.target.value);
                const f = getStudioFont(e.target.value);
                setWeight(f.defaultWeight);
              }}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-bone outline-none focus:border-gold"
            >
              {STUDIO_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                  {f.kind === "variable" ? " (variable)" : ""}
                </option>
              ))}
            </select>
          </Field>

          {/* Signature control: live variable-weight scrubber */}
          <Field
            label="Weight"
            trailing={
              <span className="font-[family-name:var(--font-mono)] text-xs text-gold">
                {font.kind === "static" ? "static" : `${weightLabel} · ${weight}`}
              </span>
            }
          >
            <input
              type="range"
              min={font.min}
              max={font.max}
              step={1}
              value={Math.min(weight, font.max)}
              onChange={(e) => setWeight(Number(e.target.value))}
              disabled={font.kind === "static"}
              className="w-full disabled:opacity-40"
            />
            {font.kind === "variable" && (
              <div className="mt-1 flex justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-faint">
                {WEIGHT_LABELS.filter(([w]) => w >= font.min && w <= font.max).map(([w, label]) => (
                  <span key={w}>{label}</span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Alignment">
            <div className="flex border border-ink-700">
              {(["left", "center", "right"] as Align[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAlign(a)}
                  className={`flex-1 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest transition-colors ${
                    align === a
                      ? "bg-gold text-ink-950"
                      : "text-bone-dim hover:text-bone"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Palette">
            <div className="flex gap-2">
              {POSTER_SWATCHES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applySwatch(s.id)}
                  title={s.label}
                  className={`h-10 w-10 border-2 transition-transform ${
                    paperHex.toLowerCase() === s.paper.toLowerCase()
                      ? "scale-110 border-gold"
                      : "border-ink-700 hover:border-bone-faint"
                  }`}
                  style={{ backgroundColor: s.paper }}
                >
                  <span
                    className="block h-2 w-full"
                    style={{ backgroundColor: s.ink }}
                  />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-dim">
                Paper
                <input type="color" value={paperHex} onChange={(e) => setPaperHex(e.target.value)} className="h-7 w-10 cursor-pointer border border-ink-700 bg-transparent" />
              </label>
              <label className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-dim">
                Ink
                <input type="color" value={inkHex} onChange={(e) => setInkHex(e.target.value)} className="h-7 w-10 cursor-pointer border border-ink-700 bg-transparent" />
              </label>
            </div>
          </Field>

          <Field label="Format">
            <div className="grid grid-cols-2 gap-2">
              {POSTER_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSizeId(s.id)}
                  className={`border px-3 py-2 text-left font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide transition-colors ${
                    sizeId === s.id
                      ? "border-gold text-gold"
                      : "border-ink-700 text-bone-dim hover:border-bone-faint"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={handleExport}
            disabled={status === "working"}
            className="mt-2 border border-lacquer bg-lacquer px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone transition-colors hover:bg-lacquer-bright disabled:cursor-wait disabled:opacity-70"
          >
            {status === "working" ? "Rendering PDF…" : "Download PDF"}
          </button>
          {status === "error" && (
            <p className="text-xs text-lacquer-bright">{errorMsg}</p>
          )}
          <p className="font-[family-name:var(--font-mono)] text-[10px] leading-relaxed text-bone-faint">
            Rendered in your browser with HappyPDF — the font is instanced at
            the exact weight shown, glyph outlines and all, then embedded
            straight into the PDF. No server round-trip.
          </p>
        </div>
      </aside>

      {/* Live PDF preview */}
      <main className="flex flex-1 flex-col items-center gap-3 overflow-auto bg-ink-950 p-6 lg:p-14">
        <div className="flex w-full items-center justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-faint">
          <span>Live PDF preview</span>
          <span>{rendering ? "rendering…" : `aspect ${aspect.toFixed(2)}`}</span>
        </div>
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&view=FitH`}
            title="Poster PDF preview"
            className="w-full flex-1 rounded-lg border border-ink-800 bg-ink-900"
            style={{ minHeight: "70vh" }}
          />
        ) : (
          <div className="flex h-[70vh] w-full items-center justify-center rounded-lg border border-ink-800 text-sm text-bone-faint">
            Rendering first preview…
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-bone-dim">
          {label}
        </span>
        {trailing}
      </div>
      {children}
    </div>
  );
}
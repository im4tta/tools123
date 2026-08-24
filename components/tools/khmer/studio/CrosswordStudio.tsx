"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateCrossword, type CrosswordEntry } from "@/lib/studio/crossword";
import {
  generateCrosswordAnswerPdf,
  generateCrosswordPuzzlePdf,
} from "@/lib/studio/generateCrossword";
import { POSTER_SWATCHES } from "@/lib/studio/generatePoster";
import { STUDIO_FONTS } from "@/lib/studio/pdfShared";
import { useToolState } from "@/lib/storage";

const DEFAULT_INPUT = `ភ្នំពេញ :: Capital city, on the Mekong
កំពង់ចាម :: Province, an old French bridge town
កំពង់ធំ :: Province whose name means "big port"
កំពង់ស្ពឺ :: Province between the capital and the coast
កំពត :: Province famous for its pepper
សៀមរាប :: Gateway to Angkor
តាកែវ :: Province south of the capital
ស្វាយរៀង :: Border province toward Vietnam
ភ្នំ :: Word for "mountain"`;

function parseInput(raw: string): CrosswordEntry[] {
  return raw
    .split("\n")
    .map((line) => {
      const [text, ...rest] = line.split("::");
      return { text: (text ?? "").trim(), clue: rest.join("::").trim() };
    })
    .filter((e) => e.text.length > 0);
}

export default function CrosswordStudio() {
  const [title, setTitle] = useToolState("khmer-studio:crossword:title", "ល្បែងអូសអក្សរ — Animals");
  const [raw, setRaw] = useToolState("khmer-studio:crossword:input", DEFAULT_INPUT);
  const [swatchId, setSwatchId] = useToolState("khmer-studio:crossword:swatch", POSTER_SWATCHES[0].id);
  const [fontId, setFontId] = useToolState("khmer-studio:font", "kantumruy");
  const [showAnswers, setShowAnswers] = useState(false);
  const [status, setStatus] = useState<"idle" | "puzzle" | "answer" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const entries = useMemo(() => parseInput(raw), [raw]);
  const grid = useMemo(() => generateCrossword(entries), [entries]);
  const swatch = useMemo(
    () => POSTER_SWATCHES.find((s) => s.id === swatchId) ?? POSTER_SWATCHES[0],
    [swatchId],
  );

  // Live PDF preview — regenerated (debounced) whenever any setting changes.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (grid.words.length === 0) {
        setPdfUrl(null);
        return;
      }
      setRendering(true);
      generateCrosswordPuzzlePdf(grid, { title, fontId, paper: swatch.paper, ink: swatch.ink })
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
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [grid, title, fontId, swatch]);

  useEffect(() => () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
  }, []);

  async function handleExport(kind: "puzzle" | "answer") {
    setStatus(kind);
    setErrorMsg("");
    try {
      const meta = { title, fontId, paper: swatch.paper, ink: swatch.ink };
      const blob =
        kind === "puzzle"
          ? await generateCrosswordPuzzlePdf(grid, meta)
          : await generateCrosswordAnswerPdf(grid, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.trim() || "crossword"}${kind === "answer" ? "-answers" : ""}.pdf`;
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
      <aside className="w-full shrink-0 border-b border-ink-800 bg-ink-900 px-6 py-8 lg:h-full lg:w-[420px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-8">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 font-[family-name:var(--font-display)] text-base text-bone outline-none focus:border-gold"
            />
          </Field>

          <Field
            label="Words & clues"
            trailing={
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-bone-faint">
                one per line — word :: clue
              </span>
            }
          >
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={10}
              className="w-full resize-y rounded-none border border-ink-700 bg-ink-950 px-3 py-2 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-bone outline-none focus:border-gold"
              spellCheck={false}
            />
          </Field>

          <Field label="Font">
            <select
              value={fontId}
              onChange={(e) => setFontId(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-bone outline-none focus:border-gold"
            >
              {STUDIO_FONTS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Palette">
            <div className="flex gap-2">
              {POSTER_SWATCHES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSwatchId(s.id)}
                  title={s.label}
                  className={`h-10 w-10 border-2 transition-transform ${
                    swatchId === s.id
                      ? "scale-110 border-gold"
                      : "border-ink-700 hover:border-bone-faint"
                  }`}
                  style={{ backgroundColor: s.paper }}
                >
                  <span className="block h-2 w-full" style={{ backgroundColor: s.ink }} />
                </button>
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-bone-dim">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={(e) => setShowAnswers(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--gold)]"
            />
            Show letters in preview
          </label>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleExport("puzzle")}
              disabled={status === "puzzle" || grid.words.length === 0}
              className="border border-lacquer bg-lacquer px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone transition-colors hover:bg-lacquer-bright disabled:cursor-wait disabled:opacity-70"
            >
              {status === "puzzle" ? "Rendering…" : "Download puzzle PDF"}
            </button>
            <button
              onClick={() => handleExport("answer")}
              disabled={status === "answer" || grid.words.length === 0}
              className="border border-ink-700 px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone-dim transition-colors hover:border-gold hover:text-gold disabled:cursor-wait disabled:opacity-70"
            >
              {status === "answer" ? "Rendering…" : "Download answer key PDF"}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-lacquer-bright">{errorMsg}</p>}

          <p className="font-[family-name:var(--font-mono)] text-[10px] leading-relaxed text-bone-faint">
            Words are placed on intersections where possible — a whole
            stacked syllable (base + subscript + vowel) is one placeable
            unit, since it can&apos;t be split across cells. Words that don&apos;t
            intersect anything get their own row, so every word still
            appears.
          </p>
        </div>
      </aside>

      {/* Live PDF preview */}
      <main className="flex flex-1 flex-col items-center gap-3 overflow-auto bg-ink-950 p-4 sm:p-6 lg:p-14">
        <div className="flex w-full items-center justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-faint">
          <span>Live PDF preview</span>
          <span>{rendering ? "rendering…" : `${grid.words.length} words`}</span>
        </div>
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&view=FitH`}
            title="Crossword PDF preview"
            className="h-[420px] w-full max-w-full rounded-lg border border-ink-800 bg-ink-900 sm:h-[560px] lg:h-[calc(100dvh-18rem)] lg:min-h-[520px]"
            style={{ minHeight: "70vh" }}
          />
        ) : (
          <div className="flex h-[70vh] w-full items-center justify-center rounded-lg border border-ink-800 text-sm text-bone-faint">
            Add at least two words that share a letter to build a grid.
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
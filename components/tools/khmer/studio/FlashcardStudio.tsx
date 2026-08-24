"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateFlashcardsBackPdf,
  generateFlashcardsFrontPdf,
} from "@/lib/studio/generateFlashcards";
import { POSTER_SWATCHES } from "@/lib/studio/generatePoster";
import { STUDIO_FONTS, getStudioFont } from "@/lib/studio/pdfShared";
import { WORD_BANKS } from "@/lib/studio/wordBanks";
import { useToolState } from "@/lib/storage";

const DEFAULT_INPUT = `ក្រហម :: Red
លឿង :: Yellow
ខៀវ :: Blue
បៃតង :: Green
ស :: White
ខ្មៅ :: Black
ទឹកក្រូច :: Orange
ស្វាយ :: Purple`;

function parseInput(raw: string) {
  return raw
    .split("\n")
    .map((line) => {
      const [front, ...rest] = line.split("::");
      return { front: (front ?? "").trim(), back: rest.join("::").trim() };
    })
    .filter((c) => c.front.length > 0);
}

function bankToLines(entries: { text: string; clue: string }[]) {
  return entries.map((e) => `${e.text} :: ${e.clue}`).join("\n");
}

export default function FlashcardStudio() {
  const [title, setTitle] = useToolState("khmer-studio:flashcards:title", "Colors");
  const [raw, setRaw] = useToolState("khmer-studio:flashcards:input", DEFAULT_INPUT);
  const [weight, setWeight] = useToolState("khmer-studio:flashcards:weight", 650);
  const [fontId, setFontId] = useToolState("khmer-studio:font", "kantumruy");
  const [swatchId, setSwatchId] = useToolState("khmer-studio:flashcards:swatch", POSTER_SWATCHES[0].id);
  const [bankId, setBankId] = useToolState("khmer-studio:flashcards:bank", WORD_BANKS[0].id);
  const [status, setStatus] = useState<"idle" | "front" | "back" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  function loadBank(replace: boolean) {
    const bank = WORD_BANKS.find((b) => b.id === bankId);
    if (!bank) return;
    const lines = bankToLines(bank.entries);
    setRaw(replace || !raw.trim() ? lines : `${raw}\n${lines}`);
  }

  const cards = useMemo(() => parseInput(raw), [raw]);
  const font = useMemo(() => getStudioFont(fontId), [fontId]);
  const swatch = useMemo(
    () => POSTER_SWATCHES.find((s) => s.id === swatchId) ?? POSTER_SWATCHES[0],
    [swatchId],
  );
  const pageCount = Math.ceil(cards.length / 12) || 1;

  // Live PDF preview — regenerated (debounced) whenever any setting changes.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cards.length === 0) {
        setPdfUrl(null);
        return;
      }
      setRendering(true);
      generateFlashcardsFrontPdf(cards, { title, fontId, paper: swatch.paper, ink: swatch.ink, weight })
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
  }, [cards, title, fontId, swatch, weight]);

  useEffect(() => () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
  }, []);

  async function handleExport(side: "front" | "back") {
    setStatus(side);
    setErrorMsg("");
    try {
      const meta = { title, fontId, paper: swatch.paper, ink: swatch.ink, weight };
      const blob =
        side === "front"
          ? await generateFlashcardsFrontPdf(cards, meta)
          : await generateFlashcardsBackPdf(cards, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.trim() || "flashcards"}-${side}.pdf`;
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
          <Field label="Deck title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-base text-bone outline-none focus:border-gold"
            />
          </Field>

          <Field label="Word bank">
            <div className="flex gap-2">
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="flex-1 rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-bone outline-none focus:border-gold"
              >
                {WORD_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} ({b.entries.length})
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadBank(false)}
                className="border border-ink-700 px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-bone-dim hover:border-gold hover:text-gold"
              >
                Add
              </button>
              <button
                onClick={() => loadBank(true)}
                className="border border-ink-700 px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-bone-dim hover:border-gold hover:text-gold"
              >
                Replace
              </button>
            </div>
          </Field>

          <Field
            label="Cards"
            trailing={
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-bone-faint">
                one per line — front :: back
              </span>
            }
          >
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={12}
              className="w-full resize-y rounded-none border border-ink-700 bg-ink-950 px-3 py-2 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-bone outline-none focus:border-gold"
              spellCheck={false}
            />
          </Field>

          <Field label="Font">
            <select
              value={fontId}
              onChange={(e) => {
                setFontId(e.target.value);
                setWeight(getStudioFont(e.target.value).defaultWeight);
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

          <Field
            label="Font weight"
            trailing={
              <span className="font-[family-name:var(--font-mono)] text-xs text-gold">
                {font.kind === "static" ? "static" : weight}
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

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleExport("front")}
              disabled={status === "front" || cards.length === 0}
              className="border border-lacquer bg-lacquer px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone transition-colors hover:bg-lacquer-bright disabled:cursor-wait disabled:opacity-70"
            >
              {status === "front" ? "Rendering…" : "Download fronts PDF"}
            </button>
            <button
              onClick={() => handleExport("back")}
              disabled={status === "back" || cards.length === 0}
              className="border border-ink-700 px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone-dim transition-colors hover:border-gold hover:text-gold disabled:cursor-wait disabled:opacity-70"
            >
              {status === "back" ? "Rendering…" : "Download backs PDF"}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-lacquer-bright">{errorMsg}</p>}

          <p className="font-[family-name:var(--font-mono)] text-[10px] leading-relaxed text-bone-faint">
            {cards.length} card{cards.length === 1 ? "" : "s"} · {pageCount} page
            {pageCount === 1 ? "" : "s"} of 12. The backs deck mirrors column
            order per row, so a duplex print with &quot;flip on long edge&quot;
            lines each back up with its front — check one test page before
            printing a full deck.
          </p>
        </div>
      </aside>

      {/* Live PDF preview */}
      <main className="flex flex-1 flex-col items-center gap-3 overflow-auto bg-ink-950 p-4 sm:p-6 lg:p-14">
        <div className="flex w-full items-center justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-faint">
          <span>Live PDF preview</span>
          <span>{rendering ? "rendering…" : `${cards.length} cards`}</span>
        </div>
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&view=FitH`}
            title="Flashcards PDF preview"
            className="h-[420px] w-full max-w-full rounded-lg border border-ink-800 bg-ink-900 sm:h-[560px] lg:h-[calc(100dvh-18rem)] lg:min-h-[520px]"
            style={{ minHeight: "70vh" }}
          />
        ) : (
          <div className="flex h-[70vh] w-full items-center justify-center rounded-lg border border-ink-800 text-sm text-bone-faint">
            Add at least one card to see the deck.
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

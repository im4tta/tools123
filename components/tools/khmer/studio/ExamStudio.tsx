"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mulberry32, parseExam, shuffleOptions, type ExamQuestion } from "@/lib/studio/exam";
import { generateExamAnswerKeyPdf, generateExamPdf } from "@/lib/studio/generateExam";
import { POSTER_SWATCHES } from "@/lib/studio/generatePoster";
import { STUDIO_FONTS } from "@/lib/studio/pdfShared";
import { useToolState } from "@/lib/storage";

const DEFAULT_INPUT = `Q: What is the capital of Cambodia?
A) Siem Reap
B) Phnom Penh
C) Battambang
D) Sihanoukville
Answer: B

Q: The Tonlé Sap is Southeast Asia's largest what?
A) Mountain
B) Desert
C) Freshwater lake
D) Waterfall
Answer: C

Q: Name three provinces of Cambodia.
Answer: Any three — e.g. Kampot, Siem Reap, Battambang
[lines: 3]

Q: Angkor Wat was originally built as a temple dedicated to which religion?
A) Buddhism
B) Hinduism
C) Islam
D) Taoism
Answer: B

Q: Briefly explain why the Tonlé Sap river reverses its flow each year.
[lines: 4]`;

export default function ExamStudio() {
  const [title, setTitle] = useToolState("khmer-studio:exam:title", "Cambodia — General Knowledge Quiz");
  const [subtitle, setSubtitle] = useToolState("khmer-studio:exam:subtitle", "Grade 5 · Social Studies");
  const [raw, setRaw] = useToolState("khmer-studio:exam:input", DEFAULT_INPUT);
  const [swatchId, setSwatchId] = useToolState("khmer-studio:exam:swatch", POSTER_SWATCHES[0].id);
  const [fontId, setFontId] = useToolState("khmer-studio:font", "kantumruy");
  const [shuffleSeed, setShuffleSeed] = useToolState<number | null>("khmer-studio:exam:seed", null);
  const [status, setStatus] = useState<"idle" | "exam" | "answer" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const parsed = useMemo(() => parseExam(raw), [raw]);
  const questions: ExamQuestion[] = useMemo(() => {
    if (shuffleSeed === null) return parsed;
    const rng = mulberry32(shuffleSeed);
    return parsed.map((q) => shuffleOptions(q, rng));
  }, [parsed, shuffleSeed]);

  const swatch = useMemo(
    () => POSTER_SWATCHES.find((s) => s.id === swatchId) ?? POSTER_SWATCHES[0],
    [swatchId],
  );

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const shortCount = questions.length - mcqCount;

  // Live PDF preview — regenerated (debounced) whenever any setting changes.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (questions.length === 0) {
        setPdfUrl(null);
        return;
      }
      setRendering(true);
      generateExamPdf(questions, { title, subtitle, fontId, paper: swatch.paper, ink: swatch.ink })
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
  }, [questions, title, subtitle, fontId, swatch]);

  useEffect(() => () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
  }, []);

  async function handleExport(kind: "exam" | "answer") {
    setStatus(kind);
    setErrorMsg("");
    try {
      const meta = { title, subtitle, fontId, paper: swatch.paper, ink: swatch.ink };
      const blob =
        kind === "exam"
          ? await generateExamPdf(questions, meta)
          : await generateExamAnswerKeyPdf(questions, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.trim() || "exam"}${kind === "answer" ? "-answer-key" : ""}.pdf`;
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
      <aside className="w-full shrink-0 border-b border-ink-800 bg-ink-900 px-6 py-8 lg:h-full lg:w-[440px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-8">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-base text-bone outline-none focus:border-gold"
            />
          </Field>

          <Field label="Subtitle">
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-none border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-bone outline-none focus:border-gold"
              placeholder="Class, subject, term…"
            />
          </Field>

          <Field
            label="Questions"
            trailing={
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-bone-faint">
                syntax ↓
              </span>
            }
          >
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={16}
              className="w-full resize-y rounded-none border border-ink-700 bg-ink-950 px-3 py-2 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-bone outline-none focus:border-gold"
              spellCheck={false}
            />
            <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] leading-relaxed text-bone-faint">
              Blank line between questions. <br />
              <span className="text-bone-dim">Q:</span> prompt ·{" "}
              <span className="text-bone-dim">A)</span> option (repeat for
              multiple choice) · <span className="text-bone-dim">Answer:</span>{" "}
              correct letter or text · <span className="text-bone-dim">
                [lines: N]
              </span>{" "}
              blank lines for a written answer (no options = short answer).
            </p>
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

          <Field
            label="Variant"
            trailing={
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-bone-faint">
                {shuffleSeed === null ? "original order" : `seed ${shuffleSeed}`}
              </span>
            }
          >
            <div className="flex gap-2">
              <button
                onClick={() => setShuffleSeed(Math.floor(Math.random() * 100000))}
                className="flex-1 border border-ink-700 px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-bone-dim hover:border-gold hover:text-gold"
              >
                Shuffle options
              </button>
              <button
                onClick={() => setShuffleSeed(null)}
                className="border border-ink-700 px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-bone-dim hover:border-gold hover:text-gold"
              >
                Reset
              </button>
            </div>
          </Field>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleExport("exam")}
              disabled={status === "exam" || questions.length === 0}
              className="border border-lacquer bg-lacquer px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone transition-colors hover:bg-lacquer-bright disabled:cursor-wait disabled:opacity-70"
            >
              {status === "exam" ? "Rendering…" : "Download exam PDF"}
            </button>
            <button
              onClick={() => handleExport("answer")}
              disabled={status === "answer" || questions.length === 0}
              className="border border-ink-700 px-5 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-bone-dim transition-colors hover:border-gold hover:text-gold disabled:cursor-wait disabled:opacity-70"
            >
              {status === "answer" ? "Rendering…" : "Download answer key PDF"}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-lacquer-bright">{errorMsg}</p>}
        </div>
      </aside>

      {/* Live PDF preview */}
      <main className="flex flex-1 flex-col items-center gap-3 overflow-auto bg-ink-950 p-6 lg:p-14">
        <div className="flex w-full items-center justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-bone-faint">
          <span>Live PDF preview</span>
          <span>{rendering ? "rendering…" : `${mcqCount} MCQ · ${shortCount} short answer`}</span>
        </div>
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&view=FitH`}
            title="Exam PDF preview"
            className="w-full flex-1 rounded-lg border border-ink-800 bg-ink-900"
            style={{ minHeight: "70vh" }}
          />
        ) : (
          <div className="flex h-[70vh] w-full items-center justify-center rounded-lg border border-ink-800 text-sm text-bone-faint">
            Add at least one question to see the paper.
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
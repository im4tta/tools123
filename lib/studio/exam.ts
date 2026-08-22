export interface ExamOption {
  label: string; // A, B, C, D...
  text: string;
}

export interface ExamQuestion {
  prompt: string;
  type: "mcq" | "short";
  options: ExamOption[];
  correctLabel?: string; // for mcq
  answerText?: string; // for short answer
  lines: number; // blank lines to draw for short answer
}

const LETTERS = "ABCDEFGH".split("");

/**
 * Markup:
 *   Q: question text
 *   A) option text          (repeat for each option — makes it MCQ)
 *   Answer: A                (optional, marks correct option / short answer text)
 *   [lines: 3]                (optional, short-answer only — blank lines to draw)
 *
 * Blocks are separated by one or more blank lines. A question with no
 * A)/B)/... option lines is treated as short-answer.
 */
export function parseExam(raw: string): ExamQuestion[] {
  const blocks = raw
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const questions: ExamQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let prompt = lines[0].replace(/^Q:\s*/i, "").replace(/^\d+[.)]\s*/, "");
    const options: ExamOption[] = [];
    let answerRaw: string | undefined;
    let lineCount = 2;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^([A-Ha-h])\)\s*(.+)$/);
      const answerMatch = line.match(/^Answer:\s*(.+)$/i);
      const linesMatch = line.match(/^\[lines:\s*(\d+)\]$/i);

      if (optMatch) {
        options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      } else if (answerMatch) {
        answerRaw = answerMatch[1].trim();
      } else if (linesMatch) {
        lineCount = Math.max(1, parseInt(linesMatch[1], 10));
      } else {
        // Continuation of the prompt (wrapped in the textarea).
        prompt += " " + line;
      }
    }

    if (options.length > 0) {
      const correctLabel = answerRaw
        ? answerRaw.toUpperCase().replace(/[^A-H]/g, "").slice(0, 1) || undefined
        : undefined;
      questions.push({
        prompt,
        type: "mcq",
        options,
        correctLabel: correctLabel || undefined,
        lines: 0,
      });
    } else {
      questions.push({
        prompt,
        type: "short",
        options: [],
        answerText: answerRaw,
        lines: lineCount,
      });
    }
  }

  return questions;
}

/** Returns a new shuffled option order for a question, remapped to A/B/C/D
 *  labels, with the correct label following the option it was attached to. */
export function shuffleOptions(q: ExamQuestion, rng: () => number): ExamQuestion {
  if (q.type !== "mcq" || q.options.length === 0) return q;
  const correctText = q.options.find((o) => o.label === q.correctLabel)?.text;
  const shuffled = [...q.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const relabeled = shuffled.map((o, i) => ({ ...o, label: LETTERS[i] }));
  const newCorrect = relabeled.find((o) => o.text === correctText)?.label;
  return { ...q, options: relabeled, correctLabel: newCorrect };
}

/** Small seeded RNG so "shuffle" is reproducible until the user reshuffles. */
export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

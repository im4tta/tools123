"use client";
import { useMemo, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Pill, PillGroup } from "@/components/ui/Pill";
import { useToolState } from "@/lib/storage";

const KH = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => (d === "-" ? "-" : KH[Number(d)])).join("");

type Op = "add" | "sub" | "mul" | "div" | "mixed";
const OP_SIGN: Record<Exclude<Op, "mixed">, string> = { add: "+", sub: "−", mul: "×", div: "÷" };

// Small deterministic PRNG so a fixed initial seed renders the same on server and client.
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Problem = { a: number; b: number; op: Exclude<Op, "mixed">; answer: number };

function makeProblem(rand: () => number, op: Op, max: number): Problem {
  const pick: Exclude<Op, "mixed"> = op === "mixed" ? (["add", "sub", "mul", "div"] as const)[Math.floor(rand() * 4)] : op;
  const r = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  if (pick === "add") { const a = r(0, max), b = r(0, max); return { a, b, op: pick, answer: a + b }; }
  if (pick === "sub") { const a = r(0, max), b = r(0, a); return { a, b, op: pick, answer: a - b }; }
  if (pick === "mul") { const cap = Math.min(max, 12); const a = r(1, cap), b = r(1, cap); return { a, b, op: pick, answer: a * b }; }
  const cap = Math.min(max, 12); const d = r(2, cap), q = r(1, cap); return { a: d * q, b: d, op: "div", answer: q };
}

export default function KhmerMathWorksheet() {
  const { text: t } = useLanguage();
  const [op, setOp] = useToolState<Op>("khmer-math:op", "add");
  const [max, setMax] = useToolState("khmer-math:max", "20");
  const [count, setCount] = useToolState("khmer-math:count", "20");
  const [showAnswers, setShowAnswers] = useToolState("khmer-math:answers", false);
  const [seed, setSeed] = useState(1);

  const problems = useMemo(() => {
    const rand = mulberry32(seed * 2654435761 + (op.length << 8) + Number(max) * 31 + Number(count));
    const n = Math.max(1, Math.min(60, Number(count) || 20));
    const m = Math.max(1, Math.min(999, Number(max) || 20));
    return Array.from({ length: n }, () => makeProblem(rand, op, m));
  }, [op, max, count, seed]);

  return (
    <ToolShell
      title="Khmer Math Worksheet Generator"
      khmerTitle="ឧបករណ៍បង្កើតលំហាត់គណិតជាលេខខ្មែរ"
      description="Generate printable arithmetic practice sheets written in Khmer numerals (០–៩) — addition, subtraction, multiplication, division, or a mix. Set the number range and how many problems, flip to an answer key, and print. Made for Cambodian teachers and parents; everything is generated in your browser."
      descriptionKm="បង្កើតសន្លឹកលំហាត់គណិតសម្រាប់បោះពុម្ព សរសេរជាលេខខ្មែរ (០–៩) — បូក ដក គុណ ចែក ឬលាយ។ កំណត់ជួរលេខ និងចំនួនលំហាត់ បើកមើលកន្លែងចម្លើយ ហើយបោះពុម្ព។ ធ្វើឡើងសម្រាប់គ្រូ និងឪពុកម្តាយខ្មែរ។ អ្វីៗបង្កើតក្នុងកម្មវិធីរុករក។"
    >
      <PillGroup label={t("Operation", "ប្រមាណវិធី")}>
        {([["add", "Addition (+)", "បូក (+)"], ["sub", "Subtraction (−)", "ដក (−)"], ["mul", "Multiplication (×)", "គុណ (×)"], ["div", "Division (÷)", "ចែក (÷)"], ["mixed", "Mixed", "លាយ"]] as const).map(([id, en, km]) => (
          <Pill key={id} active={op === id} onClick={() => setOp(id)}>{t(en, km)}</Pill>
        ))}
      </PillGroup>
      <PillGroup label={t("Number range (max)", "ជួរលេខ (អតិបរមា)")}>
        {([["10", "0–10", "០–១០"], ["20", "0–20", "០–២០"], ["50", "0–50", "០–៥០"], ["100", "0–100", "០–១០០"]] as const).map(([id, en, km]) => (
          <Pill key={id} active={max === id} onClick={() => setMax(id)}>{t(en, km)}</Pill>
        ))}
      </PillGroup>
      <PillGroup label={t("Problems", "ចំនួនលំហាត់")}>
        {([["12", "12", "១២"], ["20", "20", "២០"], ["30", "30", "៣០"], ["40", "40", "៤០"]] as const).map(([id, en, km]) => (
          <Pill key={id} active={count === id} onClick={() => setCount(id)}>{t(en, km)}</Pill>
        ))}
      </PillGroup>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <RefreshCw size={13} />{t("Regenerate", "បង្កើតឡើងវិញ")}
        </button>
        <button type="button" onClick={() => setShowAnswers((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${showAnswers ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
          {t("Show answers", "បង្ហាញចម្លើយ")}
        </button>
        <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <Printer size={13} />{t("Print", "បោះពុម្ព")}
        </button>
      </div>

      <div id="khmer-worksheet-print" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--ground-line)] pb-3 text-xs text-[var(--ink-dim)]">
          <span>{t("Name", "ឈ្មោះ")}: ____________________</span>
          <span>{t("Date", "កាលបរិច្ឆេទ")}: __________</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 font-khmer sm:grid-cols-3">
          {problems.map((p, i) => (
            <div key={i} className="flex items-baseline gap-2 text-lg text-[var(--ink)]">
              <span className="w-6 shrink-0 text-xs text-[var(--ink-faint)]">{toKh(i + 1)}.</span>
              <span>{toKh(p.a)} {OP_SIGN[p.op]} {toKh(p.b)} =</span>
              {showAnswers
                ? <span className="font-semibold text-[var(--gold)]">{toKh(p.answer)}</span>
                : <span className="inline-block min-w-[2.5rem] border-b border-[var(--ink-faint)]">&nbsp;</span>}
            </div>
          ))}
        </div>
      </div>
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #khmer-worksheet-print, #khmer-worksheet-print * { visibility: visible !important; } #khmer-worksheet-print { position: absolute; inset: 0; width: 100%; border: none; background: #fff; color: #000; padding: 10mm; } @page { size: A4 portrait; margin: 12mm; } }`}</style>

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Problems are generated randomly in your browser; digits are converted to Khmer numerals (០–៩). Subtraction never goes negative and division always divides evenly, so every problem has a whole-number answer. Use the browser's print dialog to save as PDF or print.",
          "លំហាត់ត្រូវបានបង្កើតដោយចៃដន្យក្នុងកម្មវិធីរុករក លេខត្រូវបម្លែងជាលេខខ្មែរ (០–៩)។ ការដកមិនដែលអវិជ្ជមាន ហើយការចែកតែងចែកដាច់ ដូច្នេះលំហាត់នីមួយៗមានចម្លើយជាចំនួនគត់។ ប្រើប្រអប់បោះពុម្ពរបស់កម្មវិធីរុករកដើម្បីរក្សាទុកជា PDF ឬបោះពុម្ព។",
        )}</p>
      </section>
    </ToolShell>
  );
}

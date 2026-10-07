"use client";
import { useRef, useState } from "react";
import { Delete, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { makeMathProblem, parseMixedDigits, type MathOp, type MathProblem } from "@/lib/khmer-word-games";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const ROUND = 10;
const kh = (n: number | string) => toKhmerNumerals(String(n));
const KEYPAD = ["១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩", "⌫", "០", "✓"];
const OPS: { op: MathOp; en: string; km: string }[] = [
  { op: "+", en: "Add", km: "បូក" },
  { op: "-", en: "Subtract", km: "ដក" },
  { op: "×", en: "Multiply", km: "គុណ" },
  { op: "÷", en: "Divide", km: "ចែក" },
];
const LEVELS = [10, 20, 100] as const;
// Monotonic clock for timing a round; only read from event handlers.
const elapsedClock = () => performance.now();

export default function KhmerMathDrill() {
  const { text: t } = useLanguage();
  const [op, setOp] = useToolState<MathOp>("khmer-math-drill:op", "+");
  const [max, setMax] = useToolState<(typeof LEVELS)[number]>("khmer-math-drill:max", 10);
  const [best, setBest] = useToolState<Record<string, number>>("khmer-math-drill:best", {});
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [index, setIndex] = useState(0);
  const [entry, setEntry] = useState("");
  const [results, setResults] = useState<{ given: number; ok: boolean }[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const startedAt = useRef(0);

  const key = `${op}-${max}`;
  const start = (o: MathOp = op, m: number = max) => {
    setProblems(Array.from({ length: ROUND }, () => makeMathProblem(o, m, Math.random)));
    setIndex(0); setEntry(""); setResults([]); setFlash(null); setSeconds(null);
    startedAt.current = elapsedClock();
  };
  const p = problems[index];
  const done = problems.length > 0 && index >= problems.length;
  const correct = results.filter((r) => r.ok).length;

  const submit = () => {
    if (!p) return;
    const given = parseMixedDigits(entry);
    if (given == null) return;
    const ok = given === p.answer;
    const nextResults = [...results, { given, ok }];
    setResults(nextResults);
    setFlash(ok ? "ok" : "bad");
    setEntry("");
    const ni = index + 1;
    setIndex(ni);
    if (ni >= problems.length) {
      const secs = Math.round((elapsedClock() - startedAt.current) / 100) / 10;
      setSeconds(secs);
      const score = nextResults.filter((r) => r.ok).length;
      // Best = fastest perfect round for this operation and range.
      if (score === problems.length && (!best[key] || secs < best[key])) setBest({ ...best, [key]: secs });
    }
  };

  const press = (k: string) => {
    if (k === "⌫") setEntry([...entry].slice(0, -1).join(""));
    else if (k === "✓") submit();
    else if ([...entry].length < 6) setEntry(entry + k);
    setFlash(null);
  };

  return (
    <ToolShell
      title="Khmer Numeral Math Drill"
      khmerTitle="លំហាត់គណិតលេខខ្មែរ"
      description="Quick-fire arithmetic written in Khmer numerals: ten questions of adding, subtracting, multiplying or dividing, answered on a Khmer number pad (or your keyboard, in either Khmer or Western digits). Subtraction never goes below zero and division always comes out even. Perfect rounds set a best time."
      descriptionKm="លំហាត់គណិតរហ័សសរសេរជាលេខខ្មែរ៖ ដប់សំណួរនៃការបូក ដក គុណ ឬចែក ឆ្លើយលើបន្ទះលេខខ្មែរ (ឬក្ដារចុចរបស់អ្នក ជាលេខខ្មែរ ឬលេខឡាតាំង)។ ការដកមិនដែលតិចជាងសូន្យ ហើយការចែកតែងតែចែកដាច់។ ជុំដែលត្រូវទាំងអស់កត់ត្រាពេលល្អបំផុត។"
    >
      <PillGroup label={t("Operation", "ប្រមាណវិធី")}>
        {OPS.map((o) => <Pill key={o.op} active={op === o.op} onClick={() => { setOp(o.op); setProblems([]); }}>{`${o.op} ${t(o.en, o.km)}`}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Numbers up to", "លេខរហូតដល់")}>
        {LEVELS.map((m) => <Pill key={m} active={max === m} onClick={() => { setMax(m); setProblems([]); }}>{t(String(m), kh(m))}</Pill>)}
      </PillGroup>

      {problems.length === 0 ? (
        <Button onClick={() => start()}>{t("Start", "ចាប់ផ្តើម")}</Button>
      ) : done ? (
        <div className="space-y-3" role="status">
          <p className="rounded-md border border-[var(--gold)] p-3 text-sm text-[var(--ink)]">
            {t(`${correct} of ${problems.length} correct in ${seconds} s.`, `ត្រូវ ${kh(correct)} ក្នុងចំណោម ${kh(problems.length)} ក្នុងរយៈពេល ${kh(seconds ?? 0)} វិនាទី។`)}{" "}
            {best[key] != null && t(`Best perfect round: ${best[key]} s.`, `ជុំត្រូវទាំងអស់ល្អបំផុត៖ ${kh(best[key])} វិនាទី។`)}
          </p>
          <ol className="grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-5">
            {problems.map((q, i) => (
              <li key={i} lang="km" className={`rounded border px-2 py-1 font-khmer ${results[i]?.ok ? "border-[var(--teal)]/50 text-[var(--ink)]" : "border-[var(--danger)]/50 text-[var(--danger)]"}`}>
                {kh(q.a)} {q.op} {kh(q.b)} = {kh(q.answer)}{!results[i]?.ok && results[i] && <span className="text-xs"> ({kh(results[i].given)})</span>}
              </li>
            ))}
          </ol>
          <PillAction onClick={() => start()}><RefreshCw size={13} />{t("Play again", "លេងម្តងទៀត")}</PillAction>
        </div>
      ) : p && (
        <div className="mx-auto max-w-sm space-y-3">
          <p className="text-xs text-[var(--ink-faint)]">{t(`Question ${index + 1} of ${problems.length} · correct ${correct}`, `សំណួរទី ${kh(index + 1)} ក្នុងចំណោម ${kh(problems.length)} · ត្រូវ ${kh(correct)}`)}</p>
          <div className={`rounded-md border p-4 text-center transition ${flash === "ok" ? "border-[var(--teal)]" : flash === "bad" ? "border-[var(--danger)]" : "border-[var(--ground-line)]"} bg-[var(--ground-raised)]`}>
            <p lang="km" className="font-khmer text-5xl leading-[1.6] text-[var(--ink)]">{kh(p.a)} {p.op} {kh(p.b)} =</p>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value.replace(/[^0-9០-៩]/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              inputMode="numeric"
              aria-label={t("Your answer", "ចម្លើយរបស់អ្នក")}
              className="mt-2 h-14 w-40 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] text-center font-khmer text-3xl text-[var(--gold)] outline-none focus:border-[var(--gold-dim)]"
            />
            {flash === "bad" && results.length > 0 && (
              <p className="mt-1 text-sm text-[var(--danger)]" role="status">{t(`Answer was ${problems[index - 1].answer}`, `ចម្លើយគឺ ${kh(problems[index - 1].answer)}`)}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2" aria-label={t("Khmer number pad", "បន្ទះលេខខ្មែរ")}>
            {KEYPAD.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                aria-label={k === "⌫" ? t("Delete", "លុប") : k === "✓" ? t("Check answer", "ពិនិត្យចម្លើយ") : k}
                className={`flex h-14 items-center justify-center rounded-md border font-khmer text-2xl transition active:scale-95 ${k === "✓" ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"}`}
              >
                {k === "⌫" ? <Delete size={20} /> : <span lang="km">{k}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Problems are generated on your device: operands up to the chosen limit, multiplication and division using a times-table factor up to 12, subtraction kept non-negative and division built from a product so it is always exact. Khmer numerals are the standard digits ០–៩ (Unicode U+17E0–U+17E9). Best times are saved in this browser only. Original Tools123 implementation, a companion to the printable Khmer Math Worksheet.",
          "លំហាត់បង្កើតនៅលើឧបករណ៍របស់អ្នក៖ លេខរហូតដល់កម្រិតដែលបានជ្រើស ការគុណ និងការចែកប្រើកត្តាតារាងមេគុណរហូតដល់ ១២ ការដករក្សាមិនឱ្យអវិជ្ជមាន ហើយការចែកបង្កើតពីផលគុណ ដូច្នេះតែងតែចែកដាច់។ លេខខ្មែរគឺខ្ទង់ស្តង់ដារ ០–៩ (យូនីកូដ U+17E0–U+17E9)។ ពេលល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123 ជាដៃគូនៃឧបករណ៍សន្លឹកលំហាត់គណិតខ្មែរដែលអាចបោះពុម្ពបាន។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}

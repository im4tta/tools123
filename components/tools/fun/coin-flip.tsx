"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

type Result = "heads" | "tails";

export default function CoinFlip() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useState<"single" | "bestOf">("single");
  const [bestOf, setBestOf] = useState("3");
  const [result, setResult] = useState<Result | null>(null);
  const [tally, setTally] = useState<{ heads: number; tails: number }>({ heads: 0, tails: 0 });
  const [history, setHistory] = useState<Result[]>([]);
  const [winner, setWinner] = useState<Result | null>(null);

  function flip() {
    const r: Result = Math.random() < 0.5 ? "heads" : "tails";
    setResult(r);
    const nextTally = { ...tally, [r]: tally[r] + 1 };
    setTally(nextTally);
    setHistory((prev) => [r, ...prev].slice(0, 30));

    if (mode === "bestOf") {
      const target = Math.max(1, Number(bestOf) || 1);
      const needed = Math.ceil(target / 2);
      if (nextTally.heads >= needed) setWinner("heads");
      else if (nextTally.tails >= needed) setWinner("tails");
      else setWinner(null);
    }
  }

  function reset() {
    setResult(null);
    setTally({ heads: 0, tails: 0 });
    setHistory([]);
    setWinner(null);
  }

  return (
    <ToolShell
      title="Coin Flip"
      khmerTitle="បោះកាក់"
      description="Flip a coin — a single toss, or race to the best of N."
      descriptionKm="បោះកាក់ — បោះមួយដង ឬប្រកួតឈ្នះល្អបំផុត N ដង។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => { setMode(e.target.value as "single" | "bestOf"); reset(); }} className="w-48">
          <option value="single">{t("Single flip", "បោះមួយដង")}</option>
          <option value="bestOf">{t("Best of N", "ល្អបំផុត N")}</option>
        </Select>
      </Field>

      {mode === "bestOf" && (
        <Field label={t("Best of", "ល្អបំផុត")}>
          <Select value={bestOf} onChange={(e) => { setBestOf(e.target.value); reset(); }} className="w-48">
            {[3, 5, 7, 9].map((n) => (
              <option key={n} value={String(n)}>{n}</option>
            ))}
          </Select>
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={flip}
          className="rounded-md bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
        >
          {t("Flip", "បោះ")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
        >
          <Trash2 size={13} /> {t("Reset", "កំណត់ឡើងវិញ")}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6 text-center">
          <div className="text-6xl">{result === "heads" ? "🪙" : "🪙"}</div>
          <div className="mt-2 font-display text-2xl font-bold text-[var(--ink)]">
            {result === "heads" ? t("Heads", "ក្បាល") : t("Tails", "កន្ទុយ")}
          </div>
          {mode === "bestOf" && winner && (
            <div className="mt-2 text-sm font-semibold text-[var(--gold)]">
              {t("Winner:", "អ្នកឈ្នះ:")} {winner === "heads" ? t("Heads", "ក្បាល") : t("Tails", "កន្ទុយ")}
            </div>
          )}
        </div>
      )}

      {mode === "bestOf" && (tally.heads > 0 || tally.tails > 0) && (
        <div className="flex gap-3 text-sm text-[var(--ink-dim)]">
          <span>{t("Heads", "ក្បាល")}: <strong className="text-[var(--ink)]">{tally.heads}</strong></span>
          <span>{t("Tails", "កន្ទុយ")}: <strong className="text-[var(--ink)]">{tally.tails}</strong></span>
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {history.map((h, i) => (
            <span key={i} className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 text-xs text-[var(--ink)]">
              {h === "heads" ? "H" : "T"}
            </span>
          ))}
        </div>
      )}
    </ToolShell>
  );
}

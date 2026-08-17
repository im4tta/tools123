"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

function makeTarget(max: number) {
  return Math.floor(Math.random() * max) + 1;
}

export default function NumberGuessing() {
  const { text: t } = useLanguage();
  const [max, setMax] = useState(100);
  const [target, setTarget] = useState(() => makeTarget(100));
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<{ value: number; hint: "high" | "low" | "win" }[]>([]);
  const [attempts, setAttempts] = useState(0);

  const last = history[history.length - 1];

  const feedback = useMemo(() => {
    if (!last) return null;
    if (last.hint === "win") return { text: t("🎉 Correct! You got it!", "🎉 ត្រឹមត្រូវហើយ!"), cls: "border-[var(--green)]/40 bg-[var(--green)]/15 text-[var(--green)]" };
    return {
      text: last.hint === "low" ? t("Too low — guess higher", "តិចពេក — ស្មានឱ្យខ្ពស់ជាង") : t("Too high — guess lower", "ច្រើនពេក — ស្មានឱ្យទាបជាង"),
      cls: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]",
    };
  }, [last, t]);

  const reset = () => {
    setTarget(makeTarget(Number(max)));
    setGuess("");
    setHistory([]);
    setAttempts(0);
  };

  const submit = () => {
    const v = Number(guess);
    if (Number.isNaN(v) || v < 1 || v > Number(max)) return;
    const hint = v === target ? "win" : v < target ? "low" : "high";
    setHistory((h) => [...h, { value: v, hint }]);
    setAttempts((a) => a + 1);
    setGuess("");
  };

  return (
    <ToolShell
      title="Number Guessing Game"
      khmerTitle="ល្បែងស្មានលេខ"
      description="Guess a random number with high / low hints. How few attempts can you use?"
      descriptionKm="ស្មានលេខចៃដន្យ ជាមួយតម្រុយខ្ពស់ / ទាប។ តើអ្នកប្រើការស្មានតិចបំផុតប៉ុន្មាន? សាកមើល!"
    >
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("Number range (1–N)", "ជួរលេខ (1–N)")}>
          <Select
            value={max}
            onChange={(e) => {
              setMax(Number(e.target.value));
              setTarget(makeTarget(Number(e.target.value)));
              setHistory([]);
              setAttempts(0);
            }}
          >
            <option value="50">1–50</option>
            <option value="100">1–100</option>
            <option value="500">1–500</option>
            <option value="1000">1–1000</option>
          </Select>
        </Field>
        <Field label={t("Your guess", "ពាក្យស្មានរបស់អ្នក")}>
          <TextInput
            inputMode="numeric"
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="?"
          />
        </Field>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ground-base)] transition hover:opacity-90"
        >
          {t("Guess", "ស្មាន")}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
        >
          {t("New game", "ល្បែងថ្មី")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-dim)]">
        <span>
          {t("Attempts", "ការស្មាន")}: <b className="text-[var(--gold)]">{attempts}</b>
        </span>
        {history.length > 0 && (
          <span className="font-mono-ui">
            {history.map((h) => (h.hint === "win" ? `✅${h.value}` : `${h.value}${h.hint === "low" ? "↑" : "↓"}`)).join(" ")}
          </span>
        )}
      </div>

      {feedback && (
        <div className={`rounded-md border p-4 text-center font-medium ${feedback.cls}`}>
          {feedback.text}
          {last?.hint === "win" && (
            <button type="button" onClick={reset} className="mt-2 block w-full rounded-md bg-[var(--green)]/30 px-4 py-2 text-sm text-[var(--green)] transition hover:bg-[var(--green)]/40">
              {t("Play again", "លេងម្ដងទៀត")}
            </button>
          )}
        </div>
      )}
    </ToolShell>
  );
}
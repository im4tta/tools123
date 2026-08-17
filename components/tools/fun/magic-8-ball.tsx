"use client";
import { useState } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ANSWERS: { en: string; km: string }[] = [
  { en: "It is certain.", km: "ច្បាស់ណាស់។" },
  { en: "Yes, definitely.", km: "បាទ ប្រាកដជាបាទ។" },
  { en: "Most likely.", km: "អាចទៅរួចបំផុត។" },
  { en: "Yes.", km: "បាទ។" },
  { en: "Signs point to yes.", km: "សញ្ញាបង្ហាញថាបាទ។" },
  { en: "Ask again later.", km: "សួរម្ដងទៀតនៅពេលក្រោយ។" },
  { en: "Cannot predict now.", km: "ពេលនេះមិនអាចទាយបានទេ។" },
  { en: "Better not tell you now.", km: "កុំប្រាប់អ្នកនៅពេលនេះល្អជាង។" },
  { en: "Don't count on it.", km: "កុំសង្ឃឹមលើវា។" },
  { en: "My reply is no.", km: "ចម្លើយរបស់ខ្ញុំគឺទេ។" },
  { en: "Outlook not so good.", km: "លទ្ធភាពមិនសូវល្អទេ។" },
  { en: "Very doubtful.", km: "សង្ស័យខ្លាំងណាស់។" },
];

export default function Magic8Ball() {
  const { text: t } = useLanguage();
  const [question, setQuestion] = useToolState("8ball:question", "");
  const [answer, setAnswer] = useState<{ en: string; km: string } | null>(null);
  const [count, setCount] = useState(0);

  const ask = () => {
    setAnswer(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
    setCount((c) => c + 1);
  };

  return (
    <ToolShell
      title="Magic 8 Ball"
      khmerTitle="បាល់ទស្សន៍ទាយ"
      description="Ask a yes/no question and get a random fortune."
      descriptionKm="សួរសំណួរបាទ/ទេ ហើយទទួលចម្លើយចៃដន្យ។"
    >
      <Field label={t("Your question", "សំណួររបស់អ្នក")}>
        <TextInput value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("Will I win the lottery?", "តើខ្ញុំនឹងឈ្នះឆ្នោតទេ?")} onKeyDown={(e) => e.key === "Enter" && ask()} />
      </Field>
      <Button type="button" onClick={ask} className="w-full">
        {t("Ask the 8 Ball", "សួរបាល់")}
      </Button>

      <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[var(--ink)] p-6 shadow-lg">
        {answer ? (
          <p className="text-center text-sm font-semibold leading-snug text-[var(--gold)]">{t(answer.en, answer.km)}</p>
        ) : (
          <div className="text-center">
            <div className="text-5xl text-[var(--gold)]">8</div>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">{t("Shake me", "អង្រួនខ្ញុំ")}</p>
          </div>
        )}
      </div>
      {count > 0 && (
        <p className="text-center text-xs text-[var(--ink-faint)]">
          {t("Asked", "បានសួរ")}: {count} {t("time(s)", "ដង")}
        </p>
      )}
    </ToolShell>
  );
}
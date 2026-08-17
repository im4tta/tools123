"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const QUOTES: { en: string; author: string }[] = [
  { en: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { en: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { en: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { en: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb" },
  { en: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { en: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { en: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { en: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { en: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { en: "Well done is better than well said.", author: "Benjamin Franklin" },
  { en: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { en: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

function randomQuote(): { en: string; author: string } {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export default function RandomQuote() {
  const { text: t } = useLanguage();
  const [quote, setQuote] = useState(() => randomQuote());

  return (
    <ToolShell
      title="Random Quote Generator"
      khmerTitle="បង្កើតសម្រង់ពាក្យចៃដន្យ"
      description="Get a random motivational quote."
      descriptionKm="ទទួលបានសម្រង់ពាក្យលើកទឹកចិត្តចៃដន្យ។"
    >
      <Field label={t("Your quote", "សម្រង់ពាក្យរបស់អ្នក")}>
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-5">
          <blockquote className="font-display text-lg leading-relaxed text-[var(--ink)]">“{quote.en}”</blockquote>
          <div className="mt-2 text-sm text-[var(--ink-dim)]">— {quote.author}</div>
        </div>
      </Field>
      <button
        type="button"
        onClick={() => setQuote(randomQuote())}
        className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
      >
        <RefreshCw size={14} /> {t("New quote", "សម្រង់ថ្មី")}
      </button>
    </ToolShell>
  );
}

"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const COMPLIMENTS: { en: string; km: string }[] = [
  { en: "You have a kind heart.", km: "អ្នកមានចិត្តល្អ។" },
  { en: "You make people feel welcome.", km: "អ្នកធ្វើឱ្យមនុស្សមានអារម្មណ៍ស្វាគមន៍។" },
  { en: "Your smile lights up the room.", km: "ស្នាមញញឹមរបស់អ្នកធ្វើឱ្យបន្ទប់ភ្លឺ។" },
  { en: "You work hard and it shows.", km: "អ្នកឧស្សាហ៍ ហើយលទ្ធផលបង្ហាញឱ្យឃើញ។" },
  { en: "You are a great listener.", km: "អ្នកជាអ្នកស្ដាប់ដ៏ពូកែម្នាក់។" },
  { en: "You inspire the people around you.", km: "អ្នកផ្ដល់កម្លាំងចិត្តដល់អ្នកជុំវិញខ្លួន។" },
  { en: "You handle challenges with grace.", km: "អ្នកដោះស្រាយបញ្ហាដោយភាពស្ងប់ស្ងាត់។" },
  { en: "You are smarter than you think.", km: "អ្នកឆ្លាតជាងអ្វីដែលអ្នកគិតទៅទៀត។" },
  { en: "Your energy is contagious.", km: "ថាមពលរបស់អ្នកឆ្លងដល់អ្នកដទៃ។" },
  { en: "You make the world a better place.", km: "អ្នកធ្វើឱ្យពិភពលោកកាន់តែប្រសើរ។" },
];

export default function RandomCompliment() {
  const { text: t } = useLanguage();
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * COMPLIMENTS.length));

  const next = () => {
    let n = Math.floor(Math.random() * COMPLIMENTS.length);
    while (n === idx) n = Math.floor(Math.random() * COMPLIMENTS.length);
    setIdx(n);
  };

  const c = COMPLIMENTS[idx];

  return (
    <ToolShell
      title="Random Compliment"
      khmerTitle="ពាក្យសរសើរចៃដន្យ"
      description="Brighten someone's day with a random compliment."
      descriptionKm="ធ្វើឱ្យថ្ងៃរបស់នរណាម្នាក់ភ្លឺឡើង ជាមួយពាក្យសរសើរចៃដន្យ។"
    >
      <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6 text-center">
        <p className="font-display text-xl leading-relaxed text-[var(--ink)]">“{t(c.en, c.km)}”</p>
      </div>
      <Button type="button" onClick={next} className="w-full">
        <RefreshCw size={15} className="mr-1 inline" />
        {t("Another compliment", "សរសើរមួយទៀត")}
      </Button>
    </ToolShell>
  );
}
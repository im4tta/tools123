"use client";

import { ExternalLink } from "lucide-react";
import PosterStudio from "./studio/PosterStudio";
import CrosswordStudio from "./studio/CrosswordStudio";
import ExamStudio from "./studio/ExamStudio";
import FlashcardStudio from "./studio/FlashcardStudio";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type TabId = "poster" | "crossword" | "exam" | "flashcards";

export default function KhmerStudioTool() {
  const { text: t } = useLanguage();
  const [tab, setTab] = useToolState<TabId>("khmer-studio:tab", "poster");

  const tabs: { id: TabId; label: string; km: string }[] = [
    { id: "poster", label: "Poster", km: "បោះពុម្ពផ្ទាំង" },
    { id: "crossword", label: "Crossword / Word search", km: "ល្បែងអូសអក្សរ" },
    { id: "exam", label: "Exam sheet", km: "សំណុំបែបបទប្រឡង" },
    { id: "flashcards", label: "Flashcards", km: "កាតរំលឹក" },
  ];

  return (
    <ToolShell
      title="Khmer Studio"
      khmerTitle="ស្ទូឌីយោខ្មែរ"
      description="Print-ready Khmer PDFs with correct shaping — variable-weight posters, crossword/word-search puzzles, exam sheets, and flashcards."
      descriptionKm="បង្កើតឯកសារ PDF ខ្មែរដែលមានរូបរាងត្រឹមត្រូវ — ផ្ទាំងពុម្ពអក្សរ ល្បែងអូសអក្សរ សំណុំបែបបទប្រឡង និងកាតរំលឹក។"
    >
      <div className="khmer-studio overflow-hidden rounded-xl border border-[var(--ground-line)]">
        <nav className="flex border-b border-[var(--ink-800)] bg-[var(--ink-950)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                  tab === item.id
                    ? "bg-gold text-ink-950"
                    : "text-bone-dim hover:text-bone"
                }`}
              >
                {t(item.label, item.km)}
              </button>
            ))}
          </div>
        </nav>

        {tab === "poster" && <PosterStudio />}
        {tab === "crossword" && <CrosswordStudio />}
        {tab === "exam" && <ExamStudio />}
        {tab === "flashcards" && <FlashcardStudio />}
      </div>

      <aside className="mt-5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t("Built on HappyPDF by Seanghay Yath — a pdf-lib fork with HarfBuzz shaping so Khmer, Thai, Lao, Arabic, and Indic scripts render correctly (MIT). The studio's five faces — Kantumruy Pro, Noto Sans Khmer, Noto Serif Khmer, Moul, and Bokor — are Google-Fonts typefaces under the SIL Open Font License.", "បង្កើតឡើងលើ HappyPDF របស់ Seanghay Yath — ការបែងចែក pdf-lib ជាមួយ HarfBuzz ដើម្បីឱ្យអក្សរខ្មែរ ថៃ ឡាវ អារ៉ាប់ និងឥណ្ឌាបង្ហាញត្រឹមត្រូវ (MIT)។ អក្សរទាំងប្រាំរបស់ស្ទូឌីយោ — Kantumruy Pro, Noto Sans Khmer, Noto Serif Khmer, Moul និង Bokor — ជាប្រភេទអក្សររបស់ Google Fonts ក្រោមអាជ្ញាបណ្ណ OFL។")}{" "}
          <a href="https://seanghay.github.io/happypdf/" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">happypdf <ExternalLink size={11} className="inline" /></a>
          {" · "}
          <a href="https://fonts.google.com/kantumruypro" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">Kantumruy Pro (OFL) <ExternalLink size={11} className="inline" /></a>
          {" · "}
          <a href="https://fonts.google.com/notosanskhmer" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">Noto Sans Khmer (OFL) <ExternalLink size={11} className="inline" /></a>
        </p>
      </aside>
    </ToolShell>
  );
}
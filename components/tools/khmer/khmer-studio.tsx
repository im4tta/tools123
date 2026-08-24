"use client";

import { ExternalLink } from "lucide-react";
import PosterStudio from "./studio/PosterStudio";
import CrosswordStudio from "./studio/CrosswordStudio";
import ExamStudio from "./studio/ExamStudio";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type TabId = "poster" | "crossword" | "exam";

export default function KhmerStudioTool() {
  const { text: t } = useLanguage();
  const [tab, setTab] = useToolState<TabId>("khmer-studio:tab", "poster");

  const tabs: { id: TabId; label: string; km: string }[] = [
    { id: "poster", label: "Poster", km: "បោះពុម្ពផ្ទាំង" },
    { id: "crossword", label: "Crossword", km: "ល្បែងអូសអក្សរ" },
    { id: "exam", label: "Exam sheet", km: "សំណុំបែបបទប្រឡង" },
  ];

  return (
    <ToolShell
      title="Khmer Studio"
      khmerTitle="ស្ទូឌីយោខ្មែរ"
      description="Print-ready Khmer PDFs with correct shaping — variable-weight posters, crossword puzzles, and exam sheets."
      descriptionKm="បង្កើតឯកសារ PDF ខ្មែរដែលមានរូបរាងត្រឹមត្រូវ — ផ្ទាំងពុម្ពអក្សរ ល្បែងអូសអក្សរ និងសំណុំបែបបទប្រឡង។"
    >
      <div className="khmer-studio overflow-hidden rounded-xl border border-[var(--ground-line)]">
        <nav className="flex border-b border-[var(--ink-800)] bg-[var(--ink-950)] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
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
      </div>

      <aside className="mt-5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t("Built on HappyPDF by Seanghay Yath — a pdf-lib fork with HarfBuzz shaping so Khmer, Thai, Lao, Arabic, and Indic scripts render correctly (MIT). Posters and papers are typeset in Kantumruy Pro, a variable Khmer/Latin typeface under the SIL Open Font License.", "បង្កើតឡើងលើ HappyPDF របស់ Seanghay Yath — ការបែងចែក pdf-lib ជាមួយ HarfBuzz ដើម្បីឱ្យអក្សរខ្មែរ ថៃ ឡាវ អារ៉ាប់ និងឥណ្ឌាបង្ហាញត្រឹមត្រូវ (MIT)។ អក្សរប្រើ Kantumruy Pro ក្រោមអាជ្ញាបណ្ណ OFL។")}{" "}
          <a href="https://seanghay.github.io/happypdf/" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">happypdf <ExternalLink size={11} className="inline" /></a>
          {" · "}
          <a href="https://fonts.google.com/kantumruypro" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">Kantumruy Pro (OFL) <ExternalLink size={11} className="inline" /></a>
        </p>
      </aside>
    </ToolShell>
  );
}
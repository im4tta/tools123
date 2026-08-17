"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { toolHowToUse, toolWhatItDoes } from "@/lib/seo";
import type { ToolDef } from "@/lib/tools";

interface FaqItem {
  q: string;
  qKm: string;
  a: string;
  aKm: string;
}

export function ToolFaq({ tool }: { tool: ToolDef }) {
  const { text } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const title = tool.title;
  const name = tool.khmerTitle ?? tool.title;
  const what = toolWhatItDoes(tool);
  const how = toolHowToUse(tool);

  const items: FaqItem[] = [
    {
      q: `What does ${title} do?`,
      qKm: `តើ ${name} ធ្វើអ្វី?`,
      a: what.en,
      aKm: what.km,
    },
    {
      q: `How do I use ${title}?`,
      qKm: `តើខ្ញុំប្រើ ${name} ដោយរបៀបណា?`,
      a: how.en.join(" "),
      aKm: how.km.join(" "),
    },
    {
      q: `Is ${title} free to use?`,
      qKm: `តើ ${name} ឥតគិតថ្លៃទេ?`,
      a: `Yes. ${title} on 123 Toolbox is free and runs directly in your browser — no account or payment required.`,
      aKm: `បាទ។ ${name} នៅលើ 123 Toolbox គឺឥតគិតថ្លៃ ហើយដំណើរការដោយផ្ទាល់ក្នុងកម្មវិធីរុករករបស់អ្នក — មិនតម្រូវឱ្យបង្កើតគណនី ឬបង់ប្រាក់ឡើយ។`,
    },
    {
      q: `Do I need to install anything to use ${title}?`,
      qKm: `តើខ្ញុំត្រូវដំឡើងអ្វីដើម្បីប្រើ ${name} ទេ?`,
      a: "No installation is required. It runs in a modern web browser and processes your input locally on your device.",
      aKm: "មិនតម្រូវឱ្យដំឡើងអ្វីទេ។ វាដំណើរការក្នុងកម្មវិធីរុករកទំនើប ហើយដំណើរការទិន្នន័យរបស់អ្នកនៅលើឧបករណ៍ផ្ទាល់។",
    },
    {
      q: `Is ${title} available in Khmer?`,
      qKm: `តើ ${name} មានជាភាសាខ្មែរទេ?`,
      a: "Yes. The 123 Toolbox interface supports English, Khmer, and a bilingual English–Khmer mode.",
      aKm: "បាទ។ ចំណុចប្រទាក់របស់ 123 Toolbox គាំទ្រភាសាអង់គ្លេស ខ្មែរ និងរបៀបពីរភាសា អង់គ្លេស–ខ្មែរ។",
    },
  ];

  return (
    <section className="mx-auto mt-10 max-w-6xl">
      <h2 className="mb-3 font-display text-lg font-medium text-[var(--ink)]">{text("Frequently asked questions", "សំណួរដែលសួរញឹកញាប់")}</h2>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ground-raised-hi)]"
              >
                <span>{text(item.q, item.qKm)}</span>
                <ChevronDown size={16} className={`shrink-0 text-[var(--ink-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="border-t border-[var(--ground-line)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                  {text(item.a, item.aKm)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

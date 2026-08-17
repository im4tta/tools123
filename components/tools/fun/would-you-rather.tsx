"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const PROMPTS: { en: string; km: string }[] = [
  { en: "Would you rather always be 30 minutes late or 1 hour early?", km: "តើអ្នកចូលចិត្តយឺត ៣០ នាទី ឬមកមុន ១ ម៉ោងជានិច្ច?" },
  { en: "Would you rather have free Wi-Fi or free food forever?", km: "តើអ្នកចូលចិត្ត Wi-Fi ឥតគិតថ្លៃ ឬអាហារឥតគិតថ្លៃជារៀងរហូត?" },
  { en: "Would you rather live by the beach or in the mountains?", km: "តើអ្នកចូលចិត្តរស់ក្បែរឆ្នេរ ឬនៅលើភ្នំ?" },
  { en: "Would you rather be able to fly or be invisible?", km: "តើអ្នកចូលចិត្តហោះហើរបាន ឬមើលមិនឃើញ?" },
  { en: "Would you rather always win games or always win arguments?", km: "តើអ្នកចូលចិត្តឈ្នះហ្គេម ឬឈ្នះការជជែកគ្នាជានិច្ច?" },
  { en: "Would you rather have no internet for a week or no phone for a week?", km: "តើអ្នកចូលចិត្តគ្មានអ៊ីនធឺណិតមួយសប្ដាហ៍ ឬគ្មានទូរស័ព្ទមួយសប្ដាហ៍?" },
  { en: "Would you rather eat rice every day or noodles every day?", km: "តើអ្នកចូលចិត្តញ៉ាំបាយរាល់ថ្ងៃ ឬគុយទាវរាល់ថ្ងៃ?" },
  { en: "Would you rather explore space or the deep ocean?", km: "តើអ្នកចូលចិត្តរុករកលំហ ឬសមុទ្រជ្រៅ?" },
  { en: "Would you rather be famous but poor or unknown but rich?", km: "តើអ្នកចូលចិត្តល្បី ប៉ុន្តែក្រ ឬមិនល្បី ប៉ុន្តែមានប្រាក់?" },
  { en: "Would you rather travel to the past or to the future?", km: "តើអ្នកចូលចិត្តធ្វើដំណើរទៅអតីតកាល ឬទៅអនាគត?" },
];

export default function WouldYouRather() {
  const { text: t } = useLanguage();
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length));

  const next = () => {
    let n = Math.floor(Math.random() * PROMPTS.length);
    while (n === idx && PROMPTS.length > 1) n = Math.floor(Math.random() * PROMPTS.length);
    setIdx(n);
  };

  const p = PROMPTS[idx];

  return (
    <ToolShell
      title="Would You Rather"
      khmerTitle="អ្នកចូលចិត្តមួយណាជាង"
      description="Play the classic 'would you rather' question game with friends."
      descriptionKm="លេងល្បែងសំណួរ 'អ្នកចូលចិត្តមួយណាជាង' ជាមួយមិត្តភក្តិ។"
    >
      <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6">
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Question", "សំណួរ")}</div>
        <p className="mt-2 text-lg font-display leading-relaxed text-[var(--ink)]">{t(p.en, p.km)}</p>
      </div>
      <Button type="button" onClick={next} className="w-full">
        <RefreshCw size={15} className="mr-1 inline" />
        {t("Next question", "សំណួរបន្ទាប់")}
      </Button>
    </ToolShell>
  );
}
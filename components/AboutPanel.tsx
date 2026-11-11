"use client";

import { useLanguage } from "@/components/LanguageProvider";

const SHORTCUTS = [
  ["/ or Ctrl/⌘ K", "Search all tools", "ស្វែងរកឧបករណ៍ទាំងអស់"],
  ["G", "Switch graph / grid", "ប្តូរក្រាហ្វ / ក្រឡា"],
  ["T", "Switch theme", "ប្តូរផ្ទៃ"],
  ["U", "Go to page top", "ទៅផ្នែកខាងលើ"],
  ["↑ / ↓", "Navigate search results", "ជ្រើសរើសលទ្ធផលស្វែងរក"],
  ["Enter", "Open selected tool", "បើកឧបករណ៍ដែលបានជ្រើស"],
  ["Escape", "Close an overlay", "បិទផ្ទាំងបង្ហាញ"],
] as const;

/** About 123 Toolbox, the AI-accuracy notice and the keyboard shortcuts (shown in the Settings sheet). */
export function AboutPanel() {
  const { text: t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-sm leading-relaxed text-[var(--ink-dim)]">
        <p>{t("123 Toolbox is a searchable collection of practical office, developer, Khmer-language, geographic, design, and everyday utilities.", "123 Toolbox ជាបណ្ដុំឧបករណ៍សម្រាប់ការិយាល័យ អ្នកអភិវឌ្ឍន៍ ភាសាខ្មែរ ភូមិសាស្ត្រ ការរចនា និងការប្រើប្រាស់ប្រចាំថ្ងៃ។")}</p>
        <p>{t("Most tools run locally in your browser. Features marked as live data connect directly from your browser to their named official source; Toolbox123 does not proxy those datasets.", "ឧបករណ៍ភាគច្រើនដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។ មុខងារទិន្នន័យបច្ចុប្បន្នភ្ជាប់ដោយផ្ទាល់ពីកម្មវិធីរុករកទៅប្រភពផ្លូវការដែលបានបញ្ជាក់ ដោយមិនបញ្ជូនកាត់ម៉ាស៊ីនមេ Toolbox123 ទេ។")}</p>
      </div>
      <aside aria-label={t("AI-generated code and accuracy notice", "សេចក្តីជូនដំណឹងអំពីកូដដែលបង្កើតដោយ AI និងភាពត្រឹមត្រូវ")} className="space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm leading-relaxed text-[var(--ink)]">
        <strong className="block text-amber-800 dark:text-amber-300">{t("Caution: AI-generated code and accuracy notice", "ប្រយ័ត្ន៖ សេចក្តីជូនដំណឹងអំពីកូដដែលបង្កើតដោយ AI និងភាពត្រឹមត្រូវ")}</strong>
        <p>{t("A significant portion of this project was created or assisted by AI-generated code. Some tools may be incomplete, inaccurate, outdated, incompatible with certain browsers or files, or not fully functional.", "ផ្នែកមួយដ៏ច្រើននៃគម្រោងនេះត្រូវបានបង្កើត ឬជួយបង្កើតដោយកូដពី AI។ ឧបករណ៍មួយចំនួនអាចមិនទាន់ពេញលេញ មិនត្រឹមត្រូវ ហួសសម័យ មិនត្រូវគ្នាជាមួយកម្មវិធីរុករក ឬឯកសារមួយចំនួន ឬមិនដំណើរការពេញលេញ។")}</p>
        <p>{t("Always verify important results independently before using them for production, official records, legal, financial, medical, engineering, surveying, security, or other critical purposes.", "ត្រូវផ្ទៀងផ្ទាត់លទ្ធផលសំខាន់ៗដោយឯករាជ្យជានិច្ច មុនប្រើប្រាស់សម្រាប់ប្រព័ន្ធផលិតកម្ម ឯកសារផ្លូវការ កិច្ចការផ្លូវច្បាប់ ហិរញ្ញវត្ថុ វេជ្ជសាស្ត្រ វិស្វកម្ម សុរិយោដី សន្តិសុខ ឬគោលបំណងសំខាន់ផ្សេងទៀត។")}</p>
        <p>{t("Found a problem or need a new tool? Contact", "រកឃើញបញ្ហា ឬត្រូវការឧបករណ៍ថ្មី? សូមទាក់ទង")} <a href="https://t.me/tmeta9" target="_blank" rel="noreferrer" className="font-semibold text-[var(--gold-text)] underline underline-offset-2">t.me/tmeta9</a> | <a href="https://imeta.asia" target="_blank" rel="noreferrer" className="font-semibold text-[var(--gold-text)] underline underline-offset-2">imeta.asia</a>.</p>
      </aside>
      <div>
        <h3 className="mb-3 font-display text-sm font-medium text-[var(--ink)]">{t("Keyboard shortcuts", "គ្រាប់ចុចផ្លូវកាត់")}</h3>
        <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">{SHORTCUTS.map(([keys, english, khmer]) => <div key={keys} className="flex items-center justify-between gap-4 px-3 py-2.5 text-xs"><span className="text-[var(--ink-dim)]">{t(english, khmer)}</span><kbd className="shrink-0 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 font-mono-ui text-[var(--gold-text)]">{keys}</kbd></div>)}</div>
        <p className="mt-2 text-xs text-[var(--ink-faint)]">{t("Single-key shortcuts are ignored while you are typing in a field.", "គ្រាប់ចុចតែមួយនឹងមិនដំណើរការនៅពេលអ្នកកំពុងវាយបញ្ចូលក្នុងប្រអប់ទេ។")}</p>
      </div>
    </div>
  );
}

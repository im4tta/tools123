"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { createPortal } from "react-dom";
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

export function HeaderInfo() {
  const { text: t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== overlay
    );
    const previousInert = background.map((element) => [element, element.inert] as const);

    document.body.style.overflow = "hidden";
    background.forEach((element) => { element.inert = true; });
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(false);
        return;
      }

      if (event.key === "Tab" && dialog) {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((element) => element.tabIndex >= 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        event.stopImmediatePropagation();
        return;
      }

      // Keep global G/T/U/search shortcuts from firing behind the modal.
      event.stopImmediatePropagation();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previousInert.forEach(([element, inert]) => { element.inert = inert; });
      trigger?.focus();
    };
  }, [open]);

  return <>
    <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label={t("About and keyboard shortcuts", "អំពី និងគ្រាប់ចុចផ្លូវកាត់")} aria-expanded={open} aria-controls="project-info-dialog" aria-haspopup="dialog" title={t("About and keyboard shortcuts", "អំពី និងគ្រាប់ចុចផ្លូវកាត់")} className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]">
      <CircleHelp size={14} /><span className="hidden xl:inline">{t("About", "អំពី")}</span>
    </button>
    {open && typeof document !== "undefined" && createPortal(<div ref={overlayRef} className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/70 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section ref={dialogRef} id="project-info-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="project-info-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--ground-line)] bg-[var(--ground-raised)] px-5 py-4">
          <h2 id="project-info-title" className="font-display text-lg font-semibold text-[var(--ink)]">{t("About 123 Toolbox", "អំពី 123 Toolbox")}</h2>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={t("Close", "បិទ")} className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)]"><X size={15} /></button>
        </header>
        <div className="space-y-6 p-5">
          <div className="space-y-2 text-sm leading-relaxed text-[var(--ink-dim)]">
            <p>{t("123 Toolbox is a searchable collection of practical office, developer, Khmer-language, geographic, design, and everyday utilities.", "123 Toolbox ជាបណ្ដុំឧបករណ៍សម្រាប់ការិយាល័យ អ្នកអភិវឌ្ឍន៍ ភាសាខ្មែរ ភូមិសាស្ត្រ ការរចនា និងការប្រើប្រាស់ប្រចាំថ្ងៃ។")}</p>
            <p>{t("Most tools run locally in your browser. Features marked as live data connect directly from your browser to their named official source; Toolbox123 does not proxy those datasets.", "ឧបករណ៍ភាគច្រើនដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។ មុខងារទិន្នន័យបច្ចុប្បន្នភ្ជាប់ដោយផ្ទាល់ពីកម្មវិធីរុករកទៅប្រភពផ្លូវការដែលបានបញ្ជាក់ ដោយមិនបញ្ជូនកាត់ម៉ាស៊ីនមេ Toolbox123 ទេ។")}</p>
          </div>
          <aside aria-label={t("AI-generated code and accuracy notice", "សេចក្តីជូនដំណឹងអំពីកូដដែលបង្កើតដោយ AI និងភាពត្រឹមត្រូវ")} className="space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm leading-relaxed text-[var(--ink)]">
            <strong className="block text-amber-800 dark:text-amber-300">{t("Caution: AI-generated code and accuracy notice", "ប្រយ័ត្ន៖ សេចក្តីជូនដំណឹងអំពីកូដដែលបង្កើតដោយ AI និងភាពត្រឹមត្រូវ")}</strong>
            <p>{t("A significant portion of this project was created or assisted by AI-generated code. Some tools may be incomplete, inaccurate, outdated, incompatible with certain browsers or files, or not fully functional.", "ផ្នែកមួយដ៏ច្រើននៃគម្រោងនេះត្រូវបានបង្កើត ឬជួយបង្កើតដោយកូដពី AI។ ឧបករណ៍មួយចំនួនអាចមិនទាន់ពេញលេញ មិនត្រឹមត្រូវ ហួសសម័យ មិនត្រូវគ្នាជាមួយកម្មវិធីរុករក ឬឯកសារមួយចំនួន ឬមិនដំណើរការពេញលេញ។")}</p>
            <p>{t("Always verify important results independently before using them for production, official records, legal, financial, medical, engineering, surveying, security, or other critical purposes.", "ត្រូវផ្ទៀងផ្ទាត់លទ្ធផលសំខាន់ៗដោយឯករាជ្យជានិច្ច មុនប្រើប្រាស់សម្រាប់ប្រព័ន្ធផលិតកម្ម ឯកសារផ្លូវការ កិច្ចការផ្លូវច្បាប់ ហិរញ្ញវត្ថុ វេជ្ជសាស្ត្រ វិស្វកម្ម សុរិយោដី សន្តិសុខ ឬគោលបំណងសំខាន់ផ្សេងទៀត។")}</p>
            <p>{t("Found a problem or need a new tool? Contact", "រកឃើញបញ្ហា ឬត្រូវការឧបករណ៍ថ្មី? សូមទាក់ទង")} <a href="https://t.me/tmeta9" target="_blank" rel="noreferrer" className="font-semibold text-[var(--gold)] underline underline-offset-2">t.me/tmeta9</a> | <a href="https://imeta.asia" target="_blank" rel="noreferrer" className="font-semibold text-[var(--gold)] underline underline-offset-2">imeta.asia</a>.</p>
          </aside>
          <div>
            <h3 className="mb-3 font-display text-sm font-medium text-[var(--ink)]">{t("Keyboard shortcuts", "គ្រាប់ចុចផ្លូវកាត់")}</h3>
            <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">{SHORTCUTS.map(([keys, english, khmer]) => <div key={keys} className="flex items-center justify-between gap-4 px-3 py-2.5 text-xs"><span className="text-[var(--ink-dim)]">{t(english, khmer)}</span><kbd className="shrink-0 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 font-mono-ui text-[var(--gold)]">{keys}</kbd></div>)}</div>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">{t("Single-key shortcuts are ignored while you are typing in a field.", "គ្រាប់ចុចតែមួយនឹងមិនដំណើរការនៅពេលអ្នកកំពុងវាយបញ្ចូលក្នុងប្រអប់ទេ។")}</p>
          </div>
        </div>
      </section>
    </div>, document.body)}
  </>;
}

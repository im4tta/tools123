"use client";

import { CheckCircle2, Monitor, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const FONTS = ["Noto Sans Khmer", "Kantumruy Pro", "Noto Serif Khmer", "Battambang"] as const;
const DEFAULT_STRINGS = "ក្\nក្រ\nក្ល\nស្រ\nស្ត\nក្តី\nកណ្ដាល\nគ្របដណ្តប់\nសួស្តី";

function browserName() {
  const agent = navigator.userAgent;
  if (/Edg\//.test(agent)) return "Microsoft Edge";
  if (/Firefox\//.test(agent)) return "Firefox";
  if (/Safari\//.test(agent) && !/Chrome\//.test(agent)) return "Safari";
  if (/Chrome\//.test(agent)) return "Chrome";
  return "Other browser";
}

export default function WebShapingTestLab() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("web-shaping-test-lab:strings", DEFAULT_STRINGS);
  const [browser, setBrowser] = useState("Detecting…");
  const [loadedFonts, setLoadedFonts] = useState<Record<string, boolean>>({});
  const strings = useMemo(() => input.split(/\r?\n/).map((value) => value.trim()).filter(Boolean), [input]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => { if (!cancelled) setBrowser(browserName()); });
    void Promise.all(FONTS.map(async (font) => {
      try { await document.fonts.load(`16px "${font}"`); return [font, document.fonts.check(`16px "${font}"`)] as const; }
      catch { return [font, false] as const; }
    })).then((entries) => { if (!cancelled) setLoadedFonts(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, []);

  return <ToolShell title="Khmer Web Shaping Test Lab" khmerTitle="មន្ទីរពិសោធន៍សាកល្បងការបង្ហាញអក្សរខ្មែរ" description="Compare Khmer shaping sequences across fonts in your current browser. Use the same page in Chrome, Firefox, and Safari for a real browser comparison." descriptionKm="ប្រៀបធៀបលំដាប់បង្ហាញអក្សរខ្មែរតាម Font ក្នុងកម្មវិធីរុករកបច្ចុប្បន្ន។ សូមបើកទំព័រដូចគ្នានេះក្នុង Chrome, Firefox និង Safari ដើម្បីប្រៀបធៀប Browser ពិតប្រាកដ។">
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&family=Noto+Serif+Khmer:wght@400;500;600;700&display=swap');`}</style>
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><Field label={t("Test strings", "អត្ថបទសាកល្បង")} hint={t("One shaping sequence per line", "លំដាប់បង្ហាញមួយក្នុងមួយបន្ទាត់")}><TextArea rows={6} value={input} onChange={(event) => setInput(event.target.value)} className="font-khmer text-xl leading-loose" /></Field></section>
      <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--ink)]"><Monitor size={17} className="text-[var(--gold)]" />{t("Browser", "Browser")}</h2><span className="rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-1 text-xs font-semibold text-[var(--success)]">{t("Current browser", "Browser បច្ចុប្បន្ន")}: {browser}</span></div><div className="flex flex-wrap gap-2">{["Chrome", "Firefox", "Safari"].map((name) => <span key={name} className={`rounded-lg border px-3 py-2 text-xs ${browser === name ? "border-[var(--gold)] bg-[var(--gold)]/10 font-bold text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-faint)]"}`}>{name}{browser === name && <CheckCircle2 size={12} className="ml-1 inline" />}</span>)}</div><p className="mt-3 text-xs leading-relaxed text-[var(--ink-faint)]">{t("This lab renders in the browser you are using. It cannot emulate another browser inside the page.", "មន្ទីរពិសោធន៍នេះបង្ហាញតាម Browser ដែលអ្នកកំពុងប្រើ។ វាមិនអាចក្លែងធ្វើ Browser ផ្សេងនៅក្នុងទំព័រតែមួយបានទេ។")}</p></section>
      <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Font comparison", "ការប្រៀបធៀប Font")}</h2><button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] px-2.5 py-1.5 text-xs text-[var(--ink-dim)]"><RefreshCw size={13} />{t("Reload fonts", "បើក Font ឡើងវិញ")}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[42rem] border-collapse"><thead><tr className="border-b border-[var(--ground-line)] text-left text-xs text-[var(--ink-faint)]"><th className="px-3 py-2">{t("Test string", "អត្ថបទសាកល្បង")}</th>{FONTS.map((font) => <th key={font} className="px-3 py-2">{font}<span className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${loadedFonts[font] ? "bg-[var(--success)]" : "bg-[var(--ink-faint)]"}`} /></th>)}</tr></thead><tbody>{strings.map((sample, index) => <tr key={`${sample}-${index}`} className="border-b border-[var(--ground-line)] last:border-0"><td className="whitespace-nowrap px-3 py-4 font-mono-ui text-xs text-[var(--ink-faint)]">#{index + 1}</td>{FONTS.map((font) => <td key={font} className="whitespace-nowrap px-3 py-4 font-khmer text-2xl text-[var(--ink)]" style={{ fontFamily: `"${font}", sans-serif` }}>{sample}</td>)}</tr>)}</tbody></table></div></section>
      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">{t("Use this lab to inspect coeng stacks, vowel placement, signs, and baseline behavior. A visual pass should be combined with Unicode and font cmap inspection.", "ប្រើមន្ទីរពិសោធន៍នេះដើម្បីពិនិត្យជើងអក្សរ ទីតាំងស្រៈ សញ្ញា និងបន្ទាត់មូលដ្ឋាន។ គួរប្រើជាមួយការត្រួតពិនិត្យ Unicode និង Cmap របស់ Font ផងដែរ។")}</p>
    </div>
  </ToolShell>;
}

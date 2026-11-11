"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Download, Settings, Trash2, X } from "lucide-react";
import { AboutPanel } from "@/components/AboutPanel";
import { useLanguage } from "@/components/LanguageProvider";
import { ACCENTS, useTheme, type HomeDesign } from "@/components/ThemeProvider";
import { LANGUAGES, type LanguageMode } from "@/lib/i18n";
import { storage } from "@/lib/storage";

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[var(--ground-line)] px-3 py-2 text-sm text-[var(--ink)] has-[:checked]:border-[var(--gold-text)] has-[:checked]:bg-[var(--gold)]/10">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-[var(--gold-text)]" />
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="ui-label mb-2 text-[var(--ink)]">{title}</legend>
      {children}
    </fieldset>
  );
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify({ app: "123 Toolbox", exportedAt: new Date().toISOString(), data: storage.exportAll() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `123toolbox-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Header Settings button + sheet: appearance (theme, accent, home design), language, your saved
 * data (export, or clear with an in-page confirmation) and About & shortcuts. A native <dialog>
 * opened with showModal(), so focus is trapped, Escape closes it and the page behind is inert.
 */
export function SettingsSheet() {
  const { text: t, mode, setMode } = useLanguage();
  const { theme, setTheme, accent, setAccent, homeDesign, setHomeDesign } = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    // Keep the app's single-key shortcuts (G, T, U, /) from firing behind the sheet.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" && event.key !== "Tab") event.stopImmediatePropagation();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  function close() {
    setOpen(false);
    setConfirming(false);
  }

  const homeDesigns: { id: HomeDesign; en: string; km: string }[] = [
    { id: "aurora", en: "New", km: "ថ្មី" },
    { id: "classic", en: "Classic", km: "បែបដើម" },
    { id: "focus", en: "Focus", km: "ផ្តោត" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t("Settings", "ការកំណត់")}
        title={t("Settings", "ការកំណត់")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
      >
        <Settings size={15} aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onClose={close}
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
        className="settings-sheet bg-[var(--ground)] text-[var(--ink)]"
      >
        {open && (
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-[var(--ground-line)] px-5 py-4">
              <h2 id={`${id}-title`} className="font-display text-lg font-semibold">{t("Settings", "ការកំណត់")}</h2>
              <button type="button" onClick={close} aria-label={t("Close", "បិទ")} className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)]">
                <X size={16} aria-hidden />
              </button>
            </header>
            <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-5">
              <Section title={t("Theme", "ផ្ទៃ")}>
                <div className="grid grid-cols-2 gap-2">
                  <Choice name={`${id}-theme`} checked={theme === "light"} onChange={() => setTheme("light")}>{t("Light", "ភ្លឺ")}</Choice>
                  <Choice name={`${id}-theme`} checked={theme === "dark"} onChange={() => setTheme("dark")}>{t("Dark", "ងងឹត")}</Choice>
                </div>
              </Section>

              <Section title={t("Accent colour", "ពណ៌ប្រធានបទ")}>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACCENTS.map((a) => (
                    <Choice key={a.id} name={`${id}-accent`} checked={accent === a.id} onChange={() => setAccent(a.id)}>
                      <span className="h-4 w-4 shrink-0 rounded-full border border-black/20" style={{ background: a.swatch }} aria-hidden />
                      <span className="min-w-0 truncate">{t(a.label, a.km)}</span>
                    </Choice>
                  ))}
                </div>
              </Section>

              <Section title={t("Home page design", "ការរចនាទំព័រដើម")}>
                <div className="grid grid-cols-3 gap-2">
                  {homeDesigns.map((d) => (
                    <Choice key={d.id} name={`${id}-home`} checked={homeDesign === d.id} onChange={() => setHomeDesign(d.id)}>{t(d.en, d.km)}</Choice>
                  ))}
                </div>
              </Section>

              <Section title={t("Display language", "ភាសាបង្ហាញ")}>
                <div className="grid grid-cols-2 gap-1.5">
                  <Choice name={`${id}-lang`} checked={mode === "bi"} onChange={() => setMode("bi")}>{t("Bilingual", "ទ្វេភាសា")}</Choice>
                  {LANGUAGES.map((lang) => (
                    <Choice key={lang.id} name={`${id}-lang`} checked={mode === lang.id} onChange={() => setMode(lang.id as LanguageMode)}>{lang.native}</Choice>
                  ))}
                </div>
              </Section>

              <Section title={t("Your saved data", "ទិន្នន័យដែលបានរក្សាទុក")}>
                <p className="text-sm text-[var(--ink-dim)]">
                  {t(
                    "Favorites, recent tools, workspaces, collections and saved tool inputs are kept only in this browser.",
                    "ចំណូលចិត្ត ឧបករណ៍ថ្មីៗ កន្លែងធ្វើការ បណ្តុំ និងទិន្នន័យបញ្ចូលរបស់ឧបករណ៍ ត្រូវបានរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះប៉ុណ្ណោះ។",
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={downloadBackup} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line-strong)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--ground-raised)]">
                    <Download size={14} aria-hidden /> {t("Export my data", "នាំចេញទិន្នន័យរបស់ខ្ញុំ")}
                  </button>
                  {!confirming && (
                    <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger)] px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10">
                      <Trash2 size={14} aria-hidden /> {t("Clear all app data…", "លុបទិន្នន័យកម្មវិធីទាំងអស់…")}
                    </button>
                  )}
                </div>
                {confirming && (
                  <div ref={confirmRef} tabIndex={-1} role="group" aria-labelledby={`${id}-confirm`} className="space-y-3 rounded-md border border-[var(--danger)]/60 bg-[var(--danger)]/10 p-3">
                    <p id={`${id}-confirm`} className="flex gap-2 text-sm text-[var(--ink)]">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" aria-hidden />
                      {t(
                        "This removes your favorites, workspaces, collections and saved tool inputs from this browser. It cannot be undone.",
                        "វានឹងលុបចំណូលចិត្ត កន្លែងធ្វើការ បណ្តុំ និងទិន្នន័យបញ្ចូលរបស់ឧបករណ៍ចេញពីកម្មវិធីរុករកនេះ។ មិនអាចត្រឡប់វិញបានទេ។",
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={downloadBackup} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line-strong)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)]">
                        <Download size={14} aria-hidden /> {t("Export first", "នាំចេញជាមុនសិន")}
                      </button>
                      <button type="button" onClick={() => { storage.clearAll(); window.location.reload(); }} className="rounded-md bg-[var(--danger)] px-3 py-2 text-sm font-semibold text-[var(--on-danger)]">
                        {t("Clear everything", "លុបទាំងអស់")}
                      </button>
                      <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-3 py-2 text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">
                        {t("Cancel", "បោះបង់")}
                      </button>
                    </div>
                  </div>
                )}
              </Section>

              <details className="group rounded-md border border-[var(--ground-line)]">
                <summary className="cursor-pointer px-3 py-2.5 text-sm font-semibold text-[var(--ink)]">{t("About and keyboard shortcuts", "អំពី និងគ្រាប់ចុចផ្លូវកាត់")}</summary>
                <div className="border-t border-[var(--ground-line)] p-3">
                  <AboutPanel />
                </div>
              </details>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

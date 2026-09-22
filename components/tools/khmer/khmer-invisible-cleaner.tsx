"use client";
import { useMemo } from "react";
import { Eye } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// The hidden characters that most often break search, copy-paste, form
// validation, and text comparison. ZWSP is listed separately because in Khmer
// it is frequently *intentional* (a word/line-break hint), so removing it is a
// deliberate choice rather than a safe default.
const MARKS: { cp: number; en: string; km: string }[] = [
  { cp: 0xfeff, en: "Byte-order mark (BOM)", km: "សញ្ញា BOM" },
  { cp: 0x200c, en: "Zero-width non-joiner", km: "ZWNJ" },
  { cp: 0x200d, en: "Zero-width joiner", km: "ZWJ" },
  { cp: 0x2060, en: "Word joiner", km: "Word joiner" },
  { cp: 0x00ad, en: "Soft hyphen", km: "សហ្វ hyphen" },
  { cp: 0x200e, en: "Left-to-right mark", km: "សញ្ញា LRM" },
  { cp: 0x200f, en: "Right-to-left mark", km: "សញ្ញា RLM" },
  { cp: 0x00a0, en: "Non-breaking space", km: "ដកឃ្លាមិនបំបែក" },
];
const ZWSP = 0x200b;

function countChar(text: string, cp: number): number {
  let n = 0;
  for (const ch of text) if (ch.codePointAt(0) === cp) n += 1;
  return n;
}

export default function KhmerInvisibleCleaner() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-invisible-cleaner:input", "");
  const [removeZwsp, setRemoveZwsp] = useToolState("khmer-invisible-cleaner:zwsp", false);
  const [collapse, setCollapse] = useToolState("khmer-invisible-cleaner:collapse", true);

  const report = useMemo(() => {
    if (!input) return null;
    const found = MARKS.map((m) => ({ ...m, count: countChar(input, m.cp) })).filter((m) => m.count > 0);
    const zwspCount = countChar(input, ZWSP);

    let out = input;
    // Always strip the "other" hidden marks (BOM, joiners, direction marks, NBSP→space).
    out = out.replace(/ /g, " ");
    out = out.replace(/[﻿‌‍⁠­‎‏]/g, "");
    if (removeZwsp) out = out.replace(/​/g, "");
    if (collapse) out = out.split("\n").map((line) => line.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/g, "").replace(/^[ \t]+/g, "")).join("\n");

    const otherRemoved = found.reduce((s, m) => s + m.count, 0);
    return { found, zwspCount, out, changed: out !== input, otherRemoved };
  }, [input, removeZwsp, collapse]);

  return (
    <ToolShell
      title="Khmer Invisible Character Cleaner"
      khmerTitle="ឧបករណ៍សម្អាតតួអក្សរមើលមិនឃើញ"
      description="Find and remove the hidden characters that quietly break Khmer text — byte-order marks, zero-width joiners, direction marks and stray non-breaking spaces that come from PDFs, Facebook, and copy-paste, and that make search fail, forms reject input, and two identical-looking strings refuse to match. Zero-width spaces (ZWSP), which are often intentional word-break hints in Khmer, are handled as a separate opt-in."
      descriptionKm="រក និងលុបតួអក្សរមើលមិនឃើញ ដែលធ្វើឲ្យអត្ថបទខ្មែរខូចដោយស្ងាត់ៗ — សញ្ញា BOM, zero-width joiner, សញ្ញាទិសដៅ និងដកឃ្លាមិនបំបែក ដែលមកពី PDF, Facebook និងការចម្លង ហើយធ្វើឲ្យការស្វែងរកបរាជ័យ ទម្រង់មិនទទួល និងអក្សរដូចគ្នាពីរមិនផ្គូផ្គង។ ចន្លោះ zero-width (ZWSP) ដែលជារឿយៗជាសញ្ញាបំបែកពាក្យដោយចេតនាក្នុងភាសាខ្មែរ ត្រូវបានដោះស្រាយជាជម្រើសដាច់ដោយឡែក។"
    >
      <Field label="Paste text to check" labelKm="បិទភ្ជាប់អត្ថបទដើម្បីពិនិត្យ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("Paste text that might contain hidden characters…", "បិទភ្ជាប់អត្ថបទដែលអាចមានតួអក្សរលាក់…")} autoFocus />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCollapse(!collapse)} className={`rounded-md border px-3 py-1.5 text-xs transition ${collapse ? "border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>
          {collapse ? "☑" : "☐"} {t("Collapse extra spaces & trim lines", "បង្រួមដកឃ្លាលើស និងកាត់ចុងជួរ")}
        </button>
        <button type="button" onClick={() => setRemoveZwsp(!removeZwsp)} className={`rounded-md border px-3 py-1.5 text-xs transition ${removeZwsp ? "border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>
          {removeZwsp ? "☑" : "☐"} {t("Also remove word-break spaces (ZWSP)", "លុបចន្លោះបំបែកពាក្យ (ZWSP) ផងដែរ")}
        </button>
      </div>

      {report && (
        <>
          {/* Detection report */}
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]"><Eye size={14} className="text-[var(--gold)]" />{t("Hidden characters found", "តួអក្សរលាក់ដែលរកឃើញ")}</div>
            {report.found.length === 0 && report.zwspCount === 0 ? (
              <p className="text-sm text-[var(--ink-dim)]">{t("None — this text is clean.", "គ្មានទេ — អត្ថបទនេះស្អាតហើយ។")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {report.found.map((m) => (
                  <li key={m.cp} className="flex items-center justify-between gap-3">
                    <span className="text-[var(--ink)]">{t(m.en, m.km)} <code className="text-[11px] text-[var(--ink-faint)]">U+{m.cp.toString(16).toUpperCase().padStart(4, "0")}</code></span>
                    <span className="tabular-nums text-[var(--danger)]">×{m.count}</span>
                  </li>
                ))}
                {report.zwspCount > 0 && (
                  <li className="flex items-center justify-between gap-3 border-t border-[var(--ground-line)] pt-1">
                    <span className="text-[var(--ink)]">{t("Zero-width space (ZWSP)", "ចន្លោះ zero-width (ZWSP)")} <code className="text-[11px] text-[var(--ink-faint)]">U+200B</code></span>
                    <span className="tabular-nums text-[var(--ink-dim)]">×{report.zwspCount} {removeZwsp ? t("(removing)", "(កំពុងលុប)") : t("(kept)", "(រក្សាទុក)")}</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Cleaned output */}
          <Field label="Cleaned text" labelKm="អត្ថបទដែលបានសម្អាត">
            <div className="relative">
              <TextArea value={report.out} readOnly rows={5} className="pr-10" />
              {report.out && <CopyButton text={report.out} compact className="absolute right-2 top-2" />}
            </div>
          </Field>
          <p className="text-[11px] text-[var(--ink-faint)]">
            {t(`${input.length} → ${report.out.length} characters.`, `${input.length} → ${report.out.length} តួអក្សរ។`)}
            {" "}
            {t(
              "BOM, joiners, direction marks and non-breaking spaces are always cleaned; ZWSP only when you opt in, because it often marks word breaks in Khmer.",
              "សញ្ញា BOM, joiners, សញ្ញាទិសដៅ និងដកឃ្លាមិនបំបែក ត្រូវសម្អាតជានិច្ច។ ZWSP លុបតែពេលអ្នកជ្រើសរើស ព្រោះវាជារឿយៗសម្គាល់ការបំបែកពាក្យក្នុងភាសាខ្មែរ។",
            )}
          </p>
        </>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Original Tools123 implementation — pure Unicode character handling, computed entirely in your browser. No text is uploaded or sent anywhere.",
          "ជាការសរសេរដើមរបស់ Tools123 — ការគ្រប់គ្រងតួអក្សរ Unicode សុទ្ធ គណនាទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក។ គ្មានអត្ថបទត្រូវបានផ្ទុកឡើង ឬបញ្ជូនទៅណាទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}

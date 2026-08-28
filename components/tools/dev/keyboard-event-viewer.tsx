"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

interface KeyEventInfo {
  id: number;
  type: "keydown" | "keyup";
  key: string;
  code: string;
  keyCode: number;
  location: number;
  repeat: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

const LOCATION_NAMES: Record<number, { en: string; km: string }> = {
  0: { en: "Standard", km: "ស្តង់ដារ" },
  1: { en: "Left side", km: "ខាងឆ្វេង" },
  2: { en: "Right side", km: "ខាងស្តាំ" },
  3: { en: "Numpad", km: "ផ្ទាំងលេខ" },
};

export default function KeyboardEventViewer() {
  const { text: t } = useLanguage();
  const [focused, setFocused] = useState(false);
  const [events, setEvents] = useState<KeyEventInfo[]>([]);
  const [latest, setLatest] = useState<KeyEventInfo | null>(null);

  useEffect(() => {
    function record(e: KeyboardEvent, type: "keydown" | "keyup") {
      const info: KeyEventInfo = {
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        type,
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        location: e.location,
        repeat: e.repeat,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      };
      setLatest(info);
      if (type === "keydown") setEvents((prev) => [info, ...prev].slice(0, 20));
    }
    const onKeyDown = (e: KeyboardEvent) => record(e, "keydown");
    const onKeyUp = (e: KeyboardEvent) => record(e, "keyup");
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const badge = (label: string, active: boolean) => (
    <span className={`rounded border px-1.5 py-0.5 text-xs ${active ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-faint)]"}`}>
      {label}
    </span>
  );

  return (
    <ToolShell
      title="Keyboard Event Viewer"
      khmerTitle="កម្មវិធីមើលព្រឹត្តិការណ៍ក្ដារចុច"
      description="Press any key and read key, code, keyCode, modifiers, and location — handy for wiring shortcuts and debugging Khmer keyboard layouts."
      descriptionKm="ចុចគ្រាប់ចុចណាមួយ ហើយអាន key, code, keyCode, គ្រាប់ចុចរួម និងទីតាំង — ងាយស្រួលសម្រាប់បង្កើតផ្លូវកាត់ និងពិនិត្យក្ដារចុចខ្មែរ។"
    >
      <div
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`rounded-lg border-2 border-dashed p-8 text-center outline-none transition ${focused ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-[var(--ground-line)]"}`}
      >
        {focused
          ? <p className="text-sm text-[var(--ink-dim)]">{t("Listening… press any key.", "កំពុងស្ដាប់… សូមចុចគ្រាប់ចុចណាមួយ។")}</p>
          : <p className="text-sm text-[var(--ink-dim)]">{t("Click here, then press keys on your keyboard.", "ចុចទីនេះ រួចចុចគ្រាប់ចុចលើក្ដារចុចរបស់អ្នក។")}</p>}
      </div>

      {latest && (
        <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-5">
          <div className="font-display text-4xl font-bold text-[var(--ink)]">{latest.key === " " ? t("Space", "ដកឃ្លា") : latest.key}</div>
          <div className="mt-3 grid grid-cols-2 gap-1 text-sm text-[var(--ink-dim)] sm:grid-cols-4">
            <span>{t("Type", "ប្រភេទ")}: <strong className="text-[var(--ink)]">{latest.type}</strong></span>
            <span>code: <strong className="text-[var(--ink)]">{latest.code}</strong></span>
            <span>keyCode: <strong className="text-[var(--ink)]">{latest.keyCode}</strong></span>
            <span>{t("Location", "ទីតាំង")}: <strong className="text-[var(--ink)]">{t(LOCATION_NAMES[latest.location]?.en ?? String(latest.location), LOCATION_NAMES[latest.location]?.km ?? String(latest.location))}</strong></span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badge("Ctrl", latest.ctrl)}{badge("Alt", latest.alt)}{badge("Shift", latest.shift)}{badge("Meta", latest.meta)}{badge(t("Repeat", "ធ្វើម្តងទៀត"), latest.repeat)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--ink)]">{t("Recent keydown events", "ព្រឹត្តិការណ៍ចុចថ្មីៗ")}</h2>
        <button type="button" onClick={() => { setEvents([]); setLatest(null); }} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
          <Trash2 size={13} /> {t("Clear", "សម្អាត")}
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("No keys captured yet.", "មិនទាន់មានការចុចណាមួយទេ។")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-[var(--ground-line)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                <th className="py-2 pr-3">{t("Key", "គ្រាប់ចុច")}</th>
                <th className="py-2 pr-3">code</th>
                <th className="py-2 pr-3">keyCode</th>
                <th className="py-2 pr-3">{t("Modifiers", "គ្រាប់ចុចរួម")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-[var(--ground-line)]/60 font-mono-ui text-xs">
                  <td className="py-1.5 pr-3">{e.key === " " ? "␣" : e.key}{e.repeat && " ↻"}</td>
                  <td className="py-1.5 pr-3">{e.code}</td>
                  <td className="py-1.5 pr-3">{e.keyCode}</td>
                  <td className="py-1.5">{[e.ctrl && "Ctrl", e.alt && "Alt", e.shift && "Shift", e.meta && "Meta"].filter(Boolean).join(" + ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("The viewer listens passively — it never blocks keys or sends them anywhere. Some browser shortcuts (Ctrl+T, F12, …) are handled by the browser before the page sees them. In bi/Khmer mode the big display shows the character your layout produced, which makes sequencing issues easy to spot.", "កម្មវិធីស្ដាប់តែប៉ុណ្ណោះ — មិនបិទភ្នាក់គ្រាប់ចុច ឬបញ្ជូនទិន្នន័យទេ។ ផ្លូវកាត់កម្មវិធីរុករកមួយចំនួន (Ctrl+T, F12, …) ត្រូវបានកម្មវិធីរុករកដំណើរការមុន។ ក្នុងរបៀបខ្មែរ អក្សរធំបង្ហាញតួអក្សរដែលក្ដារចុចបានបង្កើត ដែលងាយស្រួលមើលបញ្ហាតំរៀបអក្សរ។")}
      </p>
    </ToolShell>
  );
}


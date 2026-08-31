"use client";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Entry {
  id: string;
  sys: number;
  dia: number;
  pulse: number | null;
  note: string;
  date: string;
}

type CategoryKey = "low" | "normal" | "elevated" | "stage1" | "stage2" | "crisis";

// Widely known general thresholds (120/80 to 140/90 mmHg) — a general
// reference for logging, NOT medical advice. See a professional for advice.
function categorize(sys: number, dia: number): CategoryKey {
  if (sys >= 180 || dia >= 120) return "crisis";
  if (sys >= 140 || dia >= 90) return "stage2";
  if (sys >= 130 || dia >= 80) return "stage1";
  if (sys >= 120) return "elevated";
  if (sys < 90 || dia < 60) return "low";
  return "normal";
}

const CATEGORY_LABELS: Record<CategoryKey, [string, string]> = {
  low: ["Low (<90/60)", "ទាប (<៩០/៦០)"],
  normal: ["Normal (<120/80)", "ធម្មតា (<១២០/៨០)"],
  elevated: ["Elevated (120–129 / <80)", "កើនឡើង (១២០–១២៩ / <៨០)"],
  stage1: ["Stage 1 high (130–139 / 80–89)", "លើសឈាមដំណាក់ទី ១ (១៣០–១៣៩ / ៨០–៨៩)"],
  stage2: ["Stage 2 high (≥140 / ≥90)", "លើសឈាមដំណាក់ទី ២ (≥១៤០ / ≥៩០)"],
  crisis: ["Very high (≥180 / ≥120)", "ខ្ពស់ខ្លាំង (≥១៨០ / ≥១២០)"],
};

function badgeClass(key: CategoryKey): string {
  switch (key) {
    case "normal":
      return "border-[var(--ground-line)] text-[var(--ink)]";
    case "elevated":
      return "border-[var(--gold-dim)] text-[var(--gold)]";
    case "stage1":
      return "border-[var(--gold-dim)] font-semibold text-[var(--gold)]";
    case "stage2":
    case "crisis":
      return "border-[var(--danger)]/50 font-semibold text-[var(--danger)]";
    case "low":
      return "border-[var(--ground-line)] text-[var(--ink-dim)]";
  }
}

export default function BloodPressureLog() {
  const { text: t } = useLanguage();
  const [entries, setEntries] = useToolState<Entry[]>("blood-pressure:entries", []);
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function addReading() {
    const s = Number(sys);
    const d = Number(dia);
    const p = pulse.trim() === "" ? null : Number(pulse);
    if (Number.isNaN(s) || Number.isNaN(d) || s < 40 || s > 300 || d < 20 || d > 200 || s <= d) {
      setError(t("Enter a valid reading: systolic (40–300) and diastolic (20–200), with systolic above diastolic.", "សូមបញ្ចូលកំណត់ត្រាត្រឹមត្រូវ៖ ស៊ីស្តូលិក (៤០–៣០០) និងឌីអាស្តូលិក (២០–២០០) ដោយស៊ីស្តូលិកខ្ពស់ជាងឌីអាស្តូលិក។"));
      return;
    }
    if (p !== null && (Number.isNaN(p) || p < 20 || p > 250)) {
      setError(t("Pulse must be between 20 and 250 bpm.", "ជីពចរត្រូវនៅចន្លោះ ២០ និង ២៥០ ចង្វាក់/នាទី។"));
      return;
    }
    setEntries((prev) => [
      { id: crypto.randomUUID(), sys: s, dia: d, pulse: p, note: note.trim(), date: date || new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setSys("");
    setDia("");
    setPulse("");
    setNote("");
    setError("");
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const summary = useMemo(() => {
    if (entries.length === 0) return null;
    const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
    const pulses = entries.filter((e) => e.pulse !== null).map((e) => e.pulse as number);
    return {
      latest: entries[0],
      avgSys: avg(entries.map((e) => e.sys)),
      avgDia: avg(entries.map((e) => e.dia)),
      avgPulse: pulses.length ? avg(pulses) : null,
      minSys: Math.min(...entries.map((e) => e.sys)),
      maxSys: Math.max(...entries.map((e) => e.sys)),
      minDia: Math.min(...entries.map((e) => e.dia)),
      maxDia: Math.max(...entries.map((e) => e.dia)),
    };
  }, [entries]);

  const csv = useMemo(() => {
    const header = "Date,Systolic,Diastolic,Pulse,Note";
    const rows = entries.map((e) => `${e.date},${e.sys},${e.dia},${e.pulse ?? ""},"${e.note.replace(/"/g, '""')}"`);
    return [header, ...rows].join("\n");
  }, [entries]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <ToolShell
      title="Blood Pressure Log"
      khmerTitle="កំណត់ហេតុសម្ពាធឈាម"
      description="Log systolic, diastolic, pulse and notes. See the latest, average and min/max readings with a simple category badge. Stored only in this browser."
      descriptionKm="កត់ត្រាសម្ពាធឈាមស៊ីស្តូលិក ឌីអាស្តូលិក ជីពចរ និងកំណត់សម្គាល់។ មើលកំណត់ត្រាថ្មីបំផុត មធ្យម និងអប្បបរមា/អតិបរមា ជាមួយស្លាកប្រភេទសាមញ្ញ។ រក្សាទុកតែក្នុងកម្មវិធីរុករកនេះប៉ុណ្ណោះ។"
    >
      <Row>
        <Field label={t("Systolic (mmHg)", "ស៊ីស្តូលិក (mmHg)")}>
          <TextInput inputMode="numeric" value={sys} onChange={(e) => setSys(e.target.value)} className="font-mono-ui" placeholder="120" onKeyDown={(e) => e.key === "Enter" && addReading()} />
        </Field>
        <Field label={t("Diastolic (mmHg)", "ឌីអាស្តូលិក (mmHg)")}>
          <TextInput inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)} className="font-mono-ui" placeholder="80" onKeyDown={(e) => e.key === "Enter" && addReading()} />
        </Field>
        <Field label={t("Pulse (optional)", "ជីពចរ (ស្រេចចិត្ត)")} hint={t("bpm", "ចង្វាក់/នាទី")}>
          <TextInput inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} className="font-mono-ui" placeholder="65" onKeyDown={(e) => e.key === "Enter" && addReading()} />
        </Field>
        <Field label={t("Date", "កាលបរិច្ឆេទ")}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </Row>
      <Field label={t("Note (optional)", "កំណត់សម្គាល់ (ស្រេចចិត្ត)")}>
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("e.g. morning, before coffee", "ឧ. ពេលព្រឹក មុនផឹកកាហ្វេ")} onKeyDown={(e) => e.key === "Enter" && addReading()} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={addReading}>{t("Add reading", "បន្ថែមកំណត់ត្រា")}</Button>
        {entries.length > 0 && (
          <Button onClick={() => setEntries([])} className="border border-[var(--danger)]/50 bg-transparent text-[var(--danger)] hover:bg-[var(--danger)]/10">
            {t("Clear all", "លុបទាំងអស់")}
          </Button>
        )}
        {entries.length > 0 && (
          <span className="flex items-center gap-2 text-xs text-[var(--ink-dim)]">
            {t("Export CSV", "នាំចេញ CSV")}
            <CopyButton text={csv} />
          </span>
        )}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Latest", "ថ្មីបំផុត")}</div>
              <div className="mt-1 font-mono-ui text-xl font-semibold text-[var(--ink)]">
                {summary.latest.sys}/{summary.latest.dia}
              </div>
              <div className="mt-1.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeClass(categorize(summary.latest.sys, summary.latest.dia))}`}>
                  {t(...CATEGORY_LABELS[categorize(summary.latest.sys, summary.latest.dia)])}
                </span>
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Average", "មធ្យម")}</div>
              <div className="mt-1 font-mono-ui text-xl font-semibold text-[var(--ink)]">
                {fmt(summary.avgSys)}/{fmt(summary.avgDia)}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {summary.avgPulse === null ? "—" : `${t("pulse", "ជីពចរ")} ${fmt(summary.avgPulse)}`}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Systolic range", "ជួរស៊ីស្តូលិក")}</div>
              <div className="mt-1 font-mono-ui text-xl font-semibold text-[var(--ink)]">
                {summary.minSys}–{summary.maxSys}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Diastolic range", "ជួរឌីអាស្តូលិក")}</div>
              <div className="mt-1 font-mono-ui text-xl font-semibold text-[var(--ink)]">
                {summary.minDia}–{summary.maxDia}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {entries.map((e) => {
              const cat = categorize(e.sys, e.dia);
              return (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono-ui font-semibold text-[var(--ink)]">
                      {e.sys}/{e.dia}
                    </span>
                    {e.pulse !== null && <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{e.pulse} bpm</span>}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeClass(cat)}`}>{t(...CATEGORY_LABELS[cat])}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">{e.date}</span>
                    {e.note && <span className="text-xs text-[var(--ink-dim)]">{e.note}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    aria-label={t("Delete entry", "លុបកំណត់ត្រា")}
                    className="text-[var(--ink-dim)] hover:text-[var(--danger)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Categories use the widely known general thresholds of 120/80 to 140/90 mmHg (systolic/diastolic). This is a general reference for logging only — not medical advice. Please see a healthcare professional for diagnosis or treatment.",
              "ប្រភេទប្រើតម្លៃកម្រិតទូទៅដែលគេស្គាល់យ៉ាងទូលំទូលាយ 120/80 ដល់ 140/90 mmHg (ស៊ីស្តូលិក/ឌីអាស្តូលិក)។ នេះគ្រាន់តែជាឯកសារយោងទូទៅសម្រាប់កត់ត្រាប៉ុណ្ណោះ — មិនមែនជាដំបូន្មានផ្នែកវេជ្ជសាស្ត្រទេ។ សូមទៅជួបអ្នកជំនាញថែទាំសុខភាពសម្រាប់ការធ្វើរោគវិនិច្ឆ័យ ឬព្យាបាល។"
            )}
          </p>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--ink-dim)]">{t("No readings yet — add one above.", "មិនទាន់មានកំណត់ត្រាទេ — សូមបន្ថែមខាងលើ។")}</div>
      )}
    </ToolShell>
  );
}

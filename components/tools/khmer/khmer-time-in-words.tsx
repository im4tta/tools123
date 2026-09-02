"use client";
import { useEffect, useState } from "react";
import { ToolShell, Field, Select, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { toKhmerDigits } from "@/lib/khmer-date";

const toKh = (n: number) => toKhmerDigits(n);
const pad2 = (n: number) => String(n).padStart(2, "0");
const toKh2 = (n: number) => toKhmerDigits(pad2(n));

// Khmer number words used for the fully-spelled variant. These are the
// standard Khmer numerals (មួយ…ដប់ពីរ, ដប់/ម្ភៃ/សាមសិប…), the same words
// used across Khmer number-spellout tools in this app.
const DIGIT_WORDS = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
const TENS_WORDS = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
const HOUR_WORDS = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន", "ដប់", "ដប់មួយ", "ដប់ពីរ"];

function wordsBelow60(n: number): string {
  if (n < 10) return DIGIT_WORDS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS_WORDS[tens] : TENS_WORDS[tens] + DIGIT_WORDS[ones];
}

type TimePart = { en: string; km: string; from: number; to: number };

// Sensible common-form day-part buckets (24-hour start-of-range, half-open).
// These boundaries are a guide — real Khmer usage shifts with region/speaker.
const TIME_PARTS: TimePart[] = [
  { en: "Past midnight", km: "រំលងអាធ្រាត្រ", from: 0, to: 4 },
  { en: "Morning", km: "ព្រឹក", from: 4, to: 12 },
  { en: "Noon", km: "ថ្ងៃត្រង់", from: 12, to: 13 },
  { en: "Afternoon", km: "រសៀល", from: 13, to: 17 },
  { en: "Evening", km: "ល្ងាច", from: 17, to: 19 },
  { en: "Night", km: "យប់", from: 19, to: 24 },
];

function partOfHour(h24: number): TimePart {
  return TIME_PARTS.find((p) => h24 >= p.from && h24 < p.to) ?? TIME_PARTS[0];
}

function parseTimeText(value: string): { h24: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h24 = Number(match[1]);
  const m = Number(match[2]);
  if (h24 > 23 || m > 59) return null;
  return { h24, m };
}

const to12 = (h24: number) => {
  const r = h24 % 12;
  return r === 0 ? 12 : r;
};
const to24 = (h12: number, pm: boolean) => {
  if (h12 === 12) return pm ? 12 : 0;
  return pm ? h12 + 12 : h12;
};

type FormatMode = "24" | "12";

export default function KhmerTimeInWords() {
  const { text: t } = useLanguage();
  const [manual, setManual] = useToolState("khmer-time-in-words:time", "08:15");
  const [mode, setMode] = useToolState<FormatMode>("khmer-time-in-words:mode", "24");
  const [live, setLive] = useToolState("khmer-time-in-words:live", false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [live]);

  const nowText = `${pad2(clock.getHours())}:${pad2(clock.getMinutes())}`;
  const effective = live ? nowText : manual;
  const parsed = parseTimeText(effective);
  const invalid = !live && !parsed;

  const time = parsed ?? { h24: 8, m: 15 };
  const part = partOfHour(time.h24);
  const h12 = to12(time.h24);
  const isPm = time.h24 >= 12;

  const phrase =
    time.m === 0
      ? `ម៉ោង ${toKh(h12)} ${part.km}`
      : `ម៉ោង ${toKh(h12)} ${part.km} និង ${toKh(time.m)} នាទី`;

  const phraseWords =
    time.m === 0
      ? `ម៉ោង ${HOUR_WORDS[h12]} ${part.km}`
      : `ម៉ោង ${HOUR_WORDS[h12]} ${part.km} និង ${wordsBelow60(time.m)} នាទី`;

  const setManualValue = (value: string) => {
    setLive(false);
    setManual(value);
  };

  return (
    <ToolShell
      title="Khmer Time in Words"
      khmerTitle="ម៉ោងជាពាក្យខ្មែរ"
      description="Type any 24-hour time (or pick 12-hour AM/PM) and see how that moment is spoken in Khmer — ម៉ោង ៨ ព្រឹក និង ១៥ នាទី — with the day-part word chosen from common time buckets, Khmer numerals, and a live clock option that fills the current time."
      descriptionKm="បញ្ចូលម៉ោង ២៤ ម៉ោងណាមួយ (ឬជ្រើសរើសបែប ១២ ម៉ោង AM/PM) ដើម្បីមើលពេលនោះនិយាយជាភាសាខ្មែរយ៉ាងណា — ម៉ោង ៨ ព្រឹក និង ១៥ នាទី — ជាមួយពាក្យផ្នែកថ្ងៃ តាមចន្លោះពេលធម្មតា លេខខ្មែរ និងជម្រើសនាឡិកាផ្ទាល់ ដែលបំពេញម៉ោងបច្ចុប្បន្នដោយស្វ័យប្រវត្តិ។"
    >
      <Row>
        <Field label="Format" labelKm="ទម្រង់">
          <Select value={mode} onChange={(e) => setMode(e.target.value as FormatMode)}>
            <option value="24"><>{t("24-hour", "២៤ ម៉ោង")}</></option>
            <option value="12"><>{t("12-hour (AM/PM)", "១២ ម៉ោង (ព្រឹក/រសៀល)")}</></option>
          </Select>
        </Field>
        <Field
          label={mode === "24" ? "Time (24-hour)" : "Time (12-hour)"}
          labelKm={mode === "24" ? "ម៉ោង (២៤ ម៉ោង)" : "ម៉ោង (១២ ម៉ោង)"}
        >
          {mode === "24" ? (
            <TextInput
              type="time"
              value={manual}
              onChange={(e) => setManualValue(e.target.value)}
              className="font-mono-ui"
            />
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={h12}
                onChange={(e) => setManualValue(`${pad2(to24(Number(e.target.value), isPm))}:${pad2(time.m)}`)}
                className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <select
                value={time.m}
                onChange={(e) => setManualValue(`${pad2(time.h24)}:${pad2(Number(e.target.value))}`)}
                className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]"
              >
                {Array.from({ length: 60 }, (_, i) => i).map((mm) => (
                  <option key={mm} value={mm}>{mm}</option>
                ))}
              </select>
              <div className="flex shrink-0 overflow-hidden rounded-md border border-[var(--ground-line)]">
                <button
                  type="button"
                  onClick={() => setManualValue(`${pad2(to24(h12, false))}:${pad2(time.m)}`)}
                  title={t("Before noon (AM)", "មុនថ្ងៃត្រង់ (AM)")}
                  aria-label={t("Select before noon", "ជ្រើសរើសមុនថ្ងៃត្រង់")}
                  className={`px-2.5 py-2 text-xs font-semibold transition ${!isPm ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setManualValue(`${pad2(to24(h12, true))}:${pad2(time.m)}`)}
                  title={t("After noon (PM)", "ក្រោយថ្ងៃត្រង់ (PM)")}
                  aria-label={t("Select after noon", "ជ្រើសរើសក្រោយថ្ងៃត្រង់")}
                  className={`border-l border-[var(--ground-line)] px-2.5 py-2 text-xs font-semibold transition ${isPm ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
                >
                  PM
                </button>
              </div>
            </div>
          )}
        </Field>
      </Row>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            if (live) setManual(nowText); // keep the last live time when stopping
            setLive(!live);
          }}
        >
          <>
            {live
              ? t("Stop live clock", "បញ្ឈប់នាឡិកាផ្ទាល់")
              : t("Use current time (live)", "ប្រើម៉ោងបច្ចុប្បន្ន (ផ្ទាល់)")}
          </>
        </Button>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-1 text-xs font-medium text-[var(--gold)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
            {t("Live", "ផ្ទាល់")} · {nowText}
          </span>
        )}
      </div>

      {invalid ? (
        <p className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {t("Enter a valid 24-hour time (HH:MM).", "សូមបញ្ចូលម៉ោង ២៤ ឲ្យបានត្រឹមត្រូវ (ម៉ោង:នាទី)។")}
        </p>
      ) : (
        <>
          <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/5 px-4 py-3">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t("Spoken form", "ទម្រង់និយាយ")}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div lang="km" className="font-khmer text-2xl font-semibold leading-relaxed text-[var(--ink)] sm:text-3xl">
                {phrase}
              </div>
              <CopyButton text={phrase} compact className="shrink-0 border-0 bg-transparent text-[var(--ink-dim)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat
              label={t("Khmer numerals", "លេខខ្មែរ")}
              value={`${toKh2(time.h24)}:${toKh2(time.m)}`}
              mono
            />
            <MiniStat
              label={t("Day part", "ផ្នែកថ្ងៃ")}
              value={t(part.en, part.km)}
              sub={`${part.from === 0 ? "00" : part.from}:00–${pad2(part.to - 1)}:59`}
            />
            <MiniStat
              label={t("12-hour clock", "នាឡិកា ១២ ម៉ោង")}
              value={`${h12}:${pad2(time.m)} ${isPm ? "PM" : "AM"}`}
              mono
            />
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t("In Khmer words", "ជាពាក្យខ្មែរពេញ")}
            </div>
            <div lang="km" className="font-khmer text-lg leading-relaxed text-[var(--ink)]">
              {phraseWords}
            </div>
            <CopyButton text={phraseWords} compact className="mt-2 border-0 bg-transparent text-[var(--ink-dim)]" />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t("Day-part buckets used", "ចន្លោះផ្នែកថ្ងៃដែលប្រើ")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TIME_PARTS.map((p) => {
                const active = p.km === part.km;
                return (
                  <span
                    key={p.km}
                    lang="km"
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                      active
                        ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                        : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"
                    }`}
                  >
                    {t(p.en, p.km)} · {String(p.from).padStart(2, "0")}:00–{pad2(p.to - 1)}:59
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Spoken time conventions vary by region and speaker — short forms such as កន្លះ (\"half\", for :30) or ខ្វះ (\"minutes to\") are also common in everyday speech. This is a common-form guide based on the literal hour + minutes, with the day-part word chosen from the buckets above; it is not the only correct way to say the time.",
          "របៀបនិយាយម៉ោងប្រែប្រួលតាមតំបន់ និងអ្នកនិយាយ — ទម្រង់ខ្លីដូចជា «កន្លះ» (សម្រាប់ :30) ឬ «ខ្វះ» (នាទីដែលនៅខ្វះ) ក៏ប្រើធម្មតាក្នុងការសន្ទនាដែរ។ នេះជាមគ្គុទ្ទេសក៍ទម្រង់ទូទៅ ដោយផ្អែកលើម៉ោង និងនាទីត្រង់ៗ និងពាក្យផ្នែកថ្ងៃតាមចន្លោះខាងលើ — មិនមែនជាវិធីតែមួយគត់ដែលត្រឹមត្រូវនោះទេ។"
        )}
      </p>
    </ToolShell>
  );
}

function MiniStat({ label, value, sub, mono = false }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div lang="km" className={`mt-0.5 text-base font-semibold text-[var(--ink)] ${mono ? "font-mono-ui" : "font-khmer"}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-[var(--ink-faint)]">{sub}</div>}
    </div>
  );
}

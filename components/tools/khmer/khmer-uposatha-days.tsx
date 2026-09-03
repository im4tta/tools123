"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { localIsoToday } from "@/lib/khmer-date";
import momentkh from "@thyrith/momentkh";

// ---------------------------------------------------------------------------
// Lunar computation method (cited):
// Each Gregorian date is converted to its Khmer lunisolar date with the
// @thyrith/momentkh library (MIT, github.com/ThyrithSor/momentkh) — the same
// engine used by the Khmer Lunar Month Calendar and Full Lunar Date tools:
//   momentkh.fromGregorian(year, month, day, 12, 0, 0).khmer
// It follows the traditional Khmer astronomical tables (mean motions and the
// Moha Songkran epoch, with 29/30-day lunar months) as implemented in the
// original momentkh / khmer_calendar.cpp work. Results are computed in the
// browser and are approximate — official pagoda calendars are announced by
// the local authorities and can differ by a day.
// ---------------------------------------------------------------------------

const KH = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH[Number(d)] ?? d).join("");
const pad2 = (n: number) => String(n).padStart(2, "0");

type UpType = "w8" | "full" | "r8" | "new";

const TYPE_META: Record<UpType, { en: string; km: string; enDesc: string; kmDesc: string; cls: string }> = {
  w8: {
    en: "Waxing eighth",
    km: "សីល ៨កើត",
    enDesc: "8th day of the waxing fortnight",
    kmDesc: "ថ្ងៃទី ៨ នៃខែឡើង (កើត)",
    cls: "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold)]",
  },
  full: {
    en: "Full moon",
    km: "ពេញបូណ៌មី",
    enDesc: "15th day of the waxing fortnight",
    kmDesc: "ថ្ងៃទី ១៥ កើត (ពេញបូណ៌មី)",
    cls: "border-[var(--teal)]/50 bg-[var(--teal)]/10 text-[var(--teal)]",
  },
  r8: {
    en: "Waning eighth",
    km: "សីល ៨រោច",
    enDesc: "8th day of the waning fortnight",
    kmDesc: "ថ្ងៃទី ៨ នៃខែរនោច (រោច)",
    cls: "border-[var(--success)]/50 bg-[var(--success)]/10 text-[var(--success)]",
  },
  new: {
    en: "New moon",
    km: "ចុងខែ (១៤/១៥រោច)",
    enDesc: "last waning day before the new moon",
    kmDesc: "ថ្ងៃរោចចុងក្រោយ មុនថ្ងៃ ១កើត",
    cls: "border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]",
  },
};

type Row = {
  iso: string;
  wdEn: string;
  wdKm: string;
  lunarDay: number;
  phaseName: string;
  monthName: string;
  type: UpType;
};

type Result =
  | { ok: true; rows: Row[]; startIso: string; endIso: string }
  | { ok: false; error: string };

const todayIso = localIsoToday();

function parseDateIso(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d, 12);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

function computeRows(start: Date, end: Date): Row[] {
  const rows: Row[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const y = cursor.getFullYear();
    const mo = cursor.getMonth() + 1;
    const d = cursor.getDate();
    try {
      const res = momentkh.fromGregorian(y, mo, d, 12, 0, 0);
      const k = res.khmer;
      let type: UpType | null = null;
      if (k.moonPhase === 0) {
        // កើត (waxing fortnight): day 1–15.
        if (k.day === 8) type = "w8";
        else if (k.day === 15) type = "full";
      } else {
        // រោច (waning fortnight): day 1–14 or 1–15 depending on month length.
        if (k.day === 8) type = "r8";
        else if (k.day >= 14) {
          // The new-moon observance is the final waning day: the day whose
          // Khmer successor begins the next waxing fortnight (day 1 កើត).
          const next = res._khmerDateObj.addDays(1);
          if (next.moonPhase === 0 && next.day === 1) type = "new";
        }
      }
      if (type) {
        rows.push({
          iso: `${y}-${pad2(mo)}-${pad2(d)}`,
          wdEn: cursor.toLocaleDateString("en-US", { weekday: "short" }),
          wdKm: k.dayOfWeekName,
          lunarDay: k.day,
          phaseName: k.moonPhaseName,
          monthName: k.monthName,
          type,
        });
      }
    } catch {
      // Skip dates the conversion cannot handle (out of supported range).
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return rows;
}

function buildResult(view: View, ym: string, fromIso: string, toIso: string): Result {
  let start: Date | null = null;
  let end: Date | null = null;
  if (view === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
    if (!m) return { ok: false, error: "month" };
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (y < 1900 || y > 2100) return { ok: false, error: "month" };
    start = new Date(y, mo - 1, 1, 12);
    end = new Date(y, mo, 0, 12);
  } else {
    start = parseDateIso(fromIso);
    end = parseDateIso(toIso);
    if (!start || !end) return { ok: false, error: "range" };
    if (start.getFullYear() < 1900 || end.getFullYear() > 2100) return { ok: false, error: "range" };
    if (end.getTime() < start.getTime()) return { ok: false, error: "order" };
  }
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (dayCount > 400) return { ok: false, error: "long" };
  return { ok: true, rows: computeRows(start, end), startIso: isoOf(start), endIso: isoOf(end) };
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type View = "month" | "range";

const defaultMonthStart = `${todayIso.slice(0, 8)}01`;

export default function KhmerUposathaDays() {
  const { text: t } = useLanguage();
  const [view, setView] = useToolState<View>("khmer-uposatha-days:view", "month");
  const [ym, setYm] = useToolState("khmer-uposatha-days:ym", todayIso.slice(0, 7));
  const [fromIso, setFromIso] = useToolState("khmer-uposatha-days:from", defaultMonthStart);
  const [toIso, setToIso] = useToolState("khmer-uposatha-days:to", todayIso);

  const result = useMemo(() => buildResult(view, ym, fromIso, toIso), [view, ym, fromIso, toIso]);

  const errorMessage = (() => {
    if (result.ok) return null;
    switch (result.error) {
      case "month":
        return t("Enter a valid month (YYYY-MM) between 1900 and 2100.", "សូមបញ្ចូលខែឱ្យបានត្រឹមត្រូវ (ឆ្នាំ-ខែ) ចន្លោះឆ្នាំ ១៩០០ និង ២១០០។");
      case "range":
        return t("Enter valid start and end dates (YYYY-MM-DD).", "សូមបញ្ចូលកាលបរិច្ឆេទចាប់ផ្ដើម និងបញ្ចប់ឱ្យបានត្រឹមត្រូវ (ឆ្នាំ-ខែ-ថ្ងៃ)។");
      case "order":
        return t("The end date must be on or after the start date.", "កាលបរិច្ឆេទបញ្ចប់ត្រូវយឺត ឬស្មើនឹងកាលបរិច្ឆេទចាប់ផ្ដើម។");
      case "long":
        return t("Please keep the range under 400 days.", "សូមរក្សាចន្លោះពេលក្រោម ៤០០ ថ្ងៃ។");
      default:
        return null;
    }
  })();

  const rows = result.ok ? result.rows : [];

  const counts = useMemo(() => {
    const c: Record<UpType, number> = { w8: 0, full: 0, r8: 0, new: 0 };
    rows.forEach((r) => { c[r.type] += 1; });
    return c;
  }, [rows]);

  return (
    <ToolShell
      title="Khmer Buddhist Holy Days (ថ្ងៃសីល)"
      khmerTitle="រកថ្ងៃសីល"
      description="Find the traditional Khmer Buddhist observance days (ថ្ងៃសីល / uposatha) — the 8th of the waxing moon, full moon (១៥កើត), 8th of the waning moon, and the new-moon day (last waning day) of every Khmer lunar month — inside a Gregorian month or date range. Lunar dates use the same Khmer calendar computation as the Khmer Lunar Month Calendar tool."
      descriptionKm="រកថ្ងៃសីលតាមប្រពៃណីព្រះពុទ្ធសាសនាខ្មែរ — ថ្ងៃ ៨កើត ពេញបូណ៌មី (១៥កើត) ថ្ងៃ ៨រោច និងថ្ងៃរោចចុងខែ នៃរៀងរាល់ខែចន្ទគតិខ្មែរ — ក្នុងមួយខែសុរិយគតិ ឬចន្លោះកាលបរិច្ឆេទ។ ថ្ងៃចន្ទគតិប្រើក្បួនគណនាដូចឧបករណ៍ប្រតិទិនចន្ទគតិប្រចាំខែ។"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("month")}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
            view === "month"
              ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
              : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"
          }`}
        >
          {t("Single month", "មួយខែ")}
        </button>
        <button
          type="button"
          onClick={() => setView("range")}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
            view === "range"
              ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
              : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"
          }`}
        >
          {t("Date range", "ចន្លោះកាលបរិច្ឆេទ")}
        </button>
      </div>

      {view === "month" ? (
        <Field label="Gregorian month" labelKm="ខែសុរិយគតិ">
          <TextInput type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="w-48 font-mono-ui" />
        </Field>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Start date" labelKm="ថ្ងៃចាប់ផ្ដើម">
            <TextInput type="date" value={fromIso} onChange={(e) => setFromIso(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="End date" labelKm="ថ្ងៃបញ្ចប់">
            <TextInput type="date" value={toIso} onChange={(e) => setToIso(e.target.value)} className="font-mono-ui" />
          </Field>
        </div>
      )}

      {errorMessage ? (
        <p className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {errorMessage}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(TYPE_META) as UpType[]).map((key) => (
              <div key={key} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
                <div className="text-2xl font-semibold text-[var(--gold)]">{toKh(counts[key])}</div>
                <div className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_META[key].cls}`}>
                  {t(TYPE_META[key].en, TYPE_META[key].km)}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-[var(--ground-line)]">
            <div className="border-b border-[var(--ground-line)] px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {result.ok
                ? t(
                    `${rows.length} uposatha day(s) · ${result.startIso} → ${result.endIso}`,
                    `ថ្ងៃសីលចំនួន ${toKh(rows.length)} · ${result.startIso} → ${result.endIso}`
                  )
                : ""}
            </div>
            {rows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--ink-dim)]">
                {t("No uposatha days found in this range.", "រកមិនឃើញថ្ងៃសីលក្នុងចន្លោះនេះទេ។")}
              </p>
            ) : (
              <div className="divide-y divide-[var(--ground-line)]">
                {rows.map((r) => (
                    <div key={r.iso} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                          <span lang="km" className="font-khmer text-base font-semibold text-[var(--ink)]">
                            {toKh(r.lunarDay)}{r.phaseName}
                          </span>
                          <span lang="km" className="font-khmer text-sm text-[var(--ink-dim)]">
                            {t(`Lunar month`, `ខែចន្ទគតិ`)}: {r.monthName}
                          </span>
                          <span className="text-xs text-[var(--ink-faint)]">
                            {r.iso} · {r.wdEn} / {r.wdKm}
                          </span>
                        </div>
                        <div lang="km" className="mt-0.5 text-xs text-[var(--ink-dim)]">
                          {t(TYPE_META[r.type].enDesc, TYPE_META[r.type].kmDesc)}
                        </div>
                      </div>
                      <span
                        lang="km"
                        className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${TYPE_META[r.type].cls}`}
                      >
                        {t(TYPE_META[r.type].en, TYPE_META[r.type].km)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t("How the four observance days map to lunar dates", "ការផ្គូផ្គងថ្ងៃសីលទាំងបួនជាមួយថ្ងៃចន្ទគតិ")}
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs leading-relaxed text-[var(--ink-dim)] sm:grid-cols-2">
              <p>{t("• 8th of waxing = ៨កើត — the 8th day after the new moon.", "• ៨កើត — ថ្ងៃទី ៨ បន្ទាប់ពីថ្ងៃរោចចុងខែ (ថ្ងៃខ្មែរឡើង ៨)។")}</p>
              <p>{t("• 15th of waxing = ១៥កើត — full moon (ពេញបូណ៌មី).", "• ១៥កើត — ពេញបូណ៌មី។")}</p>
              <p>{t("• 8th of waning = ៨រោច — the 8th day after the full moon.", "• ៨រោច — ថ្ងៃទី ៨ បន្ទាប់ពីពេញបូណ៌មី។")}</p>
              <p>{t("• 15th of waning = the last waning day (១៤រោច ឬ ១៥រោច) — new-moon day.", "• រោចចុងខែ (១៤រោច ឬ ១៥រោច តាមចំនួនថ្ងៃនៃខែ) — ជាថ្ងៃចុងខែ។")}</p>
            </div>
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Computed approximation of the traditional observance days: the Khmer lunar date for every day is derived with the @thyrith/momentkh library (MIT — the same engine as the Khmer Lunar Month Calendar tool), which follows the traditional Khmer astronomical tables; individual calendar editions can differ by a day. Verify with your local pagoda calendar (ប្រតិទិនវត្ត) before planning.",
          "ការគណនានេះជាតម្លៃប្រហាក់ប្រហែលនៃថ្ងៃសីលតាមប្រពៃណី៖ ថ្ងៃចន្ទគតិសម្រាប់រាល់ថ្ងៃ គណនាដោយបណ្ណាល័យ @thyrith/momentkh (អាជ្ញាបណ្ណ MIT — ប្រើម៉ាស៊ីនតែមួយជាមួយឧបករណ៍ប្រតិទិនចន្ទគតិប្រចាំខែ) ដែលតាមតារាងតារាសាស្ត្រខ្មែរប្រពៃណី; ប្រតិទិននីមួយៗអាចខុសមួយថ្ងៃ។ សូមផ្ទៀងផ្ទាត់ជាមួយប្រតិទិនវត្តក្នុងមូលដ្ឋាន មុនរៀបចំផែនការ។"
        )}
      </p>
    </ToolShell>
  );
}

"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import momentkh from "@thyrith/momentkh";

const KH = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => (KH[Number(d)] ?? d)).join("");

export default function FullLunarDate() {
  const [date, setDate] = useToolState("full-lunar-date:date", new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    if (!date) return null;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    try {
      return momentkh.fromGregorian(y, m, d, 12, 0, 0);
    } catch {
      return null;
    }
  }, [date]);

  const newYear = useMemo(() => {
    if (!date) return null;
    const y = Number(date.slice(0, 4));
    if (!y) return null;
    try {
      return momentkh.getNewYear(y);
    } catch {
      return null;
    }
  }, [date]);

  const valid = result !== null;
  const k = result?.khmer;

  const fullLine = valid ? momentkh.format(result) : "";
  const dayPhase = k ? `${toKh(k.day)}${k.moonPhaseName}` : "";

  return (
    <ToolShell
      title="Khmer Full Lunar Date"
      khmerTitle="ប្រតិទិនចន្ទគតិខ្មែរពេញលេញ"
      description="Convert a Gregorian date to the full traditional Khmer lunisolar calendar date — lunar day and moon phase (កើត/រោច), lunar month, animal year, ស័ក cycle, and ពុទ្ធសករាជ (Buddhist Era) year. Uses the same astronomical algorithm (Moha Songkran / lunar month tables) as the traditional Khmer calendar, computed entirely in your browser — no data leaves your device."
    >
      <Field label="Gregorian date">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48 font-mono-ui" />
      </Field>

      <Output label="Full Khmer date" value={fullLine} error={!valid} mono={false} />

      {k && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="ថ្ងៃទី / Day" value={`${dayPhase}`} sub={k.moonPhase === 0 ? "waxing" : "waning"} />
          <StatCard label="ខែ / Month" value={k.monthName} />
          <StatCard label="ថ្ងៃនៃសប្តាហ៍ / Weekday" value={k.dayOfWeekName} />
          <StatCard label="ឆ្នាំសត្វ / Animal year" value={k.animalYearName} />
          <StatCard label="ស័ក / Sak" value={k.sakName} />
          <StatCard label="ព.ស. / Buddhist Era" value={toKh(k.beYear)} sub={`B.E. ${k.beYear}`} />
        </div>
      )}

      {newYear && (
        <Output
          label={`Khmer New Year (មហាសង្រ្កាន្ត) ${date.slice(0, 4)}`}
          value={`${newYear.day}/${newYear.month}/${newYear.year} — ${String(newYear.hour).padStart(2, "0")}:${String(newYear.minute).padStart(2, "0")}`}
          mono
        />
      )}

      <p className="text-xs text-[var(--ink-faint)]">
        Buddhist Era year advances at midnight on the first waning day of ខែពិសាខ (Pisakh); animal year advances at the
        exact moment of Moha Songkran; ស័ក advances at midnight on Lerng Sak — so the three counters can briefly disagree
        with a naive "add 543 / add one animal" expectation around New Year. That's expected traditional-calendar behavior,
        not a bug.
      </p>
    </ToolShell>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="font-khmer text-base text-[var(--ink)]">{value}</div>
      {sub && <div className="text-[10px] text-[var(--ink-faint)]">{sub}</div>}
    </div>
  );
}

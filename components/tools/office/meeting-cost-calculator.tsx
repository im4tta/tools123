"use client";
import { useEffect, useRef, useState } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function MeetingCostCalculator() {
  const { text: t } = useLanguage();
  const [people, setPeople] = useToolState("meeting-cost:people", "6");
  const [rate, setRate] = useToolState("meeting-cost:rate", "5");
  const [minutes, setMinutes] = useToolState("meeting-cost:minutes", "60");

  // Live mode: cost ticks up while the meeting runs.
  const [live, setLive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!live) return;
    const started = Date.now() - elapsed * 1000;
    const timer = window.setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const n = Math.max(0, Number(people) || 0);
  const hourly = Math.max(0, Number(rate) || 0);
  const mins = Math.max(0, Number(minutes) || 0);
  const minutesUsed = live ? elapsed / 60 : mins;
  const cost = n * hourly * (minutesUsed / 60);

  const perPerson = n > 0 ? cost / n : 0;
  const perMinute = minutesUsed > 0 ? cost / minutesUsed : 0;

  const money = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const clock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <ToolShell
      title="Meeting Cost Calculator"
      khmerTitle="គណនាចំណាយការប្រជុំ"
      description="See what a meeting costs while it runs: attendees × average hourly rate × time. Includes a live ticking mode."
      descriptionKm="មើលចំណាយការប្រជុំពេលដំណើរការ៖ ចំនួនអ្នកចូលរួម × អត្រាម៉ោងមធ្យម × ពេលវេលា។ មានរបៀបមើលផ្ទាល់។"
    >
      <Row>
        <Field label={t("Attendees", "ចំនួនអ្នកចូលរួម")}>
          <TextInput type="number" min="0" step="1" value={people} onChange={(e) => setPeople(e.target.value)} />
        </Field>
        <Field label={t("Average hourly cost per person", "ចំណាយមធ្យមក្នុងមួយមនុស្ស/ម៉ោង")} hintKm={t("Your own figure", "តម្លៃរបស់អ្នក")}>
          <TextInput type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      {!live && (
        <Field label={t("Planned duration (minutes)", "រយៈពេលផែនការ (នាទី)")}>
          <TextInput type="number" min="0" step="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </Field>
      )}

      <div className="flex flex-wrap gap-3">
        {!live ? (
          <button type="button" onClick={() => { setElapsed(0); setLive(true); }} className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
            {t("Start live meeting", "ចាប់ផ្តើមផ្ទាល់")}
          </button>
        ) : (
          <button type="button" onClick={() => setLive(false)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)]">
            {t("Pause", "ផ្អាក")}
          </button>
        )}
        <button type="button" onClick={() => { setLive(false); setElapsed(0); }} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
          {t("Reset", "កំណត់ឡើងវិញ")}
        </button>
      </div>

      {live && (
        <Output label={t("Elapsed", "ពេលកន្លងទៅ")} value={`${clock(elapsed)} — ${money(cost)}`} />
      )}

      <div className="space-y-2">
        <Output label={t("Meeting cost so far", "ចំណាយការប្រជុំដល់ពេលនេះ")} value={money(cost)} />
        <Output label={t("Cost per person", "ចំណាយក្នុងមួយមនុស្ស")} value={money(perPerson)} />
        <Output label={t("Cost per minute", "ចំណាយក្នុងមួយនាទី")} value={money(perMinute)} />
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formula: attendees × hourly cost × hours. The hourly cost is whatever you enter — the tool does not know your salaries, so treat the result as a rough estimate, in whatever currency you typed.", "រូបមន្ត៖ អ្នកចូលរួម × ចំណាយម៉ោង × ម៉ោង។ អត្រាម៉ោងជាតម្លៃដែលអ្នកបញ្ចូល — ឧបករណ៍មិនដឹងប្រាក់ខែពិតទេ ដូច្នេះចាត់ទុកលទ្ធផលជាការប៉ាន់ស្មានប្រហាក់ប្រហែល ជារូបិយបណ្ណដែលអ្នកបានប្រើ។")}
      </p>
    </ToolShell>
  );
}

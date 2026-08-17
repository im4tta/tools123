"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const FIELDS: { key: string; label: string; km: string }[] = [
  { key: "minute", label: "Minute (0-59)", km: "នាទី (0-59)" },
  { key: "hour", label: "Hour (0-23)", km: "ម៉ោង (0-23)" },
  { key: "dom", label: "Day of month (1-31)", km: "ថ្ងៃនៃខែ (1-31)" },
  { key: "month", label: "Month (1-12)", km: "ខែ (1-12)" },
  { key: "dow", label: "Day of week (0-6, Sun=0)", km: "ថ្ងៃនៃសប្ដាហ៍ (0-6, អាទិត្យ=0)" },
];

const PRESETS = [
  { key: "* * * * *", label: "Every minute" },
  { key: "*/5 * * * *", label: "Every 5 minutes" },
  { key: "0 * * * *", label: "Every hour" },
  { key: "0 9 * * *", label: "Daily at 9am" },
  { key: "0 9 * * 1-5", label: "Weekdays at 9am" },
  { key: "0 0 * * 0", label: "Sunday midnight" },
  { key: "0 12 1 * *", label: "1st of month at noon" },
  { key: "*/15 * * * *", label: "Every 15 minutes" },
  { key: "0 0 * * *", label: "Midnight daily" },
];

function nextRuns(expr: string, n = 5): string[] {
  try {
    const [min, hour, , , dow] = expr.split(/\s+/);
    const out: string[] = [];
    const start = new Date();
    for (let i = 0; out.length < n && i < 365 * 5; i++) {
      const d = new Date(start.getTime() + i * 60 * 1000);
      const matchesMin = min === "*" || min.split(",").includes(String(d.getMinutes()));
      const matchesHour = hour === "*" || hour.split(",").includes(String(d.getHours()));
      const matchesDow = dow === "*" || dow.split(",").includes(String(d.getDay()));
      if (matchesMin && matchesHour && matchesDow) out.push(d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    }
    return out;
  } catch {
    return [];
  }
}

export default function CronBuilder() {
  const { text: t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>({ minute: "0", hour: "9", dom: "*", month: "*", dow: "*" });

  const expr = useMemo(
    () => [values.minute, values.hour, values.dom, values.month, values.dow].join(" "),
    [values],
  );

  const runs = useMemo(() => nextRuns(expr), [expr]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <ToolShell
      title="Cron Expression Builder"
      khmerTitle="បង្កើត Cron Expression"
      description="Build a cron expression field by field and preview upcoming run times."
      descriptionKm="បង្កើត cron expression តាមវាលនីមួយៗ និងមើលជាមុនពេលដំណើរការខាងមុខ។"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FIELDS.map((f) => (
          <Field key={f.key} label={t(f.label, f.km)}>
            <input
              className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </Field>
        ))}
      </div>

      <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 font-mono-ui text-xl font-semibold text-[var(--ink)]">
        {expr}
      </div>

      <Field label={t("Presets", "គំរូ")}>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                const [minute, hour, dom, month, dow] = p.key.split(/\s+/);
                setValues({ minute, hour, dom, month, dow });
              }}
              className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <Output
        label={t("Next 5 runs", "ការដំណើរការ ៥ បន្ទាប់")}
        value={runs.join("\n")}
        mono={false}
      />
    </ToolShell>
  );
}
"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export default function RunningPace() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("pace:mode", "timePace");
  const [distance, setDistance] = useToolState("pace:distance", "5");
  const [unit, setUnit] = useToolState("pace:unit", "km");
  const [timeMin, setTimeMin] = useToolState("pace:timeMin", "30");
  const [paceMin, setPaceMin] = useToolState("pace:paceMin", "6");
  const [paceSec, setPaceSec] = useToolState("pace:paceSec", "0");

  const calc = useMemo(() => {
    const d = Number(distance);
    if (Number.isNaN(d) || d <= 0) return null;
    const factor = unit === "km" ? 1000 : 1609.344;
    if (mode === "timePace") {
      const sec = Number(timeMin) * 60;
      if (Number.isNaN(sec) || sec < 0) return null;
      return {
        pace: sec / d,
        speed: (d * factor) / sec,
        finish: sec,
      };
    }
    const paceSecTotal = Number(paceMin) * 60 + Number(paceSec);
    if (Number.isNaN(paceSecTotal) || paceSecTotal <= 0) return null;
    return {
      pace: paceSecTotal,
      speed: factor / paceSecTotal,
      finish: paceSecTotal * d,
    };
  }, [mode, distance, unit, timeMin, paceMin, paceSec]);

  return (
    <ToolShell
      title="Running Pace Calculator"
      khmerTitle="គណនាល្បឿនរត់"
      description="Convert between distance, time, pace, and speed for running."
      descriptionKm="បម្លែងរវាងចម្ងាយ ពេលវេលា ចង្វាក់ និងល្បឿនរត់។"
    >
      <Field label={t("Calculate", "គណនា")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="timePace">{t("Time + distance → pace", "ពេល + ចម្ងាយ → ចង្វាក់")}</option>
          <option value="paceTime">{t("Pace + distance → time", "ចង្វាក់ + ចម្ងាយ → ពេល")}</option>
        </Select>
      </Field>
      <Row>
        <Field label={t("Distance", "ចម្ងាយ")}>
          <TextInput inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} />
        </Field>
        <Field label={t("Unit", "ឯកតា")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="km">{t("Kilometers", "គីឡូម៉ែត្រ")}</option>
            <option value="mi">{t("Miles", "ម៉ាយ")}</option>
          </Select>
        </Field>
        {mode === "timePace" ? (
          <Field label={t("Time (minutes)", "ពេល (នាទី)")}>
            <TextInput inputMode="numeric" value={timeMin} onChange={(e) => setTimeMin(e.target.value)} />
          </Field>
        ) : (
          <Field label={t("Pace (min:sec per unit)", "ចង្វាក់ (នាទី:វិនាទី)")}>
            <div className="grid grid-cols-2 gap-2">
              <TextInput inputMode="numeric" value={paceMin} onChange={(e) => setPaceMin(e.target.value)} />
              <TextInput inputMode="numeric" value={paceSec} onChange={(e) => setPaceSec(e.target.value)} />
            </div>
          </Field>
        )}
      </Row>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Pace", "ចង្វាក់")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">
              {fmtTime(calc.pace)} /{unit === "km" ? "km" : "mi"}
            </div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Speed", "ល្បឿន")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.speed.toFixed(2)} {unit === "km" ? "km/h" : "mph"}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Finish time", "ពេលបញ្ចប់")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{fmtTime(calc.finish)}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid values.", "សូមបញ្ចូលតម្លៃឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}
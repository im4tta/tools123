"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Number(n.toPrecision(6)));
}

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50];

export default function OneRepMax() {
  const { text } = useLanguage();
  const [weightStr, setWeight] = useToolState("one-rep-max:weight", "100");
  const [repsStr, setReps] = useToolState("one-rep-max:reps", "5");
  const [unit, setUnit] = useToolState("one-rep-max:unit", "kg");

  const weight = Number(weightStr);
  const reps = Number(repsStr);
  const valid = !isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0 && reps < 37;

  const epley = valid ? weight * (1 + reps / 30) : NaN;
  const brzycki = valid ? weight * (36 / (37 - reps)) : NaN;
  const lombardi = valid ? weight * Math.pow(reps, 0.1) : NaN;
  const oconner = valid ? weight * (1 + reps / 40) : NaN;
  const average = valid ? (epley + brzycki + lombardi + oconner) / 4 : NaN;

  return (
    <ToolShell
      title="One-Rep Max (1RM) Calculator"
      description="Estimate your one-rep max from weight and reps using Epley, Brzycki, Lombardi, and O'Conner formulas."
    >
      <div className="space-y-4">
        <Row>
          <Field label="Weight lifted">
            <TextInput inputMode="decimal" value={weightStr} onChange={(e) => setWeight(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="Reps">
            <TextInput inputMode="decimal" value={repsStr} onChange={(e) => setReps(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>

        <div className="flex flex-wrap gap-2">
          {["kg", "lb"].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition ${unit === u ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}
            >
              {u === "kg" ? "kg" : "lb"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Output label="Epley" value={valid ? `${fmt(epley)} ${unit}` : ""} error={!valid} />
          <Output label="Brzycki" value={valid ? `${fmt(brzycki)} ${unit}` : ""} error={!valid} />
          <Output label="Lombardi" value={valid ? `${fmt(lombardi)} ${unit}` : ""} error={!valid} />
          <Output label="O'Conner" value={valid ? `${fmt(oconner)} ${unit}` : ""} error={!valid} />
        </div>

        <Output label="Average 1RM" value={valid ? `${fmt(average)} ${unit}` : ""} error={!valid} />

        {valid && (
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <th className="px-3 py-2 text-left">{text("% of 1RM", "% នៃ 1RM")}</th>
                  <th className="px-3 py-2 text-right">{text("Weight", "ទម្ងន់")}</th>
                  <th className="px-3 py-2 text-right">{text("Reps", "ចំនួនដង")}</th>
                </tr>
              </thead>
              <tbody>
                {PERCENTAGES.map((pct) => {
                  const w = (average * pct) / 100;
                  const estReps = Math.max(1, Math.round(30 * (average / w - 1)));
                  return (
                    <tr key={pct} className="border-b border-[var(--ground-line)] last:border-0">
                      <td className="px-3 py-2 font-medium text-[var(--ink)]">{pct}%</td>
                      <td className="px-3 py-2 text-right font-mono-ui text-[var(--ink)]">{fmt(w)} {unit}</td>
                      <td className="px-3 py-2 text-right font-mono-ui text-[var(--ink-dim)]">{w > 0 ? estReps : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
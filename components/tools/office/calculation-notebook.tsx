"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type NotebookWall = { id: string; name: string; width: string; height: string };

const DEFAULT_WALLS: NotebookWall[] = [
  { id: "wall-a", name: "Wall A", width: "5", height: "2.8" },
  { id: "wall-b", name: "Wall B", width: "4", height: "2.8" },
];

function number(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function format(value: number, maximumFractionDigits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

export default function CalculationNotebook() {
  const { text: t } = useLanguage();
  const [project, setProject] = useToolState("calculation-notebook:project", "House Renovation");
  const [walls, setWalls] = useToolState<NotebookWall[]>("calculation-notebook:walls", DEFAULT_WALLS);
  const [coverage, setCoverage] = useToolState("calculation-notebook:coverage", "3.6");
  const [price, setPrice] = useToolState("calculation-notebook:price", "20.71");
  const unit = "m²";

  const calculations = useMemo(() => {
    const rows = walls.map((wall) => ({ ...wall, area: number(wall.width) * number(wall.height) }));
    const totalArea = rows.reduce((sum, row) => sum + row.area, 0);
    const coverageValue = number(coverage);
    const liters = coverageValue > 0 ? Math.ceil(totalArea / coverageValue) : 0;
    const estimatedCost = liters * number(price);
    return { rows, totalArea, liters, estimatedCost };
  }, [walls, coverage, price]);

  function updateWall(id: string, patch: Partial<NotebookWall>) {
    setWalls((current) => current.map((wall) => wall.id === id ? { ...wall, ...patch } : wall));
  }

  function addWall() {
    setWalls((current) => [...current, { id: `wall-${Date.now()}`, name: `Wall ${String.fromCharCode(65 + current.length)}`, width: "", height: "" }]);
  }

  return (
    <ToolShell title="Calculation Notebook" khmerTitle="សៀវភៅកត់ត្រាការគណនា" description="Build a live project calculation with dependent values that update automatically when an input changes." descriptionKm="បង្កើតការគណនាគម្រោងផ្ទាល់ដែលតម្លៃពាក់ព័ន្ធធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិ នៅពេលកែតម្លៃបញ្ចូល។">
      <Row>
        <Field label={t("Project", "គម្រោង")}><TextInput value={project} onChange={(event) => setProject(event.target.value)} /></Field>
        <Field label={t("Paint coverage (m²/L)", "សមត្ថភាពគ្របថ្នាំ (ម²/លីត្រ)")}><TextInput type="number" min="0" step="0.1" value={coverage} onChange={(event) => setCoverage(event.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Field label={t("Paint cost per liter", "ថ្លៃថ្នាំក្នុងមួយលីត្រ")}><TextInput type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="font-mono-ui" /></Field>

      <section className="overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-4 py-3">
          <h2 className="font-display font-semibold text-[var(--ink)]">{project || t("Calculation Notebook", "សៀវភៅកត់ត្រាការគណនា")}</h2>
          <button type="button" onClick={addWall} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-bold text-[#0a0c0d] hover:bg-[var(--gold-dim)]"><Plus size={14} /> {t("Add line", "បន្ថែមបន្ទាត់")}</button>
        </div>
        <div className="divide-y divide-[var(--ground-line)]">
          {calculations.rows.map((wall) => (
            <div key={wall.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(8rem,1fr)_6rem_6rem_minmax(7rem,auto)_auto] sm:items-end">
              <Field label={t("Line", "បន្ទាត់")}><TextInput value={wall.name} onChange={(event) => updateWall(wall.id, { name: event.target.value })} /></Field>
              <Field label={t("Width", "ទទឹង")}><TextInput type="number" min="0" step="0.1" value={wall.width} onChange={(event) => updateWall(wall.id, { width: event.target.value })} className="font-mono-ui" /></Field>
              <Field label={t("Height", "កម្ពស់")}><TextInput type="number" min="0" step="0.1" value={wall.height} onChange={(event) => updateWall(wall.id, { height: event.target.value })} className="font-mono-ui" /></Field>
              <div><p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Live area", "ផ្ទៃផ្ទាល់")}</p><p className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-3 py-2 font-mono-ui text-sm font-bold text-[var(--gold)]">{format(wall.area)} {unit}</p></div>
              <button type="button" onClick={() => setWalls((current) => current.filter((item) => item.id !== wall.id))} disabled={walls.length <= 1} className="flex h-9 items-center justify-center rounded-md border border-[var(--ground-line)] px-3 text-[var(--ink-faint)] hover:border-[var(--danger)]/50 hover:text-[var(--danger)] disabled:opacity-30" aria-label={t("Remove line", "លុបបន្ទាត់")}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]">{t("Total Paint Area", "ផ្ទៃសរុបសម្រាប់លាបថ្នាំ")}</p><p className="mt-1 font-mono-ui text-2xl font-bold text-[var(--gold)]">{format(calculations.totalArea)} {unit}</p></div>
        <div className="rounded-xl border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]">{t("Paint Needed", "បរិមាណថ្នាំត្រូវការ")}</p><p className="mt-1 font-mono-ui text-2xl font-bold text-[var(--ink)]">≈ {format(calculations.liters, 0)} {t("liters", "លីត្រ")}</p></div>
        <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]">{t("Estimated Cost", "ថ្លៃប៉ាន់ស្មាន")}</p><p className="mt-1 font-mono-ui text-2xl font-bold text-[var(--ink)]">${format(calculations.estimatedCost)}</p></div>
      </section>
    </ToolShell>
  );
}

"use client";

// Unit Price Comparator — work out which package size is actually cheaper.
// Shops price the same product in different sizes and currencies of measure
// (500 g vs 1.2 kg, 330 ml vs 1.5 L), which makes the sticker price useless for
// comparison. This normalises every row to one base unit, ranks them, and shows
// how much more each option costs than the cheapest. Every number here comes
// from what you type — nothing is looked up or assumed. Original Tools123
// implementation.

import { useMemo } from "react";
import { Plus, Trash2, Trophy } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";

type FamilyId = "weight" | "volume" | "count" | "length";

// Option labels are plain English on purpose: the shared <Select> localises
// literal option text through the central UI dictionary (lib/i18n-ui), so
// passing a pre-joined bilingual string here would get localised a second time.
// The labels are spelled out rather than bare symbols ("grams (g)", not "g") so
// they are unambiguous dictionary keys.
interface Family {
  id: FamilyId;
  en: string;
  /** Unit options, each with how many base units it represents. */
  units: { id: string; en: string; factor: number }[];
  /** Base unit the comparison is reported in (e.g. 1 kg = 1000 base grams). */
  basis: { per: number; en: string; km: string };
}

const FAMILIES: Family[] = [
  {
    id: "weight",
    en: "Weight",
    units: [
      { id: "g", en: "grams (g)", factor: 1 },
      { id: "kg", en: "kilograms (kg)", factor: 1000 },
      { id: "mg", en: "milligrams (mg)", factor: 0.001 },
    ],
    basis: { per: 1000, en: "per kg", km: "ក្នុង ១ គីឡូក្រាម" },
  },
  {
    id: "volume",
    en: "Volume",
    units: [
      { id: "ml", en: "millilitres (ml)", factor: 1 },
      { id: "l", en: "litres (L)", factor: 1000 },
    ],
    basis: { per: 1000, en: "per L", km: "ក្នុង ១ លីត្រ" },
  },
  {
    id: "count",
    en: "Count",
    units: [{ id: "pc", en: "pieces", factor: 1 }],
    basis: { per: 1, en: "per piece", km: "ក្នុង ១ ដុំ" },
  },
  {
    id: "length",
    en: "Length",
    units: [
      { id: "cm", en: "centimetres (cm)", factor: 1 },
      { id: "m", en: "metres (m)", factor: 100 },
    ],
    basis: { per: 100, en: "per m", km: "ក្នុង ១ ម៉ែត្រ" },
  },
];

interface Row {
  id: string;
  label: string;
  price: string;
  qty: string;
  unit: string;
  /** Packs in a multi-buy (e.g. a 6-pack of 330 ml cans). Blank/1 = single. */
  packs: string;
}

const newRow = (label: string, unit: string): Row => ({
  id: Math.random().toString(36).slice(2, 9),
  label,
  price: "",
  qty: "",
  unit,
  packs: "",
});

const num = (s: string): number | null => {
  const v = parseFloat(s.replace(/,/g, "").trim());
  return Number.isFinite(v) ? v : null;
};

/** Trim trailing zeros but keep small values readable (0.0042 stays 0.0042). */
function money(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 3 : 5;
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export default function UnitPriceComparator() {
  const { text: t } = useLanguage();
  const [familyId, setFamilyId] = useToolState<FamilyId>("unit-price:family", "weight");
  const [currency, setCurrency] = useToolState("unit-price:currency", "$");
  const [rows, setRows] = useToolState<Row[]>("unit-price:rows", [
    { id: "a", label: "Option A", price: "", qty: "", unit: "g", packs: "" },
    { id: "b", label: "Option B", price: "", qty: "", unit: "kg", packs: "" },
  ]);

  const family = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0];

  // Keep every row on a unit that belongs to the selected family, so switching
  // from Weight to Volume can never leave a stale "kg" behind.
  const safeRows = useMemo(
    () => rows.map((r) => (family.units.some((u) => u.id === r.unit) ? r : { ...r, unit: family.units[0].id })),
    [rows, family],
  );

  const results = useMemo(() => {
    return safeRows.map((r) => {
      const price = num(r.price);
      const qty = num(r.qty);
      const packs = r.packs.trim() === "" ? 1 : num(r.packs);
      const unit = family.units.find((u) => u.id === r.unit) ?? family.units[0];
      const totalBase = qty != null && packs != null ? qty * unit.factor * packs : null;
      const valid = price != null && price >= 0 && totalBase != null && totalBase > 0;
      const perBasis = valid ? (price / totalBase) * family.basis.per : null;
      return { row: r, price, totalBase, perBasis, valid };
    });
  }, [safeRows, family]);

  const priced = results.filter((r) => r.valid && r.perBasis != null);
  const best = priced.length ? Math.min(...priced.map((r) => r.perBasis!)) : null;
  const worst = priced.length ? Math.max(...priced.map((r) => r.perBasis!)) : null;
  const spread = best != null && worst != null && best > 0 ? ((worst - best) / best) * 100 : null;

  const update = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((prev) => [...prev, newRow(`${t("Option", "ជម្រើស")} ${String.fromCharCode(65 + prev.length)}`, family.units[0].id)]);
  const removeRow = (id: string) => setRows((prev) => (prev.length <= 2 ? prev : prev.filter((r) => r.id !== id)));

  return (
    <ToolShell
      title="Unit Price Comparator"
      khmerTitle="ប្រៀបធៀបតម្លៃក្នុងមួយឯកតា"
      description="Find out which pack size is genuinely cheaper. Enter the price and size of each option — 500 g, 1.2 kg, a 6-pack of 330 ml — and every one is converted to the same base unit, ranked, and compared against the cheapest. All the figures are yours; nothing is looked up or assumed."
      descriptionKm="ដឹងថាទំហំកញ្ចប់ណាថោកជាងពិតប្រាកដ។ បញ្ចូលតម្លៃ និងទំហំនៃជម្រើសនីមួយៗ — ៥០០ ក្រាម ១.២ គីឡូ ឬកញ្ចប់ ៦ នៃ ៣៣០ មិល្លីលីត្រ — រួចទាំងអស់ត្រូវបម្លែងទៅឯកតាដូចគ្នា រៀបលំដាប់ និងប្រៀបធៀបនឹងតម្លៃថោកបំផុត។ គ្រប់តួលេខជារបស់អ្នក — គ្មានការរកមើល ឬសន្មត់ទេ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Compare by" labelKm="ប្រៀបធៀបតាម">
          <Select value={familyId} onChange={(e) => setFamilyId(e.target.value as FamilyId)}>
            {FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency symbol" labelKm="និមិត្តសញ្ញារូបិយប័ណ្ណ" hint="just a label" hintKm="គ្រាន់តែជាស្លាក">
          <TextInput value={currency} onChange={(e) => setCurrency(e.target.value.slice(0, 4))} placeholder="$" />
        </Field>
      </div>

      <div className="space-y-3">
        {results.map(({ row, perBasis, valid }) => {
          const isBest = valid && best != null && perBasis === best;
          const vsBest = valid && best != null && best > 0 && perBasis != null ? ((perBasis - best) / best) * 100 : null;
          return (
            <div
              key={row.id}
              className={`rounded-xl border p-3 transition ${
                isBest ? "border-[var(--success)]/50 bg-[var(--success)]/10" : "border-[var(--ground-line)] bg-[var(--ground-raised)]"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={row.label}
                  onChange={(e) => update(row.id, { label: e.target.value })}
                  aria-label={t("Option name", "ឈ្មោះជម្រើស")}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--ink)] outline-none"
                />
                {isBest && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--success)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
                    <Trophy size={10} /> {t("Cheapest", "ថោកបំផុត")}
                  </span>
                )}
                {rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label={t("Remove option", "លុបជម្រើស")}
                    className="shrink-0 rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--danger)]"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Field label="Price" labelKm="តម្លៃ">
                  <TextInput inputMode="decimal" value={row.price} onChange={(e) => update(row.id, { price: e.target.value })} placeholder="0.00" />
                </Field>
                <Field label="Size" labelKm="ទំហំ">
                  <TextInput inputMode="decimal" value={row.qty} onChange={(e) => update(row.id, { qty: e.target.value })} placeholder="500" />
                </Field>
                <Field label="Unit" labelKm="ឯកតា">
                  <Select value={row.unit} onChange={(e) => update(row.id, { unit: e.target.value })}>
                    {family.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.en}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Packs" labelKm="ចំនួនកញ្ចប់" hint="optional" hintKm="ស្រេចចិត្ត">
                  <TextInput inputMode="decimal" value={row.packs} onChange={(e) => update(row.id, { packs: e.target.value })} placeholder="1" />
                </Field>
              </div>

              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--ground-line)]/60 pt-2">
                <span className="text-xs text-[var(--ink-faint)]">{t(family.basis.en, family.basis.km)}</span>
                <span className="text-right">
                  {valid ? (
                    <>
                      <span className={`text-base font-semibold ${isBest ? "text-[var(--success)]" : "text-[var(--ink)]"}`}>
                        {currency}
                        {money(perBasis!)}
                      </span>
                      {vsBest != null && vsBest > 0.05 && (
                        <span className="ml-2 text-xs text-[var(--danger)]">+{vsBest.toFixed(1)}%</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-[var(--ink-faint)]">{t("enter price and size", "បញ្ចូលតម្លៃ និងទំហំ")}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
        >
          <Plus size={14} /> {t("Add option", "បន្ថែមជម្រើស")}
        </button>
        {spread != null && spread > 0.05 && (
          <p className="text-sm text-[var(--ink-dim)]">
            {t(
              `The priciest option costs ${spread.toFixed(1)}% more per unit than the cheapest.`,
              `ជម្រើសថ្លៃបំផុតថ្លៃជាងថោកបំផុត ${spread.toFixed(1)}% ក្នុងមួយឯកតា។`,
            )}
          </p>
        )}
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Original Tools123 implementation — plain unit arithmetic, no external data or pricing lookups.", "ជាការសរសេរដើមរបស់ Tools123 — គណិតឯកតាធម្មតា គ្មានទិន្នន័យខាងក្រៅ ឬការរកមើលតម្លៃទេ។")}</li>
          <li>{t("Unit conversions are exact metric definitions (1 kg = 1000 g, 1 L = 1000 ml, 1 m = 100 cm).", "ការបម្លែងឯកតាតាមនិយមន័យម៉ែត្រិកជាក់លាក់ (១ គ.ក = ១០០០ ក្រាម, ១ លីត្រ = ១០០០ មល, ១ ម = ១០០ សម)។")}</li>
          <li>{t("Everything is calculated in your browser; nothing is uploaded.", "គ្រប់ការគណនាធ្វើក្នុងកម្មវិធីរុករករបស់អ្នក គ្មានការផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

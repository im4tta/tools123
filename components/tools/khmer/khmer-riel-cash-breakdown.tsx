"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// Greedy note breakdown for a KHR amount. The default denominations are the
// commonly circulating National Bank of Cambodia riel banknotes, but the list
// is fully EDITABLE — treat it as a starting point, not an authoritative set.
const DEFAULT_DENOMS = "100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000";

function riel(n: number): string {
  return n.toLocaleString("en-US") + " ៛";
}

export default function KhmerRielCashBreakdown() {
  const { text: t } = useLanguage();
  const [amount, setAmount] = useToolState("riel-cash:amount", "137500");
  const [denomText, setDenomText] = useToolState("riel-cash:denoms", DEFAULT_DENOMS);

  const result = useMemo(() => {
    const denoms = [...new Set(
      denomText.split(/[,\s]+/).map((d) => Math.floor(Number(d.trim()))).filter((d) => Number.isFinite(d) && d > 0)
    )].sort((a, b) => b - a);
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    const target = remaining;
    const rows: { denom: number; count: number; subtotal: number }[] = [];
    for (const denom of denoms) {
      const count = Math.floor(remaining / denom);
      remaining -= count * denom;
      if (count > 0) rows.push({ denom, count, subtotal: count * denom });
    }
    const totalNotes = rows.reduce((s, r) => s + r.count, 0);
    return { rows, remainder: remaining, target, totalNotes, hasDenoms: denoms.length > 0 };
  }, [amount, denomText]);

  return (
    <ToolShell
      title="Khmer Riel Cash Breakdown"
      khmerTitle="ការបំបែកប្រាក់រៀលជាក្រដាស"
      description="Break a riel (KHR) amount into the fewest banknotes using a greedy split. Denominations are pre-filled with the common riel notes and are fully editable."
      descriptionKm="បំបែកចំនួនប្រាក់រៀល (KHR) ទៅជាក្រដាសប្រាក់តិចបំផុត។ ប្រភេទក្រដាសបំពេញស្រាប់ដោយក្រដាសរៀលទូទៅ ហើយអាចកែបានទាំងស្រុង។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Amount (KHR ៛)" labelKm="ចំនួនទឹកប្រាក់ (រៀល ៛)">
          <TextInput type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Denominations (comma-separated, editable)" labelKm="ប្រភេទក្រដាស (បំបែកដោយសញ្ញាក្បៀស អាចកែបាន)">
          <TextInput value={denomText} onChange={(e) => setDenomText(e.target.value)} className="font-mono-ui" />
        </Field>
      </div>

      {!result.hasDenoms && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {t("Enter at least one positive denomination.", "សូមបញ្ចូលប្រភេទក្រដាសវិជ្ជមានយ៉ាងតិចមួយ។")}
        </p>
      )}

      {result.hasDenoms && (
        <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[var(--ink)]">{t("Breakdown", "ការបំបែក")}</h2>
            <span className="text-xs text-[var(--ink-dim)]">{result.totalNotes} {t("notes", "សន្លឹក")}</span>
          </div>
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
                  <th className="p-2.5 font-medium">{t("Note", "ក្រដាស")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Count", "ចំនួន")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Subtotal", "សរុបរង")}</th>
                </tr>
              </thead>
              <tbody className="font-mono-ui text-[var(--ink)]">
                {result.rows.map((r) => (
                  <tr key={r.denom} className="border-b border-[var(--ground-line)]">
                    <td className="p-2.5">{riel(r.denom)}</td>
                    <td className="p-2.5 text-right font-semibold text-[var(--gold)]">× {r.count}</td>
                    <td className="p-2.5 text-right">{riel(r.subtotal)}</td>
                  </tr>
                ))}
                {result.rows.length === 0 && (
                  <tr><td className="p-2.5 text-[var(--ink-faint)]" colSpan={3}>{t("Amount is smaller than every denomination.", "ចំនួនតូចជាងគ្រប់ប្រភេទក្រដាស។")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {result.remainder > 0 && (
            <p className="text-xs text-[var(--ink-dim)]">
              {t("Remainder not coverable by these notes", "ចំនួននៅសល់ដែលក្រដាសទាំងនេះមិនអាចបំពេញ")}: <strong className="font-mono-ui text-[var(--danger)]">{riel(result.remainder)}</strong>
            </p>
          )}
        </section>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Uses a greedy split (largest notes first), which is optimal for the standard riel series. The default denominations are the commonly circulating notes — edit the list for coins, older, or commemorative notes as needed.",
          "ប្រើការបំបែកបែបលោភលន់ (ក្រដាសធំមុនគេ) ដែលល្អបំផុតសម្រាប់ស៊េរីរៀលស្តង់ដារ។ ប្រភេទក្រដាសលំនាំដើមជាក្រដាសដែលចរាចរទូទៅ — សូមកែបញ្ជីសម្រាប់កាក់ ក្រដាសចាស់ ឬក្រដាសរំលឹកតាមតម្រូវការ។"
        )}
      </p>
    </ToolShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Bookmark, Calculator, Copy, FileSpreadsheet, Image, Layers, Plus, RotateCcw, Save, Trash2, Wand } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const PALETTE = ["#0284c7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1", "#f97316"];
const CURRENCIES = [{ s: "$", n: "USD" }, { s: "€", n: "EUR" }, { s: "£", n: "GBP" }, { s: "៛", n: "KHR" }, { s: "¥", n: "JPY/CNY" }];

interface Row { id: number; label: string; percent: number; amount: number }

export default function IpcProportionCalculator() {
  const { text: t } = useLanguage();
  const [total, setTotal] = useToolState("ipc:total", "598069.68");
  const [rows, setRows] = useToolState<Row[]>("ipc:rows", [
    { id: 1, label: "Proportion 1 (76.8%)", percent: 76.8, amount: 0 },
    { id: 2, label: "Proportion 2 (12.7%)", percent: 12.7, amount: 0 },
    { id: 3, label: "Proportion 3 (10.5%)", percent: 10.5, amount: 0 },
  ]);
  const [currencyIdx, setCurrencyIdx] = useToolState("ipc:currency", 0);
  const [mode, setMode] = useToolState<"percent" | "amount">("ipc:mode", "percent");
  const [copied, setCopied] = useState(false);

  const currency = CURRENCIES[currencyIdx]?.s ?? "$";
  const totalNum = parseFloat(total) || 0;
  const sumPercent = rows.reduce((s, r) => s + r.percent, 0);
  const sumAmount = rows.reduce((s, r) => s + r.amount, 0);
  const formatMoney = (value: number) => value.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPercent = (value: number) => value.toFixed(2);
  const displayLabel = (row: Row) => row.label.replace(/\([^)]*\)/, `(${formatPercent(row.percent)}%)`);

  const excelTab = useMemo(() => {
    let out = `${currency} ${formatMoney(totalNum)}\n`;
    rows.forEach((r) => { out += `${formatPercent(r.percent)}%\t${currency} ${formatMoney(r.amount)}\n`; });
    return out;
  }, [rows, totalNum, currency]);

  const recalc = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        amount: mode === "percent" ? (totalNum * r.percent) / 100 : r.amount,
        percent: mode === "amount" && totalNum > 0 ? (r.amount / totalNum) * 100 : r.percent,
      }))
    );
  };

  function handleTotal(v: string) { setTotal(v); recalc(); }
  function handlePercent(idx: number, v: string) {
    setRows((p) => p.map((r, i) => (i === idx ? { ...r, percent: parseFloat(v) || 0 } : r)));
    recalc();
  }
  function handleAmount(idx: number, v: string) {
    setRows((p) => p.map((r, i) => (i === idx ? { ...r, amount: parseFloat(v) || 0 } : r)));
    recalc();
  }
  function handleLabel(idx: number, v: string) { setRows((p) => p.map((r, i) => (i === idx ? { ...r, label: v } : r))); }
  function addRow() { setRows((p) => [...p, { id: Date.now(), label: `Proportion #${p.length + 1}`, percent: 0, amount: 0 }]); }
  function removeRow(idx: number) { if (rows.length <= 1) return; setRows((p) => p.filter((_, i) => i !== idx)); }
  function setSplit(n: number) {
    const eq = Math.round(10000 / n) / 100;
    setRows(Array.from({ length: n }, (_, i) => ({ id: Date.now() + i, label: `Share ${String.fromCharCode(65 + i)}`, percent: i === n - 1 ? Math.round((100 - eq * (n - 1)) * 100) / 100 : eq, amount: 0 })));
  }
  function fillLast() {
    const sum = rows.slice(0, -1).reduce((s, r) => s + r.percent, 0);
    setRows((p) => p.map((r, i) => (i === p.length - 1 ? { ...r, percent: Math.max(0, Math.round((100 - sum) * 1e4) / 1e4) } : r)));
  }
  function normalize() {
    const s = rows.reduce((a, r) => a + r.percent, 0);
    if (s <= 0) return;
    setRows((p) => p.map((r) => ({ ...r, percent: Math.round((r.percent / s) * 1e6) / 1e4 })));
  }

  async function copyTable() {
    try { await navigator.clipboard.writeText(excelTab); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }

  const diffPct = Math.abs(sumPercent - 100) < 0.01 ? "balanced" : sumPercent < 100 ? "under" : "over";
  const statusCfg = {
    balanced: { cls: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30", dot: "bg-[var(--success)]" },
    under: { cls: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/30", dot: "bg-[var(--gold)]" },
    over: { cls: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30", dot: "bg-[var(--danger)]" },
  }[diffPct];

  return (
    <ToolShell
      title="IPC Proportion Calculator"
      khmerTitle="ម៉ាស៊ីនគណនាសមាមាត្រ IPC"
      description="Split an Interim Payment Certificate (IPC) amount by percentage or dollar value — with presets, history, and export."
      descriptionKm="គណនាបំបែកទឹកប្រាក់សំបុត្រទូទាត់ (IPC) តាមភាគរយ ឬតម្លៃ — មានគំរូ ប្រវត្តិ និងទាញចេញជាឯកសារ។"
    >
      {/* Top controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex items-center gap-1">
          {CURRENCIES.map((c, i) => (
            <button key={c.n} type="button" onClick={() => setCurrencyIdx(i)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${currencyIdx === i ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
              {c.s}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-0.5">
          <button type="button" onClick={() => setMode("percent")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "percent" ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)]"}`}>
            {t("By % Share", "តាមភាគរយ")}
          </button>
          <button type="button" onClick={() => setMode("amount")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "amount" ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)]"}`}>
            {t("By Amount", "តាមចំនួន")}
          </button>
        </div>
        <span className="ml-auto text-[11px] font-semibold text-[var(--ink-faint)]">{rows.length} {t("items", "ធាតុ")}</span>
      </div>

      {/* Total */}
      <div className="mb-5 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Total IPC Amount", "ចំនួនសរុប IPC")}</label>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[var(--ink)]">{currency}</span>
          <input type="number" step="any" value={total} onChange={(e) => handleTotal(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-4 py-3 font-mono-ui text-xl font-bold text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
        </div>
      </div>

      {/* Presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: t("3-Way Split", "បែង ៣"), fn: () => setSplit(3) },
          { label: t("2-Way Split", "បែង ២"), fn: () => setSplit(2) },
          { label: t("4-Way Split", "បែង ៤"), fn: () => setSplit(4) },
          { label: t("Retention 90/10", "ទុកប្រាក់ ៩០/១០"), fn: () => setRows([
            { id: 1, label: "Net Payable", percent: 90, amount: 0 },
            { id: 2, label: "Retention", percent: 10, amount: 0 },
          ]) },
        ].map((pr, i) => (
          <button key={i} type="button" onClick={pr.fn} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)] transition">{pr.label}</button>
        ))}
        <button type="button" onClick={fillLast} className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/10 transition"><Wand size={12} className="inline mr-1" />{t("Fill Last", "បំពេញចុងក្រោយ")}</button>
        <button type="button" onClick={normalize} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)] transition">{t("Scale → 100%", "ប្ដូរ → ១០០%")}</button>
      </div>

      {/* Rows */}
      <div className="mb-4 overflow-x-auto rounded-xl border border-[var(--ground-line)]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--ground-line)] bg-[var(--ground)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
            <tr>
              <th className="w-10 px-3 py-2.5 text-center">#</th>
              <th className="px-3 py-2.5">{t("Label", "ស្លាក")}</th>
              <th className="w-28 px-3 py-2.5 text-center">{t("% Share", "ភាគរយ")}</th>
              <th className="w-40 px-3 py-2.5 text-right">{t("Amount", "ចំនួន")}</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ground-line)]">
            {rows.map((r, i) => (
              <tr key={r.id} className="group hover:bg-[var(--ground)]/50 transition">
                <td className="px-3 py-2.5 text-center"><span className="inline-block h-3 w-3 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} /></td>
                <td className="px-3 py-2.5"><input value={displayLabel(r)} onChange={(e) => handleLabel(i, e.target.value)} className="w-full min-w-[120px] bg-transparent text-sm font-semibold text-[var(--ink)] outline-none hover:border-b hover:border-[var(--ground-line)] focus:border-b focus:border-[var(--gold-dim)]" /></td>
                <td className="px-3 py-2.5 text-center">
                  <div className="relative inline-block">
                    <input type="number" step="any" value={r.percent === 0 ? "0" : r.percent} disabled={mode === "amount"}
                      onChange={(e) => handlePercent(i, e.target.value)}
                      className={`w-24 rounded-md border px-2 py-1.5 text-center font-mono-ui text-xs font-bold outline-none ${mode === "amount" ? "bg-[var(--ground)] text-[var(--ink-faint)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink)] focus:border-[var(--gold-dim)]"}`} />
                    <span className="pointer-events-none absolute right-2.5 top-1.5 text-[10px] text-[var(--ink-faint)]">%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono-ui text-sm font-bold text-[var(--ink)]">{currency} {formatMoney(r.amount)}</td>
                <td className="px-3 py-2.5 text-center"><button type="button" onClick={() => removeRow(i)} className="invisible rounded p-1 text-[var(--ink-faint)] transition group-hover:visible hover:text-[var(--danger)]"><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--ground-line)] bg-[var(--ground)] font-bold">
              <td colSpan={2} className="px-3 py-2.5 text-[10px] uppercase text-[var(--ink-faint)]">{t("TOTAL", "សរុប")}</td>
              <td className="px-3 py-2.5 text-center font-mono-ui text-xs text-[var(--gold)]">{sumPercent.toFixed(2)}%</td>
              <td className="px-3 py-2.5 text-right font-mono-ui text-xs text-[var(--ink)]">{currency} {formatMoney(sumAmount)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mb-4 flex gap-2">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-[var(--ground)] transition hover:opacity-80"><Plus size={12} />{t("Add Row", "បន្ថែមជួរ")}</button>
        <button type="button" onClick={copyTable} className="flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
          {copied ? <span className="text-[var(--success)]">{t("Copied!", "បានចម្លង!")}</span> : <><Copy size={12} /> {t("Copy for Excel", "ចម្លងសម្រាប់ Excel")}</>}
        </button>
      </div>

      {/* Status */}
      <div className={`rounded-xl border p-4 ${statusCfg.cls}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
          <span className="text-sm font-bold">
            {diffPct === "balanced" ? t("100% Balanced", "១០០% ត្រឹមត្រូវ") : diffPct === "under" ? t("Under-allocated", "មិនទាន់គ្រប់") : t("Exceeds 100%", "លើស ១០០%")}
          </span>
          <span className="ml-auto font-mono-ui text-xs font-semibold">
            {diffPct === "balanced" ? `${currency} ${formatMoney(sumAmount)}` : `${currency} ${formatMoney(Math.abs(sumAmount - totalNum))} (${formatPercent(Math.abs(sumPercent - 100))}%)`}
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
          {rows.map((r, i) => r.percent > 0 ? (
            <div key={i} title={displayLabel(r)} style={{ width: `${Math.min(r.percent, 100)}%`, background: PALETTE[i % PALETTE.length] }} className="h-full border-r border-white/20" />
          ) : null)}
        </div>
      </div>
    </ToolShell>
  );
}

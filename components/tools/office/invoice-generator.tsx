"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface LineItem {
  desc: string;
  qty: string;
  price: string;
}

export default function InvoiceGenerator() {
  const { text: t } = useLanguage();
  const [business, setBusiness] = useToolState("invoice:business", "My Business Co., Ltd.");
  const [taxId, setTaxId] = useToolState("invoice:taxId", "");
  const [client, setClient] = useToolState("invoice:client", "");
  const [invoiceNo, setInvoiceNo] = useToolState("invoice:no", "INV-001");
  const [date, setDate] = useToolState("invoice:date", new Date().toISOString().slice(0, 10));
  const [vatOn, setVatOn] = useToolState("invoice:vat", "true");
  const [currency, setCurrency] = useToolState("invoice:currency", "usd");
  const [items, setItems] = useState<LineItem[]>([{ desc: "", qty: "1", price: "" }]);

  const update = (i: number, k: keyof LineItem, v: string) =>
    setItems((s) => s.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));

  const addRow = () => setItems((s) => [...s, { desc: "", qty: "1", price: "" }]);
  const removeRow = (i: number) => setItems((s) => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s));

  const calc = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const q = Number(it.qty) || 0;
      const p = Number(it.price) || 0;
      return sum + q * p;
    }, 0);
    const vat = vatOn === "true" ? subtotal * 0.1 : 0;
    return { subtotal, vat, total: subtotal + vat };
  }, [items, vatOn]);

  const sym = currency === "usd" ? "$" : "៛";
  const fmt = (n: number) =>
    currency === "usd"
      ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${Math.round(n).toLocaleString("en-US")} ៛`;

  return (
    <ToolShell
      title="Invoice Generator"
      khmerTitle="បង្កើតវិក្កយបត្រ"
      description="Build a printable invoice with line items, optional 10% VAT, and auto totals."
      descriptionKm="បង្កើតវិក្កយបត្រដែលអាចបោះពុម្ពបាន ជាមួយធាតុបន្ទាត់ អាករ ១០% ស្រេចចិត្ត និងសរុបដោយស្វ័យប្រវត្តិ។"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("Your business", "ឈ្មោះអាជីវកម្ម")}>
          <TextInput value={business} onChange={(e) => setBusiness(e.target.value)} />
        </Field>
        <Field label={t("Tax ID (VATIN)", "លេខអត្តសញ្ញាណសារពើពន្ធ")}>
          <TextInput value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        </Field>
        <Field label={t("Bill to (client)", "អតិថិជន")}>
          <TextInput value={client} onChange={(e) => setClient(e.target.value)} />
        </Field>
        <Row>
          <Field label={t("Invoice no.", "លេខវិក្កយបត្រ")}>
            <TextInput value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </Field>
          <Field label={t("Date", "កាលបរិច្ឆេទ")}>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </Row>
        <Field label={t("Currency", "រូបិយប័ណ្ណ")}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="usd">$ USD</option>
            <option value="khr">៛ Riel</option>
          </Select>
        </Field>
        <Field label={t("Add 10% VAT", "បន្ថែមអាករ ១០%")}>
          <Select value={vatOn} onChange={(e) => setVatOn(e.target.value)}>
            <option value="true">{t("Yes", "បាទ")}</option>
            <option value="false">{t("No", "ទេ")}</option>
          </Select>
        </Field>
      </div>

      <div className="mt-2 overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              <th className="px-3 py-2">{t("Item", "ធាតុ")}</th>
              <th className="w-20 px-3 py-2">{t("Qty", "ចំនួន")}</th>
              <th className="w-28 px-3 py-2">{t("Unit price", "តម្លៃឯកតា")}</th>
              <th className="w-28 px-3 py-2 text-right">{t("Line total", "សរុបបន្ទាត់")}</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-1.5">
                  <input
                    className="w-full bg-transparent py-1 text-sm text-[var(--ink)] outline-none"
                    value={it.desc}
                    placeholder={t("Description", "ការពណ៌នា")}
                    onChange={(e) => update(i, "desc", e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    inputMode="numeric"
                    className="w-full bg-transparent py-1 text-sm text-[var(--ink)] outline-none"
                    value={it.qty}
                    onChange={(e) => update(i, "qty", e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    inputMode="decimal"
                    className="w-full bg-transparent py-1 text-sm text-[var(--ink)] outline-none"
                    value={it.price}
                    onChange={(e) => update(i, "price", e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5 text-right text-[var(--ink)]">
                  {sym}
                  {(((Number(it.qty) || 0) * (Number(it.price) || 0)).toLocaleString("en-US", { maximumFractionDigits: 2 }))}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button type="button" onClick={() => removeRow(i)} className="text-xs text-[var(--danger)] hover:underline">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-[var(--gold-dim)] px-3 py-1.5 text-sm text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
        >
          + {t("Add item", "បន្ថែមធាតុ")}
        </button>
        <div className="ml-auto w-full max-w-xs space-y-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-sm">
          <div className="flex justify-between text-[var(--ink-dim)]">
            <span>{t("Subtotal", "សរុបរង")}</span>
            <span className="text-[var(--ink)]">{fmt(calc.subtotal)}</span>
          </div>
          {vatOn === "true" && (
            <div className="flex justify-between text-[var(--ink-dim)]">
              <span>{t("VAT (10%)", "អាករ (១០%)")}</span>
              <span className="text-[var(--ink)]">{fmt(calc.vat)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--ground-line)] pt-1 text-base font-semibold">
            <span className="text-[var(--ink)]">{t("Total", "សរុប")}</span>
            <span className="text-[var(--gold)]">{fmt(calc.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ground-base)] transition hover:opacity-90"
        >
          {t("Print / Save PDF", "បោះពុម្ព / រក្សាទុក PDF")}
        </button>
        <button
          type="button"
          onClick={() => {
            const header = `${business}\n${taxId ? `${t("Tax ID", "លេខពន្ធ")}: ${taxId}\n` : ""}${t("Invoice", "វិក្កយបត្រ")}: ${invoiceNo}\t${date}\n${t("Bill to", "អតិថិជន")}: ${client}\n\n${items
              .map((it) => `${it.desc}\t${it.qty}\t${it.price}\t${(Number(it.qty) || 0) * (Number(it.price) || 0)}`)
              .join("\n")}\n\n${t("Total", "សរុប")}: ${fmt(calc.total)}`;
            navigator.clipboard.writeText(header);
          }}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
        >
          {t("Copy as text", "ចម្លងជាអត្ថបទ")}
        </button>
      </div>
    </ToolShell>
  );
}
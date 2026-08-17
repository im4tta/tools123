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

  const fmtPdf = (n: number) =>
    currency === "usd"
      ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(n).toLocaleString("en-US") + " KHR";

  const [exporting, setExporting] = useState(false);

  const downloadPdf = async () => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    setExporting(true);
    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const W = 595.28;
      const margin = 50;
      const right = W - margin;
      const ink = rgb(0.15, 0.16, 0.17);
      const dim = rgb(0.45, 0.46, 0.48);
      const gold = rgb(0.78, 0.62, 0.2);
      const line = rgb(0.86, 0.87, 0.88);

      let y = 841.89 - margin;

      const wrapText = (text: string, size: number, maxWidth: number) => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const word of words) {
          const test = cur ? cur + " " + word : word;
          if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
            lines.push(cur);
            cur = word;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      };

      page.drawText(business || "Untitled Business", { x: margin, y, size: 20, font: bold, color: ink });
      y -= 18;
      if (taxId) {
        page.drawText(`Tax ID: ${taxId}`, { x: margin, y, size: 10, font, color: dim });
        y -= 14;
      }
      page.drawText("INVOICE", { x: right, y: 841.89 - margin + 8, size: 26, font: bold, color: gold });
      page.drawText(`Invoice No.: ${invoiceNo}`, { x: right - font.widthOfTextAtSize(`Invoice No.: ${invoiceNo}`, 10), y: 841.89 - margin - 26, size: 10, font, color: dim });
      page.drawText(`Date: ${date}`, { x: right - font.widthOfTextAtSize(`Date: ${date}`, 10), y: 841.89 - margin - 40, size: 10, font, color: dim });

      page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1, color: line });
      y -= 28;
      page.drawText("BILL TO", { x: margin, y, size: 9, font: bold, color: dim });
      y -= 15;
      page.drawText(client || "-", { x: margin, y, size: 12, font: bold, color: ink });
      y -= 40;

      const colItem = margin;
      const colQty = 300;
      const colPrice = 360;
      const colAmt = 445;
      const colW = right - margin;
      const headerY = y;

      const cells: { x: number; label: string; align: "left" | "right" }[] = [
        { x: colItem, label: "Item", align: "left" },
        { x: colQty, label: "Qty", align: "left" },
        { x: colPrice, label: "Unit Price", align: "right" },
        { x: colAmt, label: "Amount", align: "right" },
      ];

      page.drawRectangle({ x: margin, y: headerY - 24, width: colW, height: 24, color: rgb(0.97, 0.95, 0.9) });
      for (const c of cells) {
        const cx = c.align === "right" ? c.x + 100 - font.widthOfTextAtSize(c.label, 9) : c.x;
        page.drawText(c.label, { x: cx, y: headerY - 17, size: 9, font: bold, color: dim });
      }
      y = headerY - 24 - 8;

      const empty = items.length === 0 || items.every((it) => !it.desc && !it.price);
      if (empty) {
        page.drawText("(no line items)", { x: margin, y, size: 10, font, color: dim });
        y -= 24;
      } else {
        for (const it of items) {
          if (!it.desc && !it.price) continue;
          const amount = (Number(it.qty) || 0) * (Number(it.price) || 0);
          const descLines = wrapText(it.desc || "-", 10, colQty - colItem - 12);
          const rowH = Math.max(18, descLines.length * 12 + 4);
          page.drawRectangle({ x: margin, y: y - rowH, width: colW, height: rowH, color: rgb(1, 1, 1) });
          page.drawLine({ start: { x: margin, y: y - rowH }, end: { x: right, y: y - rowH }, thickness: 0.5, color: line });
          descLines.forEach((l, i) => page.drawText(l, { x: colItem, y: y - 2 - i * 12, size: 10, font, color: ink }));
          page.drawText(String(Number(it.qty) || 0), { x: colQty, y: y - 2, size: 10, font, color: ink });
          page.drawText(fmtPdf(Number(it.price) || 0), { x: colPrice + 70 - font.widthOfTextAtSize(fmtPdf(Number(it.price) || 0), 10), y: y - 2, size: 10, font, color: ink });
          page.drawText(fmtPdf(amount), { x: colAmt + 100 - font.widthOfTextAtSize(fmtPdf(amount), 10), y: y - 2, size: 10, font: bold, color: ink });
          y -= rowH;
        }
      }

      y -= 16;
      const totals: { label: string; value: number; bold?: boolean; gold?: boolean }[] = [
        { label: "Subtotal", value: calc.subtotal },
      ];
      if (vatOn === "true") totals.push({ label: "VAT (10%)", value: calc.vat });
      totals.push({ label: "Total", value: calc.total, bold: true, gold: true });

      for (const row of totals) {
        const size = row.bold ? 12 : 10;
        page.drawText(row.label, { x: colItem, y, size, font: row.bold ? bold : font, color: dim });
        page.drawText(fmtPdf(row.value), { x: colAmt + 100 - font.widthOfTextAtSize(fmtPdf(row.value), size), y, size, font: row.bold ? bold : font, color: row.gold ? gold : ink });
        y -= 16;
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNo || "untitled"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  };

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
          onClick={() => void downloadPdf()}
          disabled={exporting}
          className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ground-base)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting ? t("Generating…", "កំពុងបង្កើត…") : t("Download PDF", "ទាញយក PDF")}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
        >
          {t("Print", "បោះពុម្ព")}
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
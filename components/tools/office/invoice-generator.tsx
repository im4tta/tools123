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
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const W = 595.28;
      const H = 841.89;
      const margin = 55;
      const right = W - margin;
      const contentW = right - margin;
      const ink = rgb(0.16, 0.17, 0.18);
      const dim = rgb(0.42, 0.43, 0.45);
      const gold = rgb(0.76, 0.6, 0.18);
      const softLine = rgb(0.88, 0.89, 0.9);
      const rowAlt = rgb(0.985, 0.985, 0.985);

      const tableX = {
        item: margin,
        qty: 295,
        price: 345,
        amount: 425,
        end: right,
      };
      const padX = 8;
      let y = H - margin;

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

      const newPage = () => {
        const p = pdf.addPage([W, H]);
        p.drawLine({ start: { x: margin, y: H - 88 }, end: { x: right, y: H - 88 }, thickness: 1.4, color: gold });
        return p;
      };
      let page = pdf.addPage([W, H]);

      // ---- Header ----
      page.drawText(business || "Untitled Business", { x: margin, y: H - 78, size: 22, font: bold, color: ink });
      if (taxId) page.drawText(`Tax ID: ${taxId}`, { x: margin, y: H - 95, size: 9.5, font, color: dim });
      page.drawText("INVOICE", { x: right - font.widthOfTextAtSize("INVOICE", 28), y: H - 78, size: 28, font: bold, color: gold });
      page.drawText(`Invoice No.: ${invoiceNo}`, { x: right - font.widthOfTextAtSize(`Invoice No.: ${invoiceNo}`, 9.5), y: H - 99, size: 9.5, font, color: dim });
      page.drawText(`Date: ${date}`, { x: right - font.widthOfTextAtSize(`Date: ${date}`, 9.5), y: H - 112, size: 9.5, font, color: dim });
      page.drawLine({ start: { x: margin, y: H - 120 }, end: { x: right, y: H - 120 }, thickness: 1.4, color: gold });
      y = H - 152;

      // ---- Bill to ----
      page.drawText("BILL TO", { x: margin, y, size: 9, font: bold, color: dim });
      page.drawText(client || "-", { x: margin, y: y - 17, size: 12.5, font: bold, color: ink });
      y -= 44;

      // ---- Items table ----
      const headH = 26;
      const drawHead = (p: typeof page) => {
        p.drawRectangle({ x: margin, y: y - headH, width: contentW, height: headH, color: gold });
        const heads = [
          { x: tableX.item, label: "Item", align: "left" },
          { x: tableX.qty, label: "Qty", align: "right" },
          { x: tableX.price, label: "Unit Price", align: "right" },
          { x: tableX.amount, label: "Amount", align: "right" },
        ];
        for (const h of heads) {
          const rightEdge = h.x === tableX.item ? tableX.qty : h.x === tableX.qty ? tableX.price : h.x === tableX.price ? tableX.amount : tableX.end;
          const hx = h.align === "right" ? rightEdge - padX - font.widthOfTextAtSize(h.label, 9.5) : h.x + padX;
          p.drawText(h.label, { x: hx, y: y - 17, size: 9.5, font: bold, color: rgb(1, 1, 1) });
        }
        p.drawLine({ start: { x: margin, y: y - headH }, end: { x: right, y: y - headH }, thickness: 0.8, color: gold });
      };
      drawHead(page);
      y -= headH + 4;

      const vLines = (p: typeof page, topY: number, bottomY: number) => {
        for (const x of [tableX.qty, tableX.price, tableX.amount]) {
          p.drawLine({ start: { x, y: topY }, end: { x, y: bottomY }, thickness: 0.4, color: softLine });
        }
      };

      const empty = items.length === 0 || items.every((it) => !it.desc && !it.price);
      const rows = empty ? [] : items.filter((it) => it.desc || it.price);

      for (let i = 0; i < rows.length; i++) {
        const it = rows[i];
        const amount = (Number(it.qty) || 0) * (Number(it.price) || 0);
        const descLines = wrapText(it.desc || "-", 10, tableX.qty - tableX.item - padX * 2);
        const rowH = Math.max(24, descLines.length * 12 + 10);

        if (y - rowH < 120) {
          page = newPage();
          y = H - margin;
          drawHead(page);
          y -= headH + 4;
        }

        const p = page;
        if (i % 2 === 1) p.drawRectangle({ x: margin, y: y - rowH, width: contentW, height: rowH, color: rowAlt });
        descLines.forEach((l, li) => p.drawText(l, { x: tableX.item + padX, y: y - 6 - li * 12, size: 10, font, color: ink }));
        p.drawText(String(Number(it.qty) || 0), { x: tableX.price - padX - font.widthOfTextAtSize(String(Number(it.qty) || 0), 10), y: y - 6, size: 10, font, color: ink });
        p.drawText(fmtPdf(Number(it.price) || 0), { x: tableX.amount - padX - font.widthOfTextAtSize(fmtPdf(Number(it.price) || 0), 10), y: y - 6, size: 10, font, color: ink });
        p.drawText(fmtPdf(amount), { x: tableX.end - padX - font.widthOfTextAtSize(fmtPdf(amount), 10), y: y - 6, size: 10, font: bold, color: ink });
        vLines(p, y, y - rowH);
        p.drawLine({ start: { x: margin, y: y - rowH }, end: { x: right, y: y - rowH }, thickness: 0.5, color: softLine });
        y -= rowH;
      }

      if (empty) {
        page.drawText("(no line items)", { x: margin + padX, y: y - 8, size: 10, font, color: dim });
        y -= 24;
      }

      // ---- Totals ----
      y -= 18;
      const totals = [
        { label: "Subtotal", value: calc.subtotal, strong: false },
      ];
      if (vatOn === "true") totals.push({ label: "VAT (10%)", value: calc.vat, strong: false });

      const totRight = right - padX;
      for (const t of totals) {
        page.drawText(t.label, { x: tableX.amount, y, size: 10, font, color: dim });
        page.drawText(fmtPdf(t.value), { x: totRight - font.widthOfTextAtSize(fmtPdf(t.value), 10), y, size: 10, font, color: ink });
        y -= 17;
      }
      y -= 4;
      const totalH = 26;
      page.drawRectangle({ x: tableX.amount, y: y - totalH, width: tableX.end - tableX.amount, height: totalH, color: gold });
      page.drawText("Total", { x: tableX.amount + padX, y: y - totalH / 2 - 4, size: 12, font: bold, color: rgb(1, 1, 1) });
      page.drawText(fmtPdf(calc.total), { x: totRight - font.widthOfTextAtSize(fmtPdf(calc.total), 12), y: y - totalH / 2 - 4, size: 12, font: bold, color: rgb(1, 1, 1) });

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
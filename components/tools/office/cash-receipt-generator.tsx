"use client";

// Cash Receipt / Voucher Generator — a numbered, printable, bilingual
// (English + Khmer) cash-receipt / payment-voucher PDF. Amounts are entered by
// the user; the "in words" line can be auto-filled (English) and edited freely
// (e.g. for Khmer). Khmer is shaped via the shared studio fonts. Runs locally.

import { useEffect, useRef, useState } from "react";
import { Download, Wand2 } from "lucide-react";
import { PDFDocument } from "happypdf";
import { embedStudioFont, hexToColor, STUDIO_FONTS } from "@/lib/studio/pdfShared";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

const W = 595.28; // A4 width
const H = 410; // receipt slip height
const INK = "#1c1a15", MUTED = "#6b6459", ACCENT = "#8a6d1f", RULE = "#c9bfa8";

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function under1000(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + under1000(n % 100) : "");
}
function intToWords(n: number): string {
  if (n === 0) return "zero";
  const scales = ["", " thousand", " million", " billion"];
  let s = "", i = 0;
  while (n > 0 && i < scales.length) {
    const c = n % 1000;
    if (c) s = under1000(c) + scales[i] + (s ? " " + s : "");
    n = Math.floor(n / 1000);
    i++;
  }
  return s;
}
function amountToWords(amount: number, currency: string): string {
  const whole = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - whole) * 100);
  const unit = currency === "KHR" ? "riel" : "US dollars";
  let out = `${intToWords(whole)} ${unit}`;
  if (currency !== "KHR" && cents) out += ` and ${intToWords(cents)} cents`;
  return (out.charAt(0).toUpperCase() + out.slice(1) + " only").replace(/\s+/g, " ");
}
const money = (n: number, c: string) => {
  const s = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: c === "KHR" ? 0 : 2, maximumFractionDigits: c === "KHR" ? 0 : 2 });
  return c === "KHR" ? `${s} ៛` : `$ ${s}`;
};
const numval = (s: string) => { const n = Number(String(s).replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };

async function buildReceipt(d: {
  org: string; orgAddr: string; receiptNo: string; date: string; payer: string; purpose: string;
  method: string; amount: string; currency: string; words: string; fontId: string;
}): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await embedStudioFont(doc, d.fontId, 700);
  const reg = await embedStudioFont(doc, d.fontId, 400);
  const ink = hexToColor(INK), muted = hexToColor(MUTED), accent = hexToColor(ACCENT), rule = hexToColor(RULE);
  const M = 40, right = W - M;
  page.drawRectangle({ x: M - 12, y: 24, width: W - (M - 12) * 2, height: H - 48, borderColor: rule, borderWidth: 1 });

  let y = H - 60;
  page.drawText(d.org || "Company", { x: M, y, font: bold, size: 16, color: ink });
  page.drawText("CASH RECEIPT · បង្កាន់ដៃ", { x: right - reg.widthOfTextAtSize("CASH RECEIPT · បង្កាន់ដៃ", 12), y: y + 2, font: bold, size: 12, color: accent });
  y -= 15;
  if (d.orgAddr) page.drawText(d.orgAddr, { x: M, y, font: reg, size: 9.5, color: muted });
  const noStr = `No. ${d.receiptNo || "—"}`;
  page.drawText(noStr, { x: right - reg.widthOfTextAtSize(noStr, 10), y, font: reg, size: 10, color: ink });
  y -= 13;
  const dateStr = `${d.date || "—"}`;
  page.drawText(`Date · កាលបរិច្ឆេទ: ${dateStr}`, { x: right - reg.widthOfTextAtSize(`Date · កាលបរិច្ឆេទ: ${dateStr}`, 9.5), y, font: reg, size: 9.5, color: muted });
  y -= 18;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: rule });
  y -= 26;

  const rowLabel = (label: string, value: string, valueBold = false) => {
    page.drawText(label, { x: M, y, font: reg, size: 10, color: muted });
    page.drawText(value || "—", { x: M + 150, y, font: valueBold ? bold : reg, size: valueBold ? 12 : 11, color: ink });
    page.drawLine({ start: { x: M + 148, y: y - 4 }, end: { x: right, y: y - 4 }, thickness: 0.5, color: rule, opacity: 0.7 });
    y -= 28;
  };
  rowLabel("Received from · បានទទួលពី", d.payer);
  rowLabel("The sum of · ចំនួនទឹកប្រាក់", money(numval(d.amount), d.currency), true);
  // amount in words
  page.drawText("In words · ជាអក្សរ", { x: M, y, font: reg, size: 10, color: muted });
  const words = d.words || amountToWords(numval(d.amount), d.currency);
  page.drawText(words, { x: M + 150, y, font: reg, size: 10, color: ink });
  page.drawLine({ start: { x: M + 148, y: y - 4 }, end: { x: right, y: y - 4 }, thickness: 0.5, color: rule, opacity: 0.7 });
  y -= 28;
  rowLabel("For · សម្រាប់", d.purpose);
  rowLabel("Method · វិធីទូទាត់", d.method);

  // signatures
  y = 66;
  page.drawLine({ start: { x: right - 170, y }, end: { x: right, y }, thickness: 0.75, color: rule });
  page.drawText("Received by · អ្នកទទួលប្រាក់", { x: right - 170, y: y - 12, font: reg, size: 8.5, color: muted });
  page.drawText("Keep this receipt as proof of payment.", { x: M, y: 38, font: reg, size: 7.5, color: muted });

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export default function CashReceiptGenerator() {
  const { text: t } = useLanguage();
  const [org, setOrg] = useToolState("receipt:org", "Studio Company Ltd.");
  const [orgAddr, setOrgAddr] = useToolState("receipt:addr", "Phnom Penh, Cambodia");
  const [receiptNo, setReceiptNo] = useToolState("receipt:no", "0001");
  const [date, setDate] = useToolState("receipt:date", "2026-09-15");
  const [payer, setPayer] = useToolState("receipt:payer", "Chan Sreymom");
  const [purpose, setPurpose] = useToolState("receipt:purpose", "September rent");
  const [method, setMethod] = useToolState("receipt:method", "Cash");
  const [amount, setAmount] = useToolState("receipt:amount", "250");
  const [currency, setCurrency] = useToolState("receipt:cur", "USD");
  const [words, setWords] = useToolState("receipt:words", "");
  const [fontId, setFontId] = useToolState("receipt:font", "kantumruy");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setRendering(true);
      buildReceipt({ org, orgAddr, receiptNo, date, payer, purpose, method, amount, currency, words, fontId })
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (prev.current) URL.revokeObjectURL(prev.current);
          prev.current = url;
          setPdfUrl(url);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setRendering(false); });
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [org, orgAddr, receiptNo, date, payer, purpose, method, amount, currency, words, fontId]);

  useEffect(() => () => { if (prev.current) URL.revokeObjectURL(prev.current); }, []);

  return (
    <ToolShell
      title="Cash Receipt Generator"
      khmerTitle="បង្កើតបង្កាន់ដៃ"
      description="Create a numbered, printable bilingual (English + Khmer) cash-receipt or payment voucher. Enter the payer, amount, and purpose; the amount-in-words line can auto-fill and be edited freely. Khmer is shaped correctly. Everything runs locally."
      descriptionKm="បង្កើតបង្កាន់ដៃ ឬប័ណ្ណទូទាត់ពីរភាសា (អង់គ្លេស + ខ្មែរ) មានលេខរៀង និងអាចបោះពុម្ព។ បញ្ចូលអ្នកបង់ ចំនួនទឹកប្រាក់ និងគោលបំណង; បន្ទាត់ចំនួនជាអក្សរអាចបំពេញស្វ័យប្រវត្តិ និងកែបាន។ អក្សរខ្មែរបង្ហាញត្រឹមត្រូវ។ ដំណើរការក្នុងម៉ាស៊ីន។"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("Issuer / company", "អ្នកចេញ / ក្រុមហ៊ុន")}><TextInput value={org} onChange={(e) => setOrg(e.target.value)} /></Field>
            <Field label={t("Address", "អាសយដ្ឋាន")}><TextInput value={orgAddr} onChange={(e) => setOrgAddr(e.target.value)} /></Field>
            <Field label={t("Receipt no.", "លេខបង្កាន់ដៃ")}><TextInput value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} /></Field>
            <Field label={t("Date", "កាលបរិច្ឆេទ")}><TextInput value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label={t("Received from", "បានទទួលពី")}><TextInput value={payer} onChange={(e) => setPayer(e.target.value)} /></Field>
            <Field label={t("For (purpose)", "សម្រាប់ (គោលបំណង)")}><TextInput value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
            <Field label={t("Payment method", "វិធីទូទាត់")}>
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="Cash">{t("Cash", "សាច់ប្រាក់")}</option>
                <option value="Bank transfer">{t("Bank transfer", "ផ្ទេរតាមធនាគារ")}</option>
                <option value="Cheque">{t("Cheque", "មូលប្បទានប័ត្រ")}</option>
                <option value="Mobile / QR">{t("Mobile / QR", "ទូរស័ព្ទ / QR")}</option>
                <option value="Other">{t("Other", "ផ្សេងទៀត")}</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Amount", "ចំនួន")}><TextInput value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value)} /></Field>
              <Field label={t("Currency", "រូបិយប័ណ្ណ")}>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                </Select>
              </Field>
            </div>
          </div>
          <Field label={t("Amount in words", "ចំនួនជាអក្សរ")} hint={t("Auto-filled in English — edit for Khmer.", "បំពេញស្វ័យប្រវត្តិជាអង់គ្លេស — កែសម្រាប់ខ្មែរ។")}>
            <div className="flex gap-2">
              <TextInput value={words} placeholder={amountToWords(numval(amount), currency)} onChange={(e) => setWords(e.target.value)} className="flex-1" />
              <button onClick={() => setWords(amountToWords(numval(amount), currency))} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 text-xs text-[var(--ink)] transition hover:border-[var(--gold-dim)]"><Wand2 size={13} />{t("Auto", "ស្វ័យ")}</button>
            </div>
          </Field>
          <Field label={t("Khmer font", "ពុម្ពខ្មែរ")}>
            <Select value={fontId} onChange={(e) => setFontId(e.target.value)}>
              {STUDIO_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </Select>
          </Field>
        </div>

        <div className="space-y-2 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
            <span>{t("Live preview", "មើលផ្ទាល់")}</span><span>{rendering ? t("rendering…", "កំពុងបង្កើត…") : ""}</span>
          </div>
          {pdfUrl ? (
            <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title="Receipt preview" className="h-[320px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">{t("Building…", "កំពុងបង្កើត…")}</div>
          )}
          <button
            type="button"
            onClick={() => { if (!pdfUrl) return; const a = document.createElement("a"); a.href = pdfUrl; a.download = `receipt-${(receiptNo || "0001").replace(/[^\w-]+/g, "")}.pdf`; a.click(); recordExport(); }}
            disabled={!pdfUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
          >
            <Download size={15} />{t("Download receipt PDF", "ទាញយកបង្កាន់ដៃ")}
          </button>
        </div>
      </div>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("PDF with Khmer text shaping: HappyPDF (a pdf-lib fork, Seanghay Yath).", "PDF ជាមួយការរៀបអក្សរខ្មែរ: HappyPDF (fork របស់ pdf-lib, Seanghay Yath)។")}</li>
          <li>{t("Original Tools123 implementation; runs locally in your browser — nothing is uploaded.", "ការសរសេរដើមរបស់ Tools123; ដំណើរការក្នុងកម្មវិធីរុករក — គ្មានការផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}

"use client";

// Payslip Generator — turn payroll figures into a clean, printable bilingual
// (English + Khmer) payslip PDF. All amounts are entered by the user as line
// items; this tool only lays them out and totals them — it does not compute or
// assume any official tax/contribution rate. Khmer text is shaped correctly via
// the shared studio fonts (happypdf). Everything runs locally.

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { PDFDocument, PageSizes } from "happypdf";
import { embedStudioFont, hexToColor, STUDIO_FONTS } from "@/lib/studio/pdfShared";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

const W = PageSizes.A4[0]; // portrait width 595.28
const H = PageSizes.A4[1]; // portrait height 841.89

interface Line { label: string; amount: string }

const INK = "#1c1a15";
const MUTED = "#6b6459";
const ACCENT = "#8a6d1f";
const RULE = "#c9bfa8";

function money(n: number, currency: string): string {
  const s = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: currency === "KHR" ? 0 : 2, maximumFractionDigits: currency === "KHR" ? 0 : 2 });
  return currency === "KHR" ? `${s} ៛` : `$ ${s}`;
}
const num = (s: string) => { const n = Number(String(s).replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };

async function buildPayslip(data: {
  company: string; companyAddr: string; empName: string; empId: string; position: string;
  period: string; payDate: string; currency: string; fontId: string; earnings: Line[]; deductions: Line[];
}): Promise<Blob> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await embedStudioFont(doc, data.fontId, 700);
  const reg = await embedStudioFont(doc, data.fontId, 400);
  const ink = hexToColor(INK);
  const muted = hexToColor(MUTED);
  const accent = hexToColor(ACCENT);
  const rule = hexToColor(RULE);

  const M = 46; // margin
  const right = W - M;
  page.drawRectangle({ x: M - 14, y: 150, width: W - (M - 14) * 2, height: H - 150 - 60, borderColor: rule, borderWidth: 1 });

  let y = H - 80;
  const gross = data.earnings.reduce((s, l) => s + num(l.amount), 0);
  const totalDed = data.deductions.reduce((s, l) => s + num(l.amount), 0);
  const net = gross - totalDed;

  // Header
  page.drawText(data.company || "Company", { x: M, y, font: bold, size: 18, color: ink });
  page.drawText("PAYSLIP · ប័ណ្ណបើកប្រាក់ខែ", { x: right - reg.widthOfTextAtSize("PAYSLIP · ប័ណ្ណបើកប្រាក់ខែ", 12), y: y + 4, font: bold, size: 12, color: accent });
  y -= 16;
  if (data.companyAddr) { page.drawText(data.companyAddr, { x: M, y, font: reg, size: 9.5, color: muted }); }
  y -= 18;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: rule });
  y -= 22;

  // Employee / period block
  const label = (t: string, v: string, x: number, yy: number) => {
    page.drawText(t, { x, y: yy, font: reg, size: 8.5, color: muted });
    page.drawText(v || "—", { x, y: yy - 13, font: bold, size: 11, color: ink });
  };
  label("Employee · បុគ្គលិក", data.empName, M, y);
  label("Employee ID · លេខសម្គាល់", data.empId, M + 200, y);
  label("Pay period · ខែបើកប្រាក់", data.period, M + 340, y);
  y -= 40;
  label("Position · មុខតំណែង", data.position, M, y);
  label("Pay date · កាលបរិច្ឆេទ", data.payDate, M + 200, y);
  label("Currency · រូបិយប័ណ្ណ", data.currency, M + 340, y);
  y -= 42;

  // Two-column tables
  const colGap = 24;
  const colW = (right - M - colGap) / 2;
  const leftX = M;
  const rightX = M + colW + colGap;
  const topY = y;

  const drawTable = (x: number, title: string, items: Line[], totalLabel: string, total: number) => {
    let ty = topY;
    page.drawText(title, { x, y: ty, font: bold, size: 10.5, color: accent });
    ty -= 6;
    page.drawLine({ start: { x, y: ty }, end: { x: x + colW, y: ty }, thickness: 0.75, color: rule });
    ty -= 16;
    const rows = items.filter((l) => l.label || num(l.amount));
    if (rows.length === 0) { page.drawText("—", { x, y: ty, font: reg, size: 10, color: muted }); ty -= 16; }
    for (const l of rows) {
      page.drawText(l.label || "—", { x, y: ty, font: reg, size: 10, color: ink });
      const amt = money(num(l.amount), data.currency);
      page.drawText(amt, { x: x + colW - reg.widthOfTextAtSize(amt, 10), y: ty, font: reg, size: 10, color: ink });
      ty -= 16;
    }
    ty -= 4;
    page.drawLine({ start: { x, y: ty + 8 }, end: { x: x + colW, y: ty + 8 }, thickness: 0.75, color: rule });
    page.drawText(totalLabel, { x, y: ty - 4, font: bold, size: 10, color: ink });
    const tot = money(total, data.currency);
    page.drawText(tot, { x: x + colW - bold.widthOfTextAtSize(tot, 10), y: ty - 4, font: bold, size: 10, color: ink });
    return ty - 4;
  };

  const yLeft = drawTable(leftX, "EARNINGS · ប្រាក់ចំណូល", data.earnings, "Gross · សរុប", gross);
  const yRight = drawTable(rightX, "DEDUCTIONS · ការកាត់", data.deductions, "Total · សរុប", totalDed);
  y = Math.min(yLeft, yRight) - 34;

  // Net pay box
  const boxH = 44;
  page.drawRectangle({ x: M, y: y - boxH + 14, width: right - M, height: boxH, color: hexToColor("#f4eddb") });
  page.drawText("NET PAY · ប្រាក់សុទ្ធ", { x: M + 14, y: y - 8, font: bold, size: 13, color: ink });
  const netStr = money(net, data.currency);
  page.drawText(netStr, { x: right - 14 - bold.widthOfTextAtSize(netStr, 16), y: y - 10, font: bold, size: 16, color: accent });
  y -= boxH + 40;

  // Signatures
  page.drawLine({ start: { x: M, y }, end: { x: M + 150, y }, thickness: 0.75, color: rule });
  page.drawLine({ start: { x: right - 150, y }, end: { x: right, y }, thickness: 0.75, color: rule });
  page.drawText("Employee · បុគ្គលិក", { x: M, y: y - 12, font: reg, size: 8.5, color: muted });
  page.drawText("Employer · និយោជក", { x: right - 150, y: y - 12, font: reg, size: 8.5, color: muted });

  page.drawText("Generated with 123tool.app — figures are user-entered, not an official statement.", { x: M, y: 40, font: reg, size: 7.5, color: muted });

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

interface LineOps {
  change: (i: number, key: keyof Line, v: string) => void;
  add: () => void;
  remove: (i: number) => void;
}

function LineEditor({ items, ops, title }: { items: Line[]; ops: LineOps; title: string }) {
  const { text: t } = useLanguage();
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{title}</div>
      <div className="space-y-2">
        {items.map((l, i) => (
          <div key={i} className="flex gap-2">
            <TextInput value={l.label} placeholder={t("Label", "ស្លាក")} onChange={(e) => ops.change(i, "label", e.target.value)} className="flex-1" />
            <TextInput value={l.amount} placeholder="0" inputMode="decimal" onChange={(e) => ops.change(i, "amount", e.target.value)} className="w-28" />
            <button onClick={() => ops.remove(i)} className="rounded-md border border-[var(--ground-line)] px-2 text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={ops.add} className="inline-flex items-center gap-1 text-xs text-[var(--gold)] hover:underline"><Plus size={13} />{t("Add row", "បន្ថែមជួរ")}</button>
      </div>
    </div>
  );
}

export default function PayslipGenerator() {
  const { text: t } = useLanguage();
  const [company, setCompany] = useToolState("payslip:company", "Studio Company Ltd.");
  const [companyAddr, setCompanyAddr] = useToolState("payslip:addr", "Phnom Penh, Cambodia");
  const [empName, setEmpName] = useToolState("payslip:name", "Sok Dara");
  const [empId, setEmpId] = useToolState("payslip:id", "EMP-0142");
  const [position, setPosition] = useToolState("payslip:pos", "Project Engineer");
  const [period, setPeriod] = useToolState("payslip:period", "September 2026");
  const [payDate, setPayDate] = useToolState("payslip:date", "2026-09-30");
  const [currency, setCurrency] = useToolState("payslip:cur", "USD");
  const [fontId, setFontId] = useToolState("payslip:font", "kantumruy");
  const [earnings, setEarnings] = useToolState<Line[]>("payslip:earn", [{ label: "Basic salary", amount: "800" }, { label: "Allowance", amount: "100" }]);
  const [deductions, setDeductions] = useToolState<Line[]>("payslip:ded", [{ label: "NSSF", amount: "16" }, { label: "Advance", amount: "0" }]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrl = useRef<string | null>(null);

  const totals = useMemo(() => {
    const g = earnings.reduce((s, l) => s + num(l.amount), 0);
    const d = deductions.reduce((s, l) => s + num(l.amount), 0);
    return { gross: g, ded: d, net: g - d };
  }, [earnings, deductions]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setRendering(true);
      buildPayslip({ company, companyAddr, empName, empId, position, period, payDate, currency, fontId, earnings, deductions })
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
          prevUrl.current = url;
          setPdfUrl(url);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setRendering(false); });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [company, companyAddr, empName, empId, position, period, payDate, currency, fontId, earnings, deductions]);

  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); }, []);

  const editLine = (list: Line[], setList: (v: Line[]) => void) => ({
    change: (i: number, key: keyof Line, v: string) => setList(list.map((l, j) => (j === i ? { ...l, [key]: v } : l))),
    add: () => setList([...list, { label: "", amount: "" }]),
    remove: (i: number) => setList(list.filter((_, j) => j !== i)),
  });
  const eOps = editLine(earnings, setEarnings);
  const dOps = editLine(deductions, setDeductions);

  return (
    <ToolShell
      title="Payslip Generator"
      khmerTitle="បង្កើតប័ណ្ណបើកប្រាក់ខែ"
      description="Turn payroll figures into a clean, printable bilingual (English + Khmer) payslip PDF. You enter each earning and deduction as a line item; the tool lays them out and totals the net pay. Amounts are yours — no rates are assumed. Everything runs locally."
      descriptionKm="បម្លែងតួលេខប្រាក់ខែទៅជាប័ណ្ណបើកប្រាក់ខែ PDF ពីរភាសា (អង់គ្លេស + ខ្មែរ) ស្អាត និងអាចបោះពុម្ព។ អ្នកបញ្ចូលប្រាក់ចំណូល និងការកាត់នីមួយៗ; ឧបករណ៍រៀបចំ និងគណនាប្រាក់សុទ្ធ។ តួលេខជារបស់អ្នក — គ្មានការសន្មតអត្រាណាមួយ។ ដំណើរការក្នុងម៉ាស៊ីន។"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("Company", "ក្រុមហ៊ុន")}><TextInput value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
            <Field label={t("Company address", "អាសយដ្ឋាន")}><TextInput value={companyAddr} onChange={(e) => setCompanyAddr(e.target.value)} /></Field>
            <Field label={t("Employee name", "ឈ្មោះបុគ្គលិក")}><TextInput value={empName} onChange={(e) => setEmpName(e.target.value)} /></Field>
            <Field label={t("Employee ID", "លេខសម្គាល់")}><TextInput value={empId} onChange={(e) => setEmpId(e.target.value)} /></Field>
            <Field label={t("Position", "មុខតំណែង")}><TextInput value={position} onChange={(e) => setPosition(e.target.value)} /></Field>
            <Field label={t("Pay period", "ខែបើកប្រាក់")}><TextInput value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
            <Field label={t("Pay date", "កាលបរិច្ឆេទ")}><TextInput value={payDate} onChange={(e) => setPayDate(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Currency", "រូបិយប័ណ្ណ")}>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                </Select>
              </Field>
              <Field label={t("Khmer font", "ពុម្ពខ្មែរ")}>
                <Select value={fontId} onChange={(e) => setFontId(e.target.value)}>
                  {STUDIO_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </Select>
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LineEditor items={earnings} ops={eOps} title={t("Earnings", "ប្រាក់ចំណូល")} />
            <LineEditor items={deductions} ops={dOps} title={t("Deductions", "ការកាត់")} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-sm">
            <span className="text-[var(--ink-dim)]">{t("Gross", "សរុប")}: <b className="font-mono-ui text-[var(--ink)]">{money(totals.gross, currency)}</b></span>
            <span className="text-[var(--ink-dim)]">{t("Deductions", "ការកាត់")}: <b className="font-mono-ui text-[var(--ink)]">{money(totals.ded, currency)}</b></span>
            <span className="text-[var(--ink-dim)]">{t("Net pay", "ប្រាក់សុទ្ធ")}: <b className="font-mono-ui text-[var(--gold)]">{money(totals.net, currency)}</b></span>
          </div>
        </div>

        <div className="space-y-2 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
            <span>{t("Live preview", "មើលផ្ទាល់")}</span><span>{rendering ? t("rendering…", "កំពុងបង្កើត…") : ""}</span>
          </div>
          {pdfUrl ? (
            <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title="Payslip preview" className="h-[560px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
          ) : (
            <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">{t("Building…", "កំពុងបង្កើត…")}</div>
          )}
          <button
            type="button"
            onClick={() => { if (!pdfUrl) return; const a = document.createElement("a"); a.href = pdfUrl; a.download = `payslip-${empName.trim().replace(/\s+/g, "-").toLowerCase() || "employee"}.pdf`; a.click(); recordExport(); }}
            disabled={!pdfUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
          >
            <Download size={15} />{t("Download payslip PDF", "ទាញយកប័ណ្ណបើកប្រាក់ខែ")}
          </button>
        </div>
      </div>
    </ToolShell>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { PDFDocument } from "happypdf";
import qrcode from "qrcode-generator";
import {
  drawDashedLine,
  embedStudioFont,
  fitLines,
  hexToColor,
  STUDIO_FONTS,
} from "@/lib/studio/pdfShared";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const A4: [number, number] = [595.28, 841.89];

async function qrPngDataUrl(value: string): Promise<string> {
  const qr = qrcode(0, "M");
  qr.addData(value, "Byte");
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 0 });
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("qr render failed"));
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  });
  const size = 240;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

interface TicketOptions {
  eventTitle: string;
  dateLine: string;
  venue: string;
  priceLine: string;
  qrPrefix: string;
  startNumber: number;
  count: number;
  fontId: string;
  inkHex: string;
  accentHex: string;
}

async function generateTickets(o: TicketOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const [pw, ph] = A4;
  const ink = hexToColor(o.inkHex);
  const accent = hexToColor(o.accentHex);

  const titleFont = await embedStudioFont(pdfDoc, o.fontId, 700);
  const bodyFont = await embedStudioFont(pdfDoc, o.fontId, 400);
  const numFont = await embedStudioFont(pdfDoc, o.fontId, 600);

  let page = pdfDoc.addPage([pw, ph]);
  page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: hexToColor("#ffffff") });

  const marginX = 40;
  const ticketH = (ph - 80 - 4 * 14) / 5; // 5 tickets per page
  const ticketW = pw - marginX * 2;

  const pad = (n: number) => String(n).padStart(4, "0");

  for (let i = 0; i < o.count; i++) {
    const slot = i % 5;
    if (i > 0 && slot === 0) {
      page = pdfDoc.addPage([pw, ph]);
      page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: hexToColor("#ffffff") });
    }
    const top = ph - 40 - slot * (ticketH + 14);
    const number = o.startNumber + i;
    const serial = pad(number);

    // Ticket body
    page.drawRectangle({
      x: marginX,
      y: top - ticketH,
      width: ticketW,
      height: ticketH,
      borderColor: accent,
      borderWidth: 1.2,
    });

    // Left stub
    const stubW = 92;
    page.drawLine({
      start: { x: marginX + stubW, y: top - ticketH },
      end: { x: marginX + stubW, y: top },
      thickness: 0.8,
      color: accent,
      opacity: 0.6,
    });
    drawDashedLine(page, {
      start: { x: marginX + stubW, y: top - ticketH },
      end: { x: marginX + stubW, y: top },
      thickness: 0.8,
      color: accent,
      opacity: 0.9,
      dash: 3,
      gap: 3,
    });

    page.drawText("ADMIT ONE", {
      x: marginX + 10,
      y: top - 24,
      font: numFont,
      size: 9,
      color: accent,
    });
    const snW = numFont.widthOfTextAtSize(serial, 20);
    page.drawText(serial, {
      x: marginX + stubW / 2 - snW / 2,
      y: top - ticketH / 2 - 4,
      font: numFont,
      size: 20,
      color: ink,
    });
    const noW = bodyFont.widthOfTextAtSize(`No. ${serial}`, 8);
    page.drawText(`No. ${serial}`, {
      x: marginX + stubW / 2 - noW / 2,
      y: top - ticketH + 12,
      font: bodyFont,
      size: 8,
      color: ink,
      opacity: 0.7,
    });

    // Right section — event details
    const infoX = marginX + stubW + 18;
    const tFit = fitLines(titleFont, o.eventTitle || "Event", 17, 10, ticketW - stubW - 120, 46);
    let ty = top - 8 - tFit.size;
    tFit.lines.forEach((line) => {
      page.drawText(line, { x: infoX, y: ty, font: titleFont, size: tFit.size, color: ink });
      ty -= tFit.size * 1.25;
    });

    const detailLines = [o.dateLine, o.venue].filter((s) => s.trim());
    detailLines.forEach((line) => {
      page.drawText(line, { x: infoX, y: ty - 11, font: bodyFont, size: 10, color: ink, opacity: 0.85 });
      ty -= 15;
    });
    if (o.priceLine.trim()) {
      page.drawText(o.priceLine.trim(), { x: infoX, y: ty - 11, font: numFont, size: 10.5, color: accent });
    }

    // Optional QR at right
    if (o.qrPrefix.trim()) {
      try {
        const dataUrl = await qrPngDataUrl(`${o.qrPrefix.trim().replace(/\/$/, "")}/${serial}`);
        const png = await pdfDoc.embedPng(dataUrl);
        const qrSize = Math.min(ticketH - 20, 62);
        page.drawImage(png, {
          x: marginX + ticketW - qrSize - 14,
          y: top - ticketH + (ticketH - qrSize) / 2,
          width: qrSize,
          height: qrSize,
        });
      } catch {
        /* QR optional */
      }
    }

    // Tear line between tickets
    if (slot < 4 && i < o.count - 1) {
      drawDashedLine(page, {
        start: { x: marginX - 12, y: top - ticketH - 7 },
        end: { x: marginX + ticketW + 12, y: top - ticketH - 7 },
        thickness: 0.6,
        color: ink,
        opacity: 0.45,
        dash: 5,
        gap: 4,
      });
    }
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export default function EventTicketSheet() {
  const { text: t } = useLanguage();
  const [eventTitle, setEventTitle] = useToolState("ticket:event", "Khmer New Year Gala");
  const [dateLine, setDateLine] = useToolState("ticket:date", "14 April 2026 · 6:00 PM");
  const [venue, setVenue] = useToolState("ticket:venue", "Chaktomuk Hall, Phnom Penh");
  const [priceLine, setPriceLine] = useToolState("ticket:price", "$5.00");
  const [qrPrefix, setQrPrefix] = useToolState("ticket:qr", "");
  const [startStr, setStart] = useToolState("ticket:start", "1");
  const [countStr, setCount] = useToolState("ticket:count", "10");
  const [fontId, setFontId] = useToolState("ticket:font", "kantumruy");
  const [accentHex, setAccentHex] = useToolState("ticket:accent", "#b3402f");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const options = useMemo<TicketOptions>(
    () => ({
      eventTitle,
      dateLine,
      venue,
      priceLine,
      qrPrefix,
      startNumber: Math.max(1, Math.round(Number(startStr) || 1)),
      count: Math.min(500, Math.max(1, Math.round(Number(countStr) || 10))),
      fontId,
      inkHex: "#1a1a1a",
      accentHex,
    }),
    [eventTitle, dateLine, venue, priceLine, qrPrefix, startStr, countStr, fontId, accentHex],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setRendering(true);
      generateTickets(options)
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          setPdfUrl(url);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setRendering(false);
        });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [options]);

  useEffect(
    () => () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    },
    [],
  );

  return (
    <ToolShell
      title="Event Ticket Sheet"
      khmerTitle="សន្លឹកសំបុត្រព្រឹត្តិការណ៍"
      description="Generate numbered event tickets with tear lines and optional QR codes — print-ready A4 sheets."
      descriptionKm="បង្កើតសំបុត្រលេខរៀង ជាមួយបន្ទាត់បោះ និងកូដ QR បើចង់បាន — ទម្រង់ A4 ព្រឹត្តិការណ៍។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <Field label={t("Event title", "ឈ្មោះព្រឹត្តិការណ៍")}>
              <TextInput value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="font-khmer" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Date & time", "កាលបរិច្ឆេទ · ពេល")}>
                <TextInput value={dateLine} onChange={(e) => setDateLine(e.target.value)} className="font-khmer" />
              </Field>
              <Field label={t("Venue", "ទីតាំង")}>
                <TextInput value={venue} onChange={(e) => setVenue(e.target.value)} className="font-khmer" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label={t("Price line", "តម្លៃ")}>
                <TextInput value={priceLine} onChange={(e) => setPriceLine(e.target.value)} />
              </Field>
              <Field label={t("Start №", "លេខចាប់ផ្តើម")}>
                <TextInput inputMode="numeric" value={startStr} onChange={(e) => setStart(e.target.value)} className="font-mono-ui" />
              </Field>
              <Field label={t("Quantity", "ចំនួន")}>
                <TextInput inputMode="numeric" value={countStr} onChange={(e) => setCount(e.target.value)} className="font-mono-ui" />
              </Field>
              <Field label={t("Accent", "ពណ៌កំណត់")}>
                <input type="color" value={accentHex} onChange={(e) => setAccentHex(e.target.value)} className="h-[38px] w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-transparent" />
              </Field>
            </div>
            <Field label={t("QR link prefix (optional)", "តំណ QR (បើចង់បាន)")} hint="https://…/check-in/">
              <TextInput value={qrPrefix} onChange={(e) => setQrPrefix(e.target.value)} placeholder="https://example.com/ticket/" className="font-mono-ui" />
            </Field>
            <Field label={t("Font", "ពុម្ពអក្សរ")}>
              <select value={fontId} onChange={(e) => setFontId(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                {STUDIO_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
              <span>{t("Live PDF preview", "មើល PDF ជាមុន")}</span>
              <span>{rendering ? t("rendering…", "កំពុងបង្កើត…") : `${options.count} ${t("tickets", "សំបុត្រ")}`}</span>
            </div>
            {pdfUrl ? (
              <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title="Ticket preview" className="h-[520px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
            ) : (
              <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">
                …
              </div>
            )}
            <button type="button" onClick={() => { if (!pdfUrl) return; const a = document.createElement("a"); a.href = pdfUrl; a.download = "tickets.pdf"; a.click(); }} disabled={!pdfUrl} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
              <Download size={15} />{t("Download PDF", "ទាញយក PDF")}
            </button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
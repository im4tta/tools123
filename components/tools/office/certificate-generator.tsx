"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { PDFDocument, PageSizes } from "happypdf";
import {
  embedStudioFont,
  fitLines,
  hexToColor,
  STUDIO_FONTS,
} from "@/lib/studio/pdfShared";
import { ToolShell, TextArea, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const W = PageSizes.A4[1]; // landscape: 841.89
const H = PageSizes.A4[0];

interface CertMeta {
  org: string;
  course: string;
  dateLine: string;
  signerTitle: string;
  fontId: string;
  border: string;
  paper: string;
  ink: string;
}

function cornerRosette(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  cx: number,
  cy: number,
  rMax: number,
  color: ReturnType<typeof hexToColor>,
) {
  const rings = 5;
  for (let i = 0; i < rings; i++) {
    const r = rMax * (1 - i / rings);
    page.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: 0.5, opacity: 0, borderOpacity: 0.5 - i * 0.07 });
  }
}

async function generateCertificates(names: string[], m: CertMeta): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const border = hexToColor(m.border);
  const ink = hexToColor(m.ink);
  const paper = hexToColor(m.paper);

  for (const name of names) {
    const page = pdfDoc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });

    const displayFont = await embedStudioFont(pdfDoc, m.fontId, 700);
    const bodyFont = await embedStudioFont(pdfDoc, m.fontId, 400);
    const smallFont = await embedStudioFont(pdfDoc, m.fontId, 500);

    // Double border + inner hairline
    page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: border, borderWidth: 2.2 });
    page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: border, borderWidth: 0.7 });

    // Corner rosettes (concentric rings)
    const rMax = 26;
    cornerRosette(page, 44, 44, rMax, border);
    cornerRosette(page, W - 44, 44, rMax, border);
    cornerRosette(page, 44, H - 44, rMax, border);
    cornerRosette(page, W - 44, H - 44, rMax, border);

    const cx = W / 2;
    let y = H - 110;

    // Organisation
    if (m.org.trim()) {
      const org = fitLines(smallFont, m.org.toUpperCase(), 15, 9, W - 200, 40);
      org.lines.forEach((line, i) => {
        const w = smallFont.widthOfTextAtSize(line, org.size);
        page.drawText(line, { x: cx - w / 2, y: y - org.size * (i + 1) * 1.35, font: smallFont, size: org.size, color: ink, opacity: 0.85 });
      });
      y -= Math.max(1, org.lines.length) * org.size * 1.35 + 18;
    }

    // "Certificate" wordmark
    const certText = "CERTIFICATE";
    const certSize = 46;
    const cw = displayFont.widthOfTextAtSize(certText, certSize);
    page.drawText(certText, { x: cx - cw / 2, y: y - certSize, font: displayFont, size: certSize, color: border });
    y -= certSize * 1.5;

    // Award line
    const awardText = m.course.trim() || t_static();
    const award = fitLines(bodyFont, awardText, 14, 10, W - 220, 60);
    award.lines.forEach((line, i) => {
      const lw = bodyFont.widthOfTextAtSize(line, award.size);
      page.drawText(line, { x: cx - lw / 2, y: y - award.size * (i + 1) * 1.4, font: bodyFont, size: award.size, color: ink, opacity: 0.9 });
    });
    y -= Math.max(1, award.lines.length) * award.size * 1.4 + 34;

    // Recipient name — biggest element, auto-fit
    const nameFit = fitLines(displayFont, name || " ", 54, 20, W - 200, 120, 1.15);
    nameFit.lines.forEach((line, i) => {
      const nw = displayFont.widthOfTextAtSize(line, nameFit.size);
      page.drawText(line, { x: cx - nw / 2, y: y - nameFit.size * (i + 1) * 1.15, font: displayFont, size: nameFit.size, color: ink });
    });
    y -= nameFit.lines.length * nameFit.size * 1.15;

    // Rule under the name
    const ruleW = Math.min(W - 260, Math.max(200, displayFont.widthOfTextAtSize(nameFit.lines[0] ?? "", nameFit.size) + 40));
    page.drawLine({
      start: { x: cx - ruleW / 2, y: y - 6 },
      end: { x: cx + ruleW / 2, y: y - 6 },
      thickness: 1,
      color: border,
    });
    y -= 40;

    // Footer: date left, signer right
    if (m.dateLine.trim()) {
      page.drawText(m.dateLine.trim(), { x: 90, y: 78, font: smallFont, size: 11, color: ink, opacity: 0.8 });
      page.drawLine({ start: { x: 90, y: 70 }, end: { x: 250, y: 70 }, thickness: 0.7, color: border, opacity: 0.7 });
    }
    if (m.signerTitle.trim()) {
      const sig = m.signerTitle.trim();
      const sw = smallFont.widthOfTextAtSize(sig, 11);
      page.drawText(sig, { x: W - 90 - sw, y: 78, font: smallFont, size: 11, color: ink, opacity: 0.8 });
      page.drawLine({ start: { x: W - 250, y: 70 }, end: { x: W - 90, y: 70 }, thickness: 0.7, color: border, opacity: 0.7 });
    }
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

// Avoids an unused-var while keeping the default award text near its usage.
function t_static() {
  return "for outstanding participation and achievement";
}

export default function CertificateGenerator() {
  const { text: t } = useLanguage();
  const [org, setOrg] = useToolState("certificate:org", "123 Toolbox Academy");
  const [course, setCourse] = useToolState("certificate:course", "This certificate is proudly presented to");
  const [namesRaw, setNamesRaw] = useToolState("certificate:names", "សុខ ដារា\nChan Dara");
  const [dateLine, setDateLine] = useToolState("certificate:date", "Phnom Penh · 2026");
  const [signerTitle, setSignerTitle] = useToolState("certificate:signer", "Director");
  const [fontId, setFontId] = useToolState("certificate:font", "kantumruy");
  const [borderHex, setBorderHex] = useToolState("certificate:border", "#b3402f");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const names = useMemo(
    () => namesRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [namesRaw],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (names.length === 0) {
        setPdfUrl(null);
        return;
      }
      setRendering(true);
      generateCertificates(names, {
        org,
        course,
        dateLine,
        signerTitle,
        fontId,
        border: borderHex,
        paper: "#fdfbf5",
        ink: "#211b12",
      })
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
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [names, org, course, dateLine, signerTitle, fontId, borderHex]);

  useEffect(
    () => () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    },
    [],
  );

  return (
    <ToolShell
      title="Certificate Generator"
      khmerTitle="បង្កើតលិខិតសម្គាល់"
      description="Batch-generate decorated certificates with correctly shaped Khmer names — one PDF, one page per recipient."
      descriptionKm="បង្កើតលិខិតសម្គាល់ជាបាច់ ជាមួយឈ្មោះខ្មែរដែលបង្ហាញត្រឹមត្រូវ — មួយទំព័រក្នុងមួយឈ្មោះ។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t("Organisation", "អង្គភាព")}>
                <TextInput value={org} onChange={(e) => setOrg(e.target.value)} />
              </Field>
              <Field label={t("Date / place line", "ទីតាំង · កាលបរិច្ឆេទ")}>
                <TextInput value={dateLine} onChange={(e) => setDateLine(e.target.value)} />
              </Field>
            </div>
            <Field label={t("Award line", "បន្ទាត់រង្វាន់")}>
              <TextInput value={course} onChange={(e) => setCourse(e.target.value)} />
            </Field>
            <Field label={t("Recipient names (one per line)", "ឈ្មោះអ្នកទទួល (មួយក្នុងមួយបន្ទាត់)")}>
              <TextArea rows={7} value={namesRaw} onChange={(e) => setNamesRaw(e.target.value)} className="font-khmer" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t("Signer title", "ចំណងជើងអ្នកចុះឈ្មោះ")}>
                <TextInput value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} />
              </Field>
              <Field label={t("Font", "ពុម្ពអក្សរ")}>
                <select value={fontId} onChange={(e) => setFontId(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                  {STUDIO_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("Border color", "ពណ៌ស៊ុម")}>
                <input type="color" value={borderHex} onChange={(e) => setBorderHex(e.target.value)} className="h-[38px] w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-transparent" />
              </Field>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
              <span>{t("Live PDF preview", "មើល PDF ជាមុន")}</span>
              <span>{rendering ? t("rendering…", "កំពុងបង្កើត…") : `${names.length} ${t("pages", "ទំព័រ")}`}</span>
            </div>
            {pdfUrl ? (
              <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title="Certificate preview" className="h-[520px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
            ) : (
              <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">
                {t("Enter at least one name.", "សូមបញ្ចូលឈ្មោះយ៉ាងតិចមួយ។")}
              </div>
            )}
            <button type="button" onClick={() => { if (!pdfUrl) return; const a = document.createElement("a"); a.href = pdfUrl; a.download = "certificates.pdf"; a.click(); }} disabled={!pdfUrl} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
              <Download size={15} />{t("Download PDF", "ទាញយក PDF")}
            </button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
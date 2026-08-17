"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Field, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { recordExport } from "@/lib/export";

type Status =
  | "approved"
  | "approvedPartially"
  | "approvedWithComments"
  | "revisedResubmit"
  | "notApproved"
  | "commentsAttached"
  | "other";

const STATUS_OPTIONS: { value: Status; en: string; km: string }[] = [
  { value: "approved", en: "Approved", km: "អនុម័ត" },
  { value: "approvedPartially", en: "Approved Partially", km: "អនុម័តមួយផ្នែក" },
  { value: "approvedWithComments", en: "Approved with Comments", km: "អនុម័តជាមួយមតិយោបល់" },
  { value: "revisedResubmit", en: "Revised and Resubmit", km: "កែសម្រួល និងដាក់ជូនម្តងទៀត" },
  { value: "notApproved", en: "Not Approved", km: "មិនអនុម័ត" },
  { value: "commentsAttached", en: "Comments Attached", km: "មានមតិយោបល់ភ្ជាប់មកជាមួយ" },
  { value: "other", en: "Other Issue", km: "បញ្ហាផ្សេងទៀត" },
];

function downloadText(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
}

function downloadPdfBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  recordExport();
}

export default function RfaGenerator() {
  const { text } = useLanguage();
  const [meta, setMeta] = useState({
    contractor: "",
    contractPkgNo: "",
    referenceNo: "",
    toParty: "",
    dateSubmitted: "",
    receivedDate: "",
    resubmitted: false,
    submittalRevision: "",
  });
  const [subject, setSubject] = useState("");
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<Status>("approved");
  const [otherIssue, setOtherIssue] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [engineerDate, setEngineerDate] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractorDate, setContractorDate] = useState("");

  const statusLabel = useMemo(() => {
    const found = STATUS_OPTIONS.find((option) => option.value === status);
    if (!found) return "—";
    return text(found.en, found.km) + (status === "other" && otherIssue.trim() ? `: ${otherIssue.trim()}` : "");
  }, [status, otherIssue, text]);

  const [exporting, setExporting] = useState(false);

  const downloadPdf = async () => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    setExporting(true);
    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const margin = 50;
      const right = 595.28 - margin;
      const contentW = right - margin;
      const ink = rgb(0.15, 0.16, 0.17);
      const dim = rgb(0.45, 0.46, 0.48);
      const gold = rgb(0.78, 0.62, 0.2);
      const lineC = rgb(0.85, 0.86, 0.87);

      let y = 841.89 - margin;

      const wrap = (s: string, size: number, maxW: number) => {
        const words = s.split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const word of words) {
          const test = cur ? cur + " " + word : word;
          if (font.widthOfTextAtSize(test, size) > maxW && cur) {
            lines.push(cur);
            cur = word;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      };

      const section = (title: string) => {
        page.drawText(title, { x: margin, y, size: 11, font: bold, color: ink });
        y -= 4;
        page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1.2, color: gold });
        y -= 16;
      };

      const field = (label: string, value: string) => {
        page.drawText(label, { x: margin, y, size: 9, font: bold, color: dim });
        const lines = wrap(value, 10, contentW - 150);
        const lx = margin + 150;
        lines.forEach((l, i) => page.drawText(l, { x: lx, y: y - i * 13, size: 10, font, color: ink }));
        y -= Math.max(1, lines.length) * 13 + 4;
      };

      const para = (title: string, value: string, size = 10) => {
        section(title);
        const lines = wrap(value || "—", size, contentW);
        lines.forEach((l, i) => page.drawText(l, { x: margin, y: y - i * (size + 3), size, font, color: ink }));
        y -= lines.length * (size + 3) + 14;
      };

      page.drawText("REQUEST FOR APPROVAL", { x: margin, y, size: 18, font: bold, color: ink });
      y -= 6;
      page.drawText("(RFA)", { x: margin, y, size: 12, font, color: dim });
      page.drawText(`Ref: ${meta.referenceNo.trim() || "—"}`, { x: right - font.widthOfTextAtSize(`Ref: ${meta.referenceNo.trim() || "—"}`, 10), y: 841.89 - margin - 6, size: 10, font, color: dim });
      y -= 28;

      section("DETAILS");
      field("Contractor", meta.contractor.trim() || "—");
      field("Contract Package No.", meta.contractPkgNo.trim() || "—");
      field("To", meta.toParty.trim() || "—");
      field("Date Submitted", meta.dateSubmitted || "—");
      field("Received Date", meta.receivedDate || "—");
      field("Re-Submitted", meta.resubmitted ? "Yes" : "No");
      field("Submittal Revision", meta.submittalRevision.trim() || "—");
      y -= 6;

      para("SUBJECT OF SUBMISSION", subject.trim() || "—");
      para("ENGINEER'S COMMENTS", comments.trim() || "—");

      section("SUBMITTAL / COMMENTS STATUS");
      const stLines = wrap(statusLabel, 11, contentW - 24);
      const boxH = Math.max(24, stLines.length * 15 + 10);
      page.drawRectangle({ x: margin, y: y - boxH, width: contentW, height: boxH, color: rgb(0.98, 0.96, 0.9) });
      stLines.forEach((l, i) => page.drawText(l, { x: margin + 12, y: y - 16 - i * 15, size: 11, font: bold, color: gold }));
      y -= boxH + 20;

      section("SIGN-OFF");
      const colW = (contentW - 20) / 2;
      const leftCol = margin;
      const rightCol = margin + colW + 20;
      const signoff = [
        { title: "Engineer, hand over", name: engineerName, date: engineerDate },
        { title: "Contractor received", name: contractorName, date: contractorDate },
      ];
      signoff.forEach((s, i) => {
        const x = i === 0 ? leftCol : rightCol;
        page.drawText(s.title, { x, y, size: 10, font: bold, color: dim });
        page.drawLine({ start: { x, y: y - 34 }, end: { x: x + colW, y: y - 34 }, thickness: 0.8, color: lineC });
        page.drawText(`${s.name.trim() || "—"}`, { x, y: y - 46, size: 10, font, color: ink });
        page.drawText(`Date: ${s.date || "—"}`, { x, y: y - 60, size: 10, font, color: ink });
      });
      y -= 76;

      const note =
        "Note: The content of this approval does not relieve the Contractor from any of its obligations toward the works as per the drawings and specifications of the contract.";
      const nLines = wrap(note, 8.5, contentW);
      nLines.forEach((l, i) => page.drawText(l, { x: margin, y: y - i * 12, size: 8.5, font, color: dim }));
      y -= nLines.length * 12;

      const bytes = await pdf.save();
      downloadPdfBlob(bytes, `rfa-${meta.referenceNo || meta.dateSubmitted || "form"}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const output = useMemo(() => {
    const line = "─".repeat(52);
    return [
      text("REQUEST FOR APPROVAL (RFA)", "សំណើសុំការអនុម័ត (RFA)"),
      line,
      `${text("Contractor", "អ្នកម៉ៅការ")}: ${meta.contractor.trim() || "—"}`,
      `${text("Contract Package No.", "លេខកញ្ចប់កិច្ចសន្យា")}: ${meta.contractPkgNo.trim() || "—"}`,
      `${text("Reference No.", "លេខយោង")}: ${meta.referenceNo.trim() || "—"}`,
      `${text("To", "ជូនចំពោះ")}: ${meta.toParty.trim() || "—"}`,
      `${text("Date Submitted", "កាលបរិច្ឆេទដាក់ស្នើ")}: ${meta.dateSubmitted || "—"}`,
      `${text("Received Date", "កាលបរិច្ឆេទទទួល")}: ${meta.receivedDate || "—"}`,
      `${text("Re-Submitted", "ដាក់ស្នើម្តងទៀត")}: ${meta.resubmitted ? text("Yes", "បាទ/ចាស") : text("No", "ទេ")}`,
      `${text("Submittal Revision", "លេខកែសម្រួល")}: ${meta.submittalRevision.trim() || "—"}`,
      "",
      text("SUBJECT OF SUBMISSION", "ប្រធានបទនៃការដាក់ស្នើ"),
      line,
      subject.trim() || "—",
      "",
      text("ENGINEER'S COMMENTS", "មតិយោបល់របស់វិស្វករ"),
      line,
      comments.trim() || "—",
      "",
      text("SUBMITTAL / COMMENTS STATUS", "ស្ថានភាពនៃការដាក់ស្នើ / មតិយោបល់"),
      line,
      statusLabel,
      "",
      text("SIGN-OFF", "ការចុះហត្ថលេខា"),
      line,
      `${text("Engineer, hand over", "វិស្វករ ប្រគល់ជូន")} — ${text("Name", "ឈ្មោះ")}: ${engineerName.trim() || "—"} · ${text("Date", "កាលបរិច្ឆេទ")}: ${engineerDate || "—"}`,
      `${text("Contractor received", "អ្នកម៉ៅការ ទទួល")} — ${text("Name", "ឈ្មោះ")}: ${contractorName.trim() || "—"} · ${text("Date", "កាលបរិច្ឆេទ")}: ${contractorDate || "—"}`,
      "",
      text(
        "Note: The content of this approval does not relieve the Contractor from any of its obligations toward the works as per the drawings and specifications of the contract.",
        "កំណត់ចំណាំ៖ ខ្លឹមសារនៃការអនុម័តនេះ មិនធ្វើឱ្យអ្នកម៉ៅការរួចផុតពីកាតព្វកិច្ចណាមួយចំពោះការងារ តាមប្លង់ និងលក្ខណៈបច្ចេកទេសនៃកិច្ចសន្យានោះទេ។"
      ),
    ].join("\n");
  }, [meta, subject, comments, statusLabel, engineerName, engineerDate, contractorName, contractorDate, text]);

  return (
    <ToolShell
      title="Request for Approval (RFA)"
      khmerTitle="សំណើសុំការអនុម័ត (RFA)"
      description="Fill out a standard construction Request for Approval, track its status, and export it as text to attach or print. Nothing leaves your device."
      descriptionKm="បំពេញសំណើសុំការអនុម័ត (RFA) ស្តង់ដារសម្រាប់ការសាងសង់ តាមដានស្ថានភាព ហើយនាំចេញជាអត្ថបទសម្រាប់ភ្ជាប់ ឬបោះពុម្ព។ ទិន្នន័យមិនចេញពីឧបករណ៍របស់អ្នកទេ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contractor" labelKm="អ្នកម៉ៅការ">
          <TextInput value={meta.contractor} onChange={(e) => setMeta({ ...meta, contractor: e.target.value })} />
        </Field>
        <Field label="Contract Package No." labelKm="លេខកញ្ចប់កិច្ចសន្យា">
          <TextInput value={meta.contractPkgNo} onChange={(e) => setMeta({ ...meta, contractPkgNo: e.target.value })} />
        </Field>
        <Field label="Reference No." labelKm="លេខយោង">
          <TextInput value={meta.referenceNo} onChange={(e) => setMeta({ ...meta, referenceNo: e.target.value })} placeholder={text("e.g. RFA-001", "ឧ. RFA-001")} />
        </Field>
        <Field label="To" labelKm="ជូនចំពោះ">
          <TextInput value={meta.toParty} onChange={(e) => setMeta({ ...meta, toParty: e.target.value })} placeholder={text("e.g. Engineer / PMU", "ឧ. វិស្វករ / PMU")} />
        </Field>
        <Field label="Date submitted" labelKm="កាលបរិច្ឆេទដាក់ស្នើ">
          <TextInput type="date" value={meta.dateSubmitted} onChange={(e) => setMeta({ ...meta, dateSubmitted: e.target.value })} />
        </Field>
        <Field label="Received date" labelKm="កាលបរិច្ឆេទទទួល">
          <TextInput type="date" value={meta.receivedDate} onChange={(e) => setMeta({ ...meta, receivedDate: e.target.value })} />
        </Field>
        <Field label="Submittal revision" labelKm="លេខកែសម្រួល">
          <TextInput value={meta.submittalRevision} onChange={(e) => setMeta({ ...meta, submittalRevision: e.target.value })} placeholder="Rev.0, Rev.01…" />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-[var(--ink)]">
          <input type="checkbox" checked={meta.resubmitted} onChange={(e) => setMeta({ ...meta, resubmitted: e.target.checked })} />
          {text("Re-Submitted", "ដាក់ស្នើម្តងទៀត")}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Subject of submission" labelKm="ប្រធានបទនៃការដាក់ស្នើ">
          <TextArea rows={4} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Engineer's comments" labelKm="មតិយោបល់របស់វិស្វករ">
          <TextArea rows={4} value={comments} onChange={(e) => setComments(e.target.value)} />
        </Field>
      </div>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Submittal / Comments status", "ស្ថានភាពនៃការដាក់ស្នើ / មតិយោបល់")}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="radio"
                name="rfa-status"
                checked={status === option.value}
                onChange={() => setStatus(option.value)}
              />
              {text(option.en, option.km)}
            </label>
          ))}
        </div>
        {status === "other" && (
          <TextInput
            value={otherIssue}
            onChange={(e) => setOtherIssue(e.target.value)}
            placeholder={text("Describe the issue", "ពិពណ៌នាបញ្ហា")}
          />
        )}
      </section>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Sign-off", "ការចុះហត្ថលេខា")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--ink-faint)]">{text("Engineer, hand over", "វិស្វករ ប្រគល់ជូន")}</p>
            <Field label="Name" labelKm="ឈ្មោះ"><TextInput value={engineerName} onChange={(e) => setEngineerName(e.target.value)} /></Field>
            <Field label="Date" labelKm="កាលបរិច្ឆេទ"><TextInput type="date" value={engineerDate} onChange={(e) => setEngineerDate(e.target.value)} /></Field>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--ink-faint)]">{text("Contractor received", "អ្នកម៉ៅការ ទទួល")}</p>
            <Field label="Name" labelKm="ឈ្មោះ"><TextInput value={contractorName} onChange={(e) => setContractorName(e.target.value)} /></Field>
            <Field label="Date" labelKm="កាលបរិច្ឆេទ"><TextInput type="date" value={contractorDate} onChange={(e) => setContractorDate(e.target.value)} /></Field>
          </div>
        </div>
      </section>

      {!meta.contractor.trim() && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {text("Add the contractor name before exporting the RFA.", "សូមបន្ថែមឈ្មោះអ្នកម៉ៅការ មុនពេលនាំចេញ RFA។")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => downloadText(output, `rfa-${meta.referenceNo || meta.dateSubmitted || "form"}.txt`)}>
          {text("Download text", "ទាញយកអត្ថបទ")}
        </Button>
        <Button type="button" onClick={() => void downloadPdf()} disabled={exporting}>
          {text(exporting ? "Generating…" : "Download PDF", exporting ? "កំពុងបង្កើត…" : "ទាញយក PDF")}
        </Button>
        <Button type="button" onClick={() => window.print()}>
          {text("Print", "បោះពុម្ព")}
        </Button>
      </div>
      <div id="rfa-preview">
        <Output label={text("Request for Approval", "សំណើសុំការអនុម័ត")} value={output} mono={false} />
      </div>
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #rfa-preview, #rfa-preview * { visibility: visible !important; } #rfa-preview { position: absolute; inset: 0; width: 210mm; min-height: 297mm; max-width: none; box-shadow: none; print-color-adjust: exact; } @page { size: A4 portrait; margin: 15mm 20mm; } }`}</style>
    </ToolShell>
  );
}

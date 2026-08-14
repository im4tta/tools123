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
        <Button type="button" onClick={() => window.print()}>
          {text("Print / PDF", "បោះពុម្ព / PDF")}
        </Button>
      </div>
      <div id="rfa-preview">
        <Output label={text("Request for Approval", "សំណើសុំការអនុម័ត")} value={output} mono={false} />
      </div>
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #rfa-preview, #rfa-preview * { visibility: visible !important; } #rfa-preview { position: absolute; inset: 0; width: 210mm; min-height: 297mm; max-width: none; box-shadow: none; print-color-adjust: exact; } @page { size: A4 portrait; margin: 15mm 20mm; } }`}</style>
    </ToolShell>
  );
}

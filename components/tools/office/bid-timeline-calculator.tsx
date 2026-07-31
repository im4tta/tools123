"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Output } from "@/components/ui/Output";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function addDays(dateStr: string, days: number) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BidTimelineCalculator() {
  const { text } = useLanguage();

  const [ifbDate, setIfbDate] = useState("");
  const [prebidOffsetDays, setPrebidOffsetDays] = useState("14");
  const [biddingPeriodDays, setBiddingPeriodDays] = useState("30");
  const [bidValidityDays, setBidValidityDays] = useState("90");
  const [bidSecurityBufferDays, setBidSecurityBufferDays] = useState("28");

  const result = useMemo(() => {
    const prebid = addDays(ifbDate, toNumber(prebidOffsetDays));
    const submissionDeadline = addDays(ifbDate, toNumber(biddingPeriodDays));
    const bidValidityExpiry = submissionDeadline
      ? addDays(submissionDeadline.toISOString().slice(0, 10), toNumber(bidValidityDays))
      : null;
    const bidSecurityExpiry = submissionDeadline
      ? addDays(
          submissionDeadline.toISOString().slice(0, 10),
          toNumber(bidValidityDays) + toNumber(bidSecurityBufferDays)
        )
      : null;

    return { prebid, submissionDeadline, bidValidityExpiry, bidSecurityExpiry };
  }, [ifbDate, prebidOffsetDays, biddingPeriodDays, bidValidityDays, bidSecurityBufferDays]);

  const output = useMemo(() => {
    const line = "─".repeat(52);
    return [
      text("BID TIMELINE", "កាលវិភាគដេញថ្លៃ"),
      line,
      `${text("IFB / Advertisement date", "កាលបរិច្ឆេទផ្សព្វផ្សាយអញ្ជើញដេញថ្លៃ")}: ${ifbDate ? formatDate(new Date(ifbDate)) : "—"}`,
      `${text("Pre-bid meeting", "កិច្ចប្រជុំមុនការដេញថ្លៃ")}: ${formatDate(result.prebid)}`,
      `${text("Bid submission / opening deadline", "កាលកំណត់ដាក់ស្នើ / បើកការដេញថ្លៃ")}: ${formatDate(result.submissionDeadline)}`,
      `${text("Bid validity expires", "សុពលភាពការដេញថ្លៃផុតកំណត់")}: ${formatDate(result.bidValidityExpiry)}`,
      `${text("Bid security should remain valid until", "ការធានាការដេញថ្លៃគួរមានសុពលភាពរហូតដល់")}: ${formatDate(result.bidSecurityExpiry)}`,
      "",
      text(
        "Note: Dates are calendar-day arithmetic and do not account for Cambodian public holidays — cross-check against a holiday calendar before finalizing.",
        "កំណត់ចំណាំ៖ កាលបរិច្ឆេទទាំងនេះគណនាតាមប្រតិទិនធម្មតា មិនទាន់គិតរួមថ្ងៃឈប់សម្រាកជាតិកម្ពុជាទេ សូមផ្ទៀងផ្ទាត់ជាមួយប្រតិទិនថ្ងៃឈប់សម្រាកមុននឹងសម្រេចចុងក្រោយ។"
      ),
    ].join("\n");
  }, [ifbDate, result, text]);

  return (
    <ToolShell
      title="Bid Timeline Calculator"
      khmerTitle="ម៉ាស៊ីនគណនាកាលវិភាគដេញថ្លៃ"
      description="Enter the IFB date and standard periods to get pre-bid meeting, submission deadline, and bid/security validity dates."
      descriptionKm="បញ្ចូលកាលបរិច្ឆេទផ្សព្វផ្សាយអញ្ជើញដេញថ្លៃ និងរយៈពេលស្តង់ដារ ដើម្បីទទួលបានកាលបរិច្ឆេទកិច្ចប្រជុំមុនដេញថ្លៃ កាលកំណត់ដាក់ស្នើ និងសុពលភាពនៃការដេញថ្លៃ/ការធានា។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="IFB / advertisement date" labelKm="កាលបរិច្ឆេទផ្សព្វផ្សាយអញ្ជើញដេញថ្លៃ">
          <TextInput type="date" value={ifbDate} onChange={(e) => setIfbDate(e.target.value)} />
        </Field>
        <Field label="Pre-bid meeting (days after IFB)" labelKm="កិច្ចប្រជុំមុនដេញថ្លៃ (ថ្ងៃបន្ទាប់ពី IFB)">
          <TextInput type="number" min="0" value={prebidOffsetDays} onChange={(e) => setPrebidOffsetDays(e.target.value)} />
        </Field>
        <Field label="Bidding period (days)" labelKm="រយៈពេលដេញថ្លៃ (ថ្ងៃ)" hint="minimum period before submission deadline" hintKm="រយៈពេលអប្បបរមាមុនកាលកំណត់ដាក់ស្នើ">
          <TextInput type="number" min="0" value={biddingPeriodDays} onChange={(e) => setBiddingPeriodDays(e.target.value)} />
        </Field>
        <Field label="Bid validity period (days)" labelKm="រយៈពេលសុពលភាពការដេញថ្លៃ (ថ្ងៃ)" hint="typical 90–120 days" hintKm="ធម្មតា ៩០–១២០ ថ្ងៃ">
          <TextInput type="number" min="0" value={bidValidityDays} onChange={(e) => setBidValidityDays(e.target.value)} />
        </Field>
        <Field label="Bid security buffer (extra days beyond validity)" labelKm="រយៈពេលបន្ថែមសម្រាប់ការធានាការដេញថ្លៃ (ថ្ងៃបន្ថែមលើសពីសុពលភាព)" hint="typical 28 days" hintKm="ធម្មតា ២៨ ថ្ងៃ">
          <TextInput type="number" min="0" value={bidSecurityBufferDays} onChange={(e) => setBidSecurityBufferDays(e.target.value)} />
        </Field>
      </div>

      {!ifbDate && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {text("Add the IFB date to calculate the timeline.", "សូមបន្ថែមកាលបរិច្ឆេទ IFB ដើម្បីគណនាកាលវិភាគ។")}
        </p>
      )}
      <Output label={text("Bid timeline", "កាលវិភាគដេញថ្លៃ")} value={output} mono={false} />
    </ToolShell>
  );
}

"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Kind = "email" | "url" | "phone" | "id";

const KHMER_TO_ASCII = (s: string) => s.replace(/[០-៩]/g, (d) => String("០១២៣៤៥៦៧៨៩".indexOf(d)));

// Order matters: emails and URLs first so their digits aren't caught as phones/IDs.
const PATTERNS: { kind: Kind; re: RegExp }[] = [
  { kind: "email", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { kind: "url", re: /\bhttps?:\/\/[^\s<>()]+/gi },
  // Cambodian & international phone numbers: optional +855/0, 8–10 digits, spaces/dashes allowed.
  { kind: "phone", re: /(?:\+?855[ -]?|\b0)(?:[0-9០-៩][ -]?){7,9}[0-9០-៩]/g },
  // Long digit runs left over — national IDs, card-like numbers (9+ digits).
  { kind: "id", re: /[0-9០-៩]{9,}/g },
];

const LABELS: Record<Kind, { en: string; km: string }> = {
  email: { en: "EMAIL", km: "អ៊ីមែល" },
  url: { en: "LINK", km: "តំណ" },
  phone: { en: "PHONE", km: "ទូរស័ព្ទ" },
  id: { en: "ID", km: "លេខសម្គាល់" },
};

export default function KhmerPiiRedactor() {
  const { text: t, mode } = useLanguage();
  const [input, setInput] = useToolState("khmer-pii:input", "");
  const [style, setStyle] = useToolState<"label" | "block">("khmer-pii:style", "label");
  const [on, setOn] = useToolState<Record<Kind, boolean>>("khmer-pii:on", { email: true, url: true, phone: true, id: true });

  const { redacted, counts, total } = useMemo(() => {
    let out = input;
    const counts: Record<Kind, number> = { email: 0, url: 0, phone: 0, id: 0 };
    for (const { kind, re } of PATTERNS) {
      if (!on[kind]) continue;
      out = out.replace(new RegExp(re.source, re.flags), (match) => {
        // Phone guard: require enough digits so ordinary numbers aren't masked.
        const digits = KHMER_TO_ASCII(match).replace(/\D/g, "");
        if ((kind === "phone" && digits.length < 8) || (kind === "id" && digits.length < 9)) return match;
        counts[kind]++;
        const label = mode === "km" ? LABELS[kind].km : LABELS[kind].en;
        return style === "block" ? "████" : `[${label}]`;
      });
    }
    const total = counts.email + counts.url + counts.phone + counts.id;
    return { redacted: out, counts, total };
  }, [input, style, on, mode]);

  return (
    <ToolShell
      title="Khmer PII Redactor"
      khmerTitle="ឧបករណ៍បិទបាំងព័ត៌មានឯកជន"
      description="Paste any text — a Khmer message, form, or document — and automatically mask personal details before you share or publish it: phone numbers (Cambodian and international), email addresses, links, and long ID / card numbers. Everything runs in your browser; nothing is uploaded. Choose readable labels like [PHONE] or solid blocks."
      descriptionKm="បិទភ្ជាប់អត្ថបទណាមួយ — សារខ្មែរ ទម្រង់ ឬឯកសារ — ហើយបិទបាំងព័ត៌មានផ្ទាល់ខ្លួនដោយស្វ័យប្រវត្តិមុនពេលអ្នកចែករំលែក ឬបោះពុម្ព៖ លេខទូរស័ព្ទ (កម្ពុជា និងអន្តរជាតិ) អាសយដ្ឋានអ៊ីមែល តំណ និងលេខសម្គាល់/លេខកាតវែងៗ។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក គ្មានការផ្ញើឡើងទេ។ ជ្រើសរើសស្លាកដែលអានបាន ដូចជា [ទូរស័ព្ទ] ឬប្លុកតាន់។"
    >
      <Field label="Text to redact" labelKm="អត្ថបទដែលត្រូវបិទបាំង">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder={t("Paste text containing phone numbers, emails, links…", "បិទភ្ជាប់អត្ថបទដែលមានលេខទូរស័ព្ទ អ៊ីមែល តំណ…")} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(LABELS) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setOn((prev) => ({ ...prev, [k]: !prev[k] }))}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              on[k] ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-faint)] hover:border-[var(--ink-faint)]"
            }`}
          >
            {t(LABELS[k].en, LABELS[k].km)}{on[k] && counts[k] > 0 ? ` · ${counts[k]}` : ""}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--ground-line)]" />
        {([["label", "Labels", "ស្លាក"], ["block", "Blocks", "ប្លុក"]] as const).map(([id, en, km]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStyle(id)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              style === id ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"
            }`}
          >
            {t(en, km)}
          </button>
        ))}
      </div>

      {input.trim() && (
        <p className="text-xs text-[var(--ink-faint)]">
          {total > 0
            ? t(`${total} item${total === 1 ? "" : "s"} masked.`, `បានបិទបាំង ${total} កន្លែង។`)
            : t("Nothing detected to mask. Toggle the categories above or check your text.", "រកមិនឃើញអ្វីត្រូវបិទបាំងទេ។ សូមបិទ/បើកប្រភេទខាងលើ ឬពិនិត្យអត្ថបទ។")}
        </p>
      )}

      <Output label="Redacted text" value={redacted || " "} mono={false} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Detection uses pattern matching (regular expressions) that runs entirely in your browser — no text is uploaded. It catches common formats but is a helper, not a guarantee: always proofread the result before sharing, especially for names, addresses, or unusual number formats it may miss.",
          "ការរកឃើញប្រើការផ្គូផ្គងលំនាំ (regular expressions) ដែលដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក — គ្មានអត្ថបទត្រូវផ្ញើឡើងទេ។ វាចាប់បានទម្រង់ធម្មតា ប៉ុន្តែជាជំនួយ មិនមែនជាការធានាទេ៖ សូមអានឡើងវិញជានិច្ចមុនចែករំលែក ជាពិសេសឈ្មោះ អាសយដ្ឋាន ឬទម្រង់លេខមិនធម្មតាដែលវាអាចរំលង។",
        )}</p>
      </section>
    </ToolShell>
  );
}

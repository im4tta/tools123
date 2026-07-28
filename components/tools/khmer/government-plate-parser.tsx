"use client";

import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { ALL_PLATES } from "@/data/plates";
import { useToolState } from "@/lib/storage";

const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";
const toAscii = (value: string) => value.replace(/[០-៩]/g, (digit) => String(KHMER_DIGITS.indexOf(digit)));
const toKhmer = (value: string) => value.replace(/\d/g, (digit) => KHMER_DIGITS[Number(digit)]);

type Parsed = { normalized: string; categoryEn: string; categoryKm: string; assignment?: string };

function parsePlate(value: string): Parsed | null {
  if (!value.trim()) return null;
  const clean = toAscii(value.normalize("NFC").trim()).replace(/[‐‑‒–—−_./\s]+/g, "-").replace(/^-+|-+$/g, "");
  let normalized = "", categoryEn = "", categoryKm = "";
  if (/^នគរបាល(?:-|$)/.test(clean)) {
    normalized = "នគរបាល"; categoryEn = "National Police"; categoryKm = "នគរបាលជាតិ";
  } else {
    const match = clean.match(/^(រដ្ឋ|ខេមរភូមិន្ទ)-?0*(\d{1,2})(?:-|$)/);
    if (!match) return { normalized: clean, categoryEn: "Unknown prefix", categoryKm: "មិនស្គាល់បុព្វបទ" };
    const number = Number(match[2]);
    normalized = `${match[1]}-${toKhmer(String(number).padStart(2, "0"))}`;
    categoryEn = match[1] === "រដ្ឋ" ? "State institution" : "Royal Cambodian Armed Forces";
    categoryKm = match[1] === "រដ្ឋ" ? "ស្ថាប័នរដ្ឋ" : "កងយោធពលខេមរភូមិន្ទ";
  }
  const known = ALL_PLATES.find((item) => item.plate === normalized);
  return { normalized, categoryEn, categoryKm, assignment: known?.name };
}

export default function GovernmentPlateParser() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("government-plate-parser:input", "");
  const parsed = useMemo(() => parsePlate(input), [input]);
  const known = Boolean(parsed?.assignment);
  const copy = parsed ? `${t("Normalized prefix", "បុព្វបទដែលបានសម្រួល")}: ${parsed.normalized}\n${t("Category", "ប្រភេទ")}: ${t(parsed.categoryEn, parsed.categoryKm)}${parsed.assignment ? `\n${t("Assigned institution / unit", "ស្ថាប័ន / អង្គភាព")}: ${parsed.assignment}` : ""}` : "";
  return <ToolShell title="Cambodia Government Plate Parser" khmerTitle="ឧបករណ៍វិភាគស្លាកលេខរដ្ឋកម្ពុជា" description="Normalize a Cambodian state, police, or military plate prefix and match it against the bundled agency-prefix reference." descriptionKm="សម្រួលបុព្វបទស្លាកលេខរដ្ឋ នគរបាល ឬយោធាកម្ពុជា ហើយផ្គូផ្គងជាមួយបញ្ជីបុព្វបទស្ថាប័នក្នុងកម្មវិធី។">
    <Field label="Plate prefix" labelKm="បុព្វបទស្លាកលេខ"><TextInput value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("Examples: រដ្ឋ 12, រដ្ឋ-១២, ខេមរភូមិន្ទ ០៣", "ឧទាហរណ៍៖ រដ្ឋ 12, រដ្ឋ-១២, ខេមរភូមិន្ទ ០៣")} autoFocus /></Field>
    {parsed && <section className={`rounded-md border p-4 ${known ? "border-[var(--gold-dim)]" : "border-[var(--danger)]/60"}`}>
      <div className="flex items-start justify-between gap-3"><div><div className="text-xs text-[var(--ink-faint)]">{t("Normalized prefix", "បុព្វបទដែលបានសម្រួល")}</div><code className="text-lg text-[var(--gold)]">{parsed.normalized || "—"}</code></div><CopyButton text={copy} compact /></div>
      <dl className="mt-4 space-y-3 text-sm"><div className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-[var(--ink-faint)]">{t("Category", "ប្រភេទ")}</dt><dd>{t(parsed.categoryEn, parsed.categoryKm)}</dd></div><div className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-[var(--ink-faint)]">{t("Assigned unit", "អង្គភាពដែលបានកំណត់")}</dt><dd>{parsed.assignment ?? t("No exact known prefix", "មិនមានបុព្វបទដែលស្គាល់ត្រូវគ្នាទេ")}</dd></div></dl>
    </section>}
    <p className="text-xs text-[var(--ink-faint)]">{t("This identifies agency prefixes only, not an individual vehicle or current registration record.", "ឧបករណ៍នេះស្គាល់តែបុព្វបទស្ថាប័នប៉ុណ្ណោះ មិនអាចកំណត់អត្តសញ្ញាណយានយន្ត ឬកំណត់ត្រាចុះបញ្ជីបច្ចុប្បន្នបានទេ។")}</p>
  </ToolShell>;
}

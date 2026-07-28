"use client";
import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { ALL_PLATES } from "@/data/plates";
import { useToolState } from "@/lib/storage";

export default function GovernmentPlateLookup() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("government-plate-lookup:query", "");
  const results = useMemo(() => { const q = query.trim().toLowerCase(); return ALL_PLATES.filter((item) => !q || item.plate.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)); }, [query]);
  return <ToolShell title="Cambodia Government Plate Lookup" khmerTitle="ស្វែងរកស្លាកលេខរដ្ឋកម្ពុជា" description="Look up Cambodian state, police, and Royal Cambodian Armed Forces plate prefixes." descriptionKm="ស្វែងរកបុព្វបទស្លាកលេខរដ្ឋ នគរបាល និងកងយោធពលខេមរភូមិន្ទ ពីទិន្នន័យយោងដែលមានស្រាប់។">
    <Field label="Plate prefix or institution" labelKm="បុព្វបទស្លាកលេខ ឬឈ្មោះស្ថាប័ន"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("State plate or institution…", "រដ្ឋ-១២, ក្រសួងសុខាភិបាល…")} autoFocus /></Field>
    <div className="overflow-hidden rounded-md border border-[var(--ground-line)]"><table className="w-full text-sm"><thead><tr className="bg-[var(--ground-raised)] text-left text-xs text-[var(--ink-faint)]"><th className="px-3 py-2">{t("Plate", "ស្លាកលេខ")}</th><th className="px-3 py-2">{t("Institution / Unit", "ស្ថាប័ន / អង្គភាព")}</th><th className="w-10 px-2"><span className="sr-only">{t("Copy", "ចម្លង")}</span></th></tr></thead><tbody>
      {results.map((item) => <tr key={item.plate} className="border-t border-[var(--ground-line)]"><td className="px-3 py-2 font-mono-ui text-[var(--gold)]">{item.plate}</td><td className="px-3 py-2 text-[var(--ink)]">{item.name}</td><td className="px-2 py-1"><CopyButton text={`${item.plate}\n${item.name}`} compact /></td></tr>)}
    </tbody></table></div>
    <p className="text-xs text-[var(--ink-faint)]">{t("Reference data only; verify current official assignments before formal use.", "ទិន្នន័យនេះសម្រាប់យោងប៉ុណ្ណោះ។ សូមផ្ទៀងផ្ទាត់ការកំណត់បច្ចុប្បន្នជាមួយប្រភពផ្លូវការមុនពេលប្រើប្រាស់។")}</p>
  </ToolShell>;
}

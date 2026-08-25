"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

// Verified official Cambodia numbers — sourced from the official reference
// (cambodia_emergency_numbers), not estimated.
interface Contact {
  name: string;
  nameKm: string;
  category: string;
  categoryKm: string;
  number: string;
  isEmergency?: boolean;
}

const CONTACTS: Contact[] = [
  // Core Emergency Services
  { name: "Fire", nameKm: "អគ្គីភ័យ", category: "Emergency", categoryKm: "បន្ទាន់", number: "118", isEmergency: true },
  { name: "Police", nameKm: "នគរបាល", category: "Emergency", categoryKm: "បន្ទាន់", number: "117", isEmergency: true },
  { name: "Ambulance", nameKm: "រថយន្តសង្គ្រោះ", category: "Emergency", categoryKm: "បន្ទាន់", number: "119", isEmergency: true },
  { name: "Universal emergency (mobile)", nameKm: "លេខបន្ទាន់ទូទៅ (ទូរស័ព្ទចល័ត)", category: "Emergency", categoryKm: "បន្ទាន់", number: "112", isEmergency: true },
  { name: "Human Trafficking", nameKm: "ការជួញដូរមនុស្ស", category: "Emergency", categoryKm: "បន្ទាន់", number: "1288", isEmergency: true },
  { name: "Disaster Management", nameKm: "គ្រប់គ្រងគ្រោះមហន្តរាយ", category: "Emergency", categoryKm: "បន្ទាន់", number: "1294", isEmergency: true },

  // Health & Medical
  { name: "Infectious Diseases / MoH", nameKm: "ជំងឺឆ្លង / ក្រសួងសុខាភិបាល", category: "Health", categoryKm: "សុខភាព", number: "115" },
  { name: "Mental Health Counseling", nameKm: "ប្រឹក្សាសុខភាពផ្លូវចិត្ត", category: "Health", categoryKm: "សុខភាព", number: "1293" },
  { name: "National Blood Transfusion", nameKm: "បញ្ចូលឈាមជាតិ", category: "Health", categoryKm: "សុខភាព", number: "1291" },

  // Legal & Support
  { name: "Child Helpline", nameKm: "ខ្សែទូរស័ព្ទកុមារ", category: "Support", categoryKm: "គាំទ្រ", number: "1280" },
  { name: "Legal Services for Poor", nameKm: "សេវាច្បាប់សម្រាប់ជនក្រីក្រ", category: "Support", categoryKm: "គាំទ្រ", number: "1281" },

  // Utilities & City
  { name: "EDC electric", nameKm: "អគ្គិសនី EDC", category: "Utility", categoryKm: "ឧបករណ៍ប្រើប្រាស់", number: "1298" },
  { name: "PPWSA water", nameKm: "ទឹក PPWSA", category: "Utility", categoryKm: "ឧបករណ៍ប្រើប្រាស់", number: "023 724 046" },
  { name: "Phnom Penh Capital Hall", nameKm: "សាលារាជធានីភ្នំពេញ", category: "Utility", categoryKm: "ឧបករណ៍ប្រើប្រាស់", number: "1299" },

  // Government & Services
  { name: "Immigration", nameKm: "អន្តោប្រវេសន៍", category: "Government", categoryKm: "រដ្ឋាភិបាល", number: "1284" },
  { name: "Customs and Excise", nameKm: "គយ និងអាករកម្រ", category: "Government", categoryKm: "រដ្ឋាភិបាល", number: "1223" },
  { name: "Anti-Corruption Unit", nameKm: "អង្គភាពប្រឆាំងអំពើពុករលួយ", category: "Government", categoryKm: "រដ្ឋាភិបាល", number: "1282" },
  { name: "NSSF (Occupational Accidents)", nameKm: "NSSF (គ្រោះថ្នាក់ការងារ)", category: "Government", categoryKm: "រដ្ឋាភិបាល", number: "1286" },
  { name: "Labor Law Info", nameKm: "ព័ត៌មានច្បាប់ការងារ", category: "Government", categoryKm: "រដ្ឋាភិបាល", number: "1297" },
  { name: "Ministry of Commerce", nameKm: "ក្រសួងពាណិជ្ជកម្ម", category: "Government", categoryKm: "រដ្ឋាភិបាល", number: "1266" },

  // Transport & Tourism
  { name: "Expressway Service", nameKm: "សេវាផ្លូវហាយវេ", category: "Transport", categoryKm: "ដឹកជញ្ជូន", number: "1399" },
  { name: "Tourist Police (Phnom Penh)", nameKm: "នគរបាលទេសចរ (ភ្នំពេញ)", category: "Transport", categoryKm: "ដឹកជញ្ជូន", number: "012 942 484" },
  { name: "Tourist Police (Siem Reap)", nameKm: "នគរបាលទេសចរ (សៀមរាប)", category: "Transport", categoryKm: "ដឹកជញ្ជូន", number: "012 402 424" },

  // Telecom
  { name: "Cellcard support", nameKm: "សេវា Cellcard", category: "Telecom", categoryKm: "ទូរគមនាគមន៍", number: "012 812 812" },
  { name: "Smart support", nameKm: "សេវា Smart", category: "Telecom", categoryKm: "ទូរគមនាគមន៍", number: "010 200 888" },
  { name: "Metfone support", nameKm: "សេវា Metfone", category: "Telecom", categoryKm: "ទូរគមនាគមន៍", number: "097 9 097 097" },
  { name: "Telecom Regulator (TRC)", nameKm: "អាជ្ញាធរទូរគមនាគមន៍ (TRC)", category: "Telecom", categoryKm: "ទូរគមនាគមន៍", number: "6789" },
];

const CATEGORIES = ["All", "Emergency", "Health", "Support", "Utility", "Government", "Transport", "Telecom"] as const;
const CATEGORY_KM: Record<string, string> = {
  All: "ទាំងអស់", Emergency: "បន្ទាន់", Health: "សុខភាព", Support: "គាំទ្រ",
  Utility: "ឧបករណ៍ប្រើប្រាស់", Government: "រដ្ឋាភិបាល", Transport: "ដឹកជញ្ជូន", Telecom: "ទូរគមនាគមន៍",
};

export default function EmergencyHotlines() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONTACTS.filter((c) =>
      (category === "All" || c.category === category) &&
      (!q || c.name.toLowerCase().includes(q) || c.nameKm.includes(q) || c.number.replace(/\s/g, "").includes(q.replace(/\s/g, "")))
    );
  }, [query, category]);

  const emergencyCount = CONTACTS.filter((c) => c.isEmergency).length;

  return (
    <ToolShell
      title="Cambodia Official Numbers"
      khmerTitle="លេខទូរស័ព្ទផ្លូវការកម្ពុជា"
      description="Quick access to verified emergency, health, utility, telecom, and government service numbers in Cambodia — tap to call."
      descriptionKm="ចូលរហ័សទៅកាន់លេខសេវាផ្លូវការ បន្ទាន់ សុខភាព ឧបករណ៍ប្រើប្រាស់ ទូរគមនាគមន៍ និងរដ្ឋាភិបាលនៅកម្ពុជា — ចុចដើម្បីទូរស័ព្ទ។"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <Field label={t("Search", "ស្វែងរក")}>
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search name or number…", "ស្វែងរកឈ្មោះ ឬលេខ...")} />
          </Field>
        </div>
        <Field label={t("Category", "ប្រភេទ")}>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((k) => (
              <button key={k} type="button" onClick={() => setCategory(k)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${category === k ? "bg-[var(--gold)] text-[#0a0c0d]" : "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>
                {t(k, CATEGORY_KM[k])}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-[var(--ink-faint)]">{t("No matching contact.", "មិនមានលេខដែលត្រូវគ្នា។")}</p>}
        {filtered.map((c) => (
          <div key={`${c.name}-${c.number}`} className="flex items-center justify-between gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--ink)]">
                {c.isEmergency ? <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--danger)]" /> : null}
                {t(c.name, c.nameKm)}
              </div>
              <div className="text-[11px] text-[var(--ink-faint)]">{t(c.category, c.categoryKm)}</div>
            </div>
            <a
              href={`tel:${c.number.replace(/\s+/g, "").split("/")[0]}`}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/10 px-2.5 py-1.5 text-sm font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
            >
              <Phone size={13} />
              <span className="font-mono-ui">{c.number}</span>
            </a>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        <span>
          {t(`Numbers are from an official Cambodia reference. ${emergencyCount} core emergency lines (117/118/119/112) are stable; utility and department numbers may change — confirm with the relevant authority before relying on them.`, `លេខទាំងនេះយកពីឯកសារយោងផ្លូវការកម្ពុជា។ លេខបន្ទាន់ ${emergencyCount} ខ្សែ (117/118/119/112) មានស្ថិរភាព ប៉ុន្តែលេខឧបករណ៍ប្រើប្រាស់ និងនាយកដ្ឋានអាចផ្លាស់ប្តូរ — សូមបញ្ជាក់ជាមួយអាជ្ញាធរពាក់ព័ន្ធមុនពេលពឹងផ្អែក។`)}
        </span>
      </div>
    </ToolShell>
  );
}

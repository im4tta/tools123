"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";

type Honorific = {
  role: string;
  title: string;
  salutation: string;
  usage: string;
};

const HONORIFICS: Honorific[] = [
  { role: "ព្រះមហាក្សត្រ", title: "ព្រះករុណា", salutation: "ព្រះករុណា ជាអម្ចាស់ជីវិតលើត្បូង", usage: "ប្រើតាមព្រះរាជពិធីការ និងទម្រង់ផ្លូវការដែលអនុម័ត។" },
  { role: "សមាជិកព្រះរាជវង្ស", title: "ព្រះអង្គ", salutation: "សូមក្រាបបង្គំទូលថ្វាយ ព្រះអង្គ", usage: "គោរមងារពេញអាស្រ័យលើព្រះឋានៈរបស់ព្រះរាជសមាជិកនីមួយៗ។" },
  { role: "សម្តេចព្រះសង្ឃរាជ", title: "សម្តេចព្រះសង្ឃរាជ", salutation: "សូមក្រាបថ្វាយបង្គំ សម្តេចព្រះសង្ឃរាជ", usage: "ប្រើក្នុងលិខិត ឬពិធីការសាសនាដ៏ខ្ពង់ខ្ពស់។" },
  { role: "ព្រះសង្ឃជាន់ខ្ពស់", title: "ព្រះតេជព្រះគុណ", salutation: "សូមក្រាបថ្វាយបង្គំ ព្រះតេជព្រះគុណ", usage: "ប្រើចំពោះព្រះសង្ឃដែលមានឋានៈខ្ពស់; ត្រូវពិនិត្យសង្ឃឋានៈជាក់លាក់។" },
  { role: "ព្រះសង្ឃ", title: "ព្រះតេជគុណ", salutation: "សូមក្រាបថ្វាយបង្គំ ព្រះតេជគុណ", usage: "ពាក្យគោរពទូទៅចំពោះព្រះសង្ឃ។" },
  { role: "ឥស្សរជនដែលមានគោរមងារ សម្តេច", title: "សម្តេច", salutation: "សូមគោរពជូន សម្តេច", usage: "ប្រើតែពេលអ្នកទទួលមានគោរមងារនេះជាផ្លូវការ។" },
  { role: "មន្ត្រីជាន់ខ្ពស់ / រដ្ឋមន្ត្រី (បុរស)", title: "ឯកឧត្តម", salutation: "សូមគោរពជូន ឯកឧត្តម", usage: "ពិនិត្យឋានៈ និងគោរមងារបច្ចុប្បន្នរបស់អ្នកទទួល។" },
  { role: "មន្ត្រីជាន់ខ្ពស់ / ឥស្សរជន (ស្ត្រី)", title: "លោកជំទាវ", salutation: "សូមគោរពជូន លោកជំទាវ", usage: "ពិនិត្យឋានៈ និងបរិបទពិធីការមុនប្រើ។" },
  { role: "មន្ត្រី អ្នកវិជ្ជាជីវៈ ឬសាធារណជន", title: "លោក / លោកស្រី", salutation: "សូមគោរពជូន លោក / លោកស្រី", usage: "ទម្រង់គួរសមទូទៅ; ជ្រើសតាមអ្នកទទួល និងបរិបទ។" },
];

export default function HonorificGuide() {
  const { text } = useLanguage();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("km");
    if (!normalized) return HONORIFICS;
    return HONORIFICS.filter((row) => [row.role, row.title, row.salutation, row.usage]
      .some((value) => value.toLocaleLowerCase("km").includes(normalized)));
  }, [query]);

  return (
    <ToolShell
      title="Khmer Official Honorific Guide"
      khmerTitle="មគ្គុទ្ទេសក៍គោរមងារផ្លូវការខ្មែរ"
      description="Search nine role-based Khmer honorific references and copy a salutation without storing personal information."
      descriptionKm="ស្វែងរកគោរមងារខ្មែរតាមតួនាទីចំនួន ៩ និងចម្លងពាក្យគោរព ដោយមិនរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួន។"
    >
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--ink-dim)]">
        {text("Protocol reference only. Titles and offices change; confirm the recipient’s current official rank and approved institutional wording before sending.", "សម្រាប់យោងពិធីការប៉ុណ្ណោះ។ គោរមងារ និងតួនាទីអាចផ្លាស់ប្តូរ; សូមបញ្ជាក់ឋានៈផ្លូវការបច្ចុប្បន្នរបស់អ្នកទទួល និងពាក្យដែលស្ថាប័នអនុម័ត មុនផ្ញើ។")}
      </div>
      <Field label="Search role, title, or phrase" labelKm="ស្វែងរកតួនាទី គោរមងារ ឬឃ្លា">
        <TextInput className="font-khmer" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("e.g. ព្រះសង្ឃ, ឯកឧត្តម", "ឧ. ព្រះសង្ឃ, ឯកឧត្តម")} />
      </Field>
      <p aria-live="polite" className="text-sm text-[var(--ink-dim)]">{text(`${rows.length} references`, `យោងចំនួន ${rows.length}`)}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.role} className="space-y-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div>
              <p className="font-khmer text-sm text-[var(--ink-dim)]">{row.role}</p>
              <h2 className="font-moul mt-1 text-lg text-[var(--gold)]">{row.title}</h2>
            </div>
            <p className="font-khmer rounded-md bg-[var(--ground)] p-3 text-base text-[var(--ink)]">{row.salutation}</p>
            <p className="font-khmer text-sm leading-relaxed text-[var(--ink-dim)]">{row.usage}</p>
            <CopyButton
              text={row.salutation}
              fields={[
                { id: "role", label: text("Role", "តួនាទី"), getValue: row.role },
                { id: "title", label: text("Title", "គោរមងារ"), getValue: row.title },
                { id: "salutation", label: text("Salutation", "ពាក្យគោរព"), getValue: row.salutation },
                { id: "usage", label: text("Usage", "ការប្រើប្រាស់"), getValue: row.usage },
              ]}
            />
          </article>
        ))}
      </div>
      {!rows.length && <p className="rounded-md border border-[var(--ground-line)] p-6 text-center text-[var(--ink-faint)]">{text("No matching honorifics.", "រកមិនឃើញគោរមងារដែលត្រូវគ្នា។")}</p>}
    </ToolShell>
  );
}
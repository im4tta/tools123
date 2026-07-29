"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";

type Card = {
  name: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
  website: string;
  background: string;
  accent: string;
  foreground: string;
};

const INITIAL: Card = {
  name: "Sokha Chan",
  role: "Creative Director",
  organization: "Studio Cambodia",
  email: "sokha@example.com",
  phone: "+855 12 345 678",
  website: "example.com",
  background: "#17212b",
  accent: "#d7a84b",
  foreground: "#ffffff",
};

function saveSvg(svg: SVGSVGElement, filename: string) {
  const source = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function short(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}
export default function BusinessCardGenerator() {
  const { text: t } = useLanguage();
  const [card, setCard] = useState<Card>(INITIAL);
  const svgRef = useRef<SVGSVGElement>(null);
  const update = (key: keyof Card, value: string) => setCard((current) => ({ ...current, [key]: value }));

  const fields: Array<{ key: keyof Pick<Card, "name" | "role" | "organization" | "email" | "phone" | "website">; en: string; km: string; type?: string }> = [
    { key: "name", en: "Name", km: "ឈ្មោះ" },
    { key: "role", en: "Role", km: "តួនាទី" },
    { key: "organization", en: "Organization", km: "ស្ថាប័ន" },
    { key: "email", en: "Email", km: "អ៊ីមែល", type: "email" },
    { key: "phone", en: "Phone", km: "ទូរស័ព្ទ", type: "tel" },
    { key: "website", en: "Website", km: "គេហទំព័រ", type: "url" },
  ];

  return (
    <ToolShell
      title="Business Card Generator"
      khmerTitle="កម្មវិធីបង្កើតនាមប័ណ្ណ"
      description="Create a polished business card with a live standard-ratio preview and download it locally as SVG."
      descriptionKm="បង្កើតនាមប័ណ្ណជាមួយការមើលជាមុនតាមសមាមាត្រស្តង់ដារ និងទាញយកជា SVG នៅលើឧបករណ៍របស់អ្នក។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <Field key={field.key} label={field.en} labelKm={field.km}>
            <TextInput
              type={field.type}
              value={card[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
            />
          </Field>
        ))}
      </div>

      <Row>
        <Field label="Background color" labelKm="ពណ៌ផ្ទៃខាងក្រោយ">
          <input
            aria-label={t("Background color", "ពណ៌ផ្ទៃខាងក្រោយ")}
            type="color"
            value={card.background}
            onChange={(event) => update("background", event.target.value)}
            className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1"
          />
        </Field>
        <Field label="Accent color" labelKm="ពណ៌រំលេច">
          <input
            aria-label={t("Accent color", "ពណ៌រំលេច")}
            type="color"
            value={card.accent}
            onChange={(event) => update("accent", event.target.value)}
            className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1"
          />
        </Field>
      </Row>
      <Field label="Text color" labelKm="ពណ៌អក្សរ">
        <input
          aria-label={t("Text color", "ពណ៌អក្សរ")}
          type="color"
          value={card.foreground}
          onChange={(event) => update("foreground", event.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1"
        />
      </Field>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Preview (3.5 × 2 in)", "មើលជាមុន (៣.៥ × ២ អ៊ីញ)")}
        </div>
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1050 600"
          role="img"
          aria-label={t("Business card preview", "ការមើលនាមប័ណ្ណជាមុន")}
          className="h-auto w-full rounded-md border border-[var(--ground-line)]"
          style={{ backgroundColor: card.background }}
        >
          <rect width="1050" height="600" rx="24" fill={card.background} />
          <rect width="24" height="600" fill={card.accent} />
          <circle cx="910" cy="90" r="155" fill={card.accent} opacity="0.14" />
          <circle cx="965" cy="35" r="78" fill={card.accent} opacity="0.22" />
          <g fontFamily="Arial, 'Noto Sans Khmer', sans-serif" fill={card.foreground}>
            <text x="84" y="170" fontSize="58" fontWeight="700">{short(card.name || t("Your name", "ឈ្មោះរបស់អ្នក"), 28)}</text>
            <text x="86" y="220" fontSize="25" fill={card.accent} fontWeight="600">{short(card.role, 38)}</text>
            <text x="86" y="265" fontSize="23" opacity="0.78">{short(card.organization, 42)}</text>
            <line x1="86" y1="320" x2="964" y2="320" stroke={card.accent} strokeWidth="3" opacity="0.75" />
            <text x="86" y="388" fontSize="21" opacity="0.9">{short(card.email, 48)}</text>
            <text x="86" y="438" fontSize="21" opacity="0.9">{short(card.phone, 48)}</text>
            <text x="86" y="488" fontSize="21" opacity="0.9">{short(card.website, 48)}</text>
          </g>
        </svg>
      </div>

      <Button className="w-full" onClick={() => svgRef.current && saveSvg(svgRef.current, "business-card.svg")}>
        {t("Download SVG", "ទាញយក SVG")}
      </Button>
    </ToolShell>
  );
}

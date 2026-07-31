import { CATEGORY_META, type ToolDef } from "@/lib/tools";
import { toolUrl } from "@/lib/site";

type ToolBlurb = {
  en: string;
  km: string;
};

const TOOL_BLURBS: Record<string, ToolBlurb> = {
  "buddhist-era": {
    en: "Convert between Buddhist Era (BE) and Common Era (CE) years for Cambodian dates and official documents.",
    km: "បម្លែងរវាងឆ្នាំពុទ្ធសករាជ (ព.ស.) និងឆ្នាំគ្រិស្តសករាជ (គ.ស.) សម្រាប់កាលបរិច្ឆេទ និងឯកសារផ្លូវការ។",
  },
  "full-lunar-date": {
    en: "Look up a complete Khmer lunar date, including Buddhist Era, animal year, lunar month, and day.",
    km: "ស្វែងរកកាលបរិច្ឆេទចន្ទគតិខ្មែរពេញលេញ រួមមានពុទ្ធសករាជ ឆ្នាំសត្វ ខែ និងថ្ងៃចន្ទគតិ។",
  },
  "administrative-letter-builder": {
    en: "Create Khmer administrative letters from practical templates and export a ready-to-use official document.",
    km: "បង្កើតលិខិតរដ្ឋបាលខ្មែរពីគំរូអនុវត្តជាក់ស្តែង និងនាំចេញឯកសារផ្លូវការរួចរាល់សម្រាប់ប្រើប្រាស់។",
  },
  "honorific-guide": {
    en: "Find appropriate Khmer official honorifics, salutations, and formal address for letters and protocol.",
    km: "ស្វែងរកគោរមងារ ពាក្យសំពះ និងរបៀបហៅតាមផ្លូវការខ្មែរសម្រាប់លិខិត និងពិធីការ។",
  },
  "ministry-directory": {
    en: "Browse Cambodia government institutions and ministries in one practical directory.",
    km: "ស្វែងរកព័ត៌មានក្រសួង និងស្ថាប័នរដ្ឋកម្ពុជានៅក្នុងបញ្ជីតែមួយដែលងាយស្រួលប្រើ។",
  },
  "government-plate-lookup": {
    en: "Identify Cambodian government vehicle plate categories, agencies, and common state-vehicle markings.",
    km: "ស្គាល់ប្រភេទផ្លាកលេខរថយន្តរដ្ឋកម្ពុជា ស្ថាប័នពាក់ព័ន្ធ និងសញ្ញាសម្គាល់យានយន្តរដ្ឋ។",
  },
  "government-plate-parser": {
    en: "Parse and normalize Cambodia government vehicle plate text to identify its category and agency.",
    km: "វិភាគ និងកែទម្រង់អត្ថបទផ្លាកលេខរថយន្តរដ្ឋកម្ពុជា ដើម្បីសម្គាល់ប្រភេទ និងស្ថាប័នពាក់ព័ន្ធ។",
  },
  "safety-code-pro": {
    en: "Reference Cambodian construction safety practices, PPE color coding, regulations, and official sources.",
    km: "យោងអំពីការអនុវត្តសុវត្ថិភាពសំណង់កម្ពុជា ពណ៌ឧបករណ៍ PPE បទប្បញ្ញត្តិ និងប្រភពផ្លូវការ។",
  },
};

export function toolDescription(tool: ToolDef) {
  const blurb = TOOL_BLURBS[tool.id];
  if (blurb) return `${blurb.en} ${blurb.km}`;

  const category = CATEGORY_META[tool.category];
  const khmerTitle = tool.khmerTitle ?? tool.title;
  return `Free ${tool.title} ${category.label.toLowerCase()} tool. ${khmerTitle} គឺជាឧបករណ៍${category.khmer}ឥតគិតថ្លៃសម្រាប់ប្រើក្នុងកម្មវិធីរុករករបស់អ្នក។`;
}

export function toolJsonLd(tool: ToolDef) {
  const category = CATEGORY_META[tool.category];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    alternateName: tool.khmerTitle,
    description: toolDescription(tool),
    url: toolUrl(tool.id),
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: category.label,
    operatingSystem: "Web",
    inLanguage: ["en", "km"],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

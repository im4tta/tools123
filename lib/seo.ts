import { CATEGORY_META, type ToolDef } from "@/lib/tools";
import { BASE_URL, toolUrl } from "@/lib/site";

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
    "@type": "WebApplication",
    name: tool.title,
    alternateName: tool.khmerTitle,
    description: toolDescription(tool),
    url: toolUrl(tool.id),
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: category.label,
    operatingSystem: "Web",
    browserRequirements: "Requires a modern web browser",
    inLanguage: ["en", "km"],
    isAccessibleForFree: true,
    featureList: tool.keywords.slice(0, 10),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** Truthful per-tool FAQ (free, browser-only, bilingual UI). */
export function toolFaqLd(tool: ToolDef) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${tool.title} free to use?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. ${tool.title} on 123 Toolbox is free and runs directly in your browser — no account or payment required.`,
        },
      },
      {
        "@type": "Question",
        name: `Do I need to install anything to use ${tool.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "No installation is required. It runs in a modern web browser and processes your input locally on your device.",
        },
      },
      {
        "@type": "Question",
        name: `Is ${tool.title} available in Khmer?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The 123 Toolbox interface supports English, Khmer, and a bilingual English–Khmer mode.",
        },
      },
    ],
  };
}

/** Curated tools that get HowTo structured data (their steps are well-defined). */
const HOWTO_TOOLS: Record<string, string[]> = {
  "pdf-merge": ["Open the PDF Merge tool", "Select or drag in two or more PDF files", "Choose the page order, then click Merge", "Download the combined PDF"],
  "qr-generator": ["Choose a content type (URL, Wi-Fi, contact, and more)", "Fill in the required fields", "Pick a style and size", "Download the QR code as PNG or SVG"],
  "base64": ["Enter or paste your text", "Choose Encode or Decode", "Copy or download the result"],
  "json-formatter": ["Paste your JSON", "Click Format (or Minify)", "Copy the formatted output"],
  "uuid": ["Open the UUID Generator", "Choose how many UUIDs you need", "Copy the generated identifiers"],
  "hash": ["Enter your text", "Select an algorithm (MD5, SHA-1, SHA-256…)", "Copy the resulting hash"],
  "digit-converter": ["Enter Khmer or Arabic numerals", "Choose the conversion direction", "Copy the converted number"],
  "url-encode": ["Paste a URL or string", "Choose Encode or Decode", "Copy the result"],
  "case-converter": ["Paste your text", "Choose a case mode (UPPER, lower, Title, Sentence)", "Copy the converted text"],
  "word-counter": ["Paste your text", "View the live word, character, and line counts"],
};

/** HowTo structured data for tools with well-defined, truthful steps. */
export function toolHowToLd(tool: ToolDef) {
  const steps = HOWTO_TOOLS[tool.id];
  if (!steps) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.title}`,
    description: toolDescription(tool),
    url: toolUrl(tool.id),
    inLanguage: ["en", "km"],
    totalTime: "PT1M",
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text,
    })),
  };
}

/** Breadcrumb for a tool page: Home → Category → Tool. */
export function toolBreadcrumbLd(tool: ToolDef) {
  const category = CATEGORY_META[tool.category];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "123 Toolbox", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: category.label, item: BASE_URL },
      { "@type": "ListItem", position: 3, name: tool.title, item: toolUrl(tool.id) },
    ],
  };
}

/** Site-wide Organization + WebSite schema (with search action). */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "123 Toolbox",
        url: BASE_URL,
        logo: `${BASE_URL}/icon.svg`,
        sameAs: ["https://github.com/im4tta/tools123"],
      },
      {
        "@type": "WebSite",
        name: "123 Toolbox",
        url: BASE_URL,
        inLanguage: ["en", "km"],
        publisher: { "@id": `${BASE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is 123 Toolbox free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Every tool on 123 Toolbox is free and runs directly in your browser — no account or payment required.",
            },
          },
          {
            "@type": "Question",
            name: "Are my files uploaded to a server?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Files and text are processed locally in your browser and are not uploaded by 123 Toolbox, except for a few tools that clearly depend on an external resource.",
            },
          },
          {
            "@type": "Question",
            name: "What kinds of tools are available?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "123 Toolbox includes hundreds of tools for PDFs, images, developers, designers, Khmer language, geospatial data, security, math, and everyday work.",
            },
          },
          {
            "@type": "Question",
            name: "Which languages does 123 Toolbox support?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The interface supports English, Khmer, and a bilingual English–Khmer mode.",
            },
          },
        ],
      },
    ],
  };
}

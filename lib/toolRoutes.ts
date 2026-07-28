const PREFERRED_SLUGS: Record<string, string> = {
  "number-spellout": "ntw",
  "postal-code-finder": "postal-codes",
  "administrative-hierarchy": "address",
  "ministry-directory": "ministries",
  "government-plate-lookup": "plates",
  "khmer-unicode-normalizer": "khmer-unicode",
  "khmer-sentence-segmenter": "khmer-sentences",
  "administrative-code-decoder": "admin-code",
  "address-formatter": "format-address",
  "government-plate-parser": "parse-plate",
};

export function toolHref(id: string): string {
  return `/${PREFERRED_SLUGS[id] ?? id}`;
}

export function resolveToolId(slug: string): string {
  return Object.entries(PREFERRED_SLUGS).find(([, preferred]) => preferred === slug)?.[0] ?? slug;
}

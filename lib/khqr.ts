// Shared helpers for KHQR / Bakong payment QR codes, used by both the KHQR
// generator and the KHQR decoder so the CRC, TLV encoding, and tag reference
// live in one place (no duplicated checksum logic).
//
// KHQR follows the EMVCo "Merchant-Presented Mode" (MPM) QR specification with
// a Cambodia-specific merchant-account template defined by the National Bank of
// Cambodia's Bakong system. The root data objects (00, 01, 52–64) and the CRC
// algorithm below are the public EMVCo standard; the ISO 4217 currency numbers
// and ISO 3166-1 country codes are international standards. Bakong-specific
// interpretation of the merchant-account sub-tags is labelled "commonly …" in
// the decoder so nothing unverified is presented as authoritative.
//
// Sources:
//   EMVCo — EMV QR Code Specification for Payment Systems, Merchant-Presented
//   Mode (https://www.emvco.com/emv-technologies/qr-codes/)
//   National Bank of Cambodia — Bakong / KHQR (https://bakong.nbc.gov.kh/)

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over the payload, as EMVCo requires for tag 63. */
export function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Encode one tag-length-value data object. The length is the UTF-8 byte count as
 * two DECIMAL digits — the EMVCo MPM standard. (An earlier copy of this helper
 * used base-16, which produced unscannable payloads for any value of 10+ bytes,
 * e.g. the city "Phnom Penh".)
 */
export function tlv(tag: string, value: string): string {
  const bytes = new TextEncoder().encode(value);
  return `${tag}${bytes.length.toString().padStart(2, "0")}${value}`;
}

export interface Bilingual {
  en: string;
  km: string;
}

/** Root-level EMVCo MPM data-object labels (bilingual). */
export const EMV_ROOT_TAGS: Record<string, Bilingual> = {
  "00": { en: "Payload Format Indicator", km: "សូចនាករទ្រង់ទ្រាយ" },
  "01": { en: "Point of Initiation Method", km: "វិធីចាប់ផ្តើម" },
  "52": { en: "Merchant Category Code", km: "លេខកូដប្រភេទអាជីវកម្ម" },
  "53": { en: "Transaction Currency", km: "រូបិយប័ណ្ណ" },
  "54": { en: "Transaction Amount", km: "ចំនួនទឹកប្រាក់" },
  "55": { en: "Tip or Convenience Indicator", km: "សូចនាករតម្លៃបន្ថែម" },
  "56": { en: "Value of Convenience Fee (Fixed)", km: "តម្លៃសេវាបន្ថែម (ថេរ)" },
  "57": { en: "Value of Convenience Fee (Percentage)", km: "តម្លៃសេវាបន្ថែម (ភាគរយ)" },
  "58": { en: "Country Code", km: "លេខកូដប្រទេស" },
  "59": { en: "Merchant Name", km: "ឈ្មោះអាជីវករ" },
  "60": { en: "Merchant City", km: "ទីក្រុងអាជីវករ" },
  "61": { en: "Postal Code", km: "លេខកូដប្រៃសណីយ៍" },
  "62": { en: "Additional Data Field", km: "ទិន្នន័យបន្ថែម" },
  "63": { en: "CRC Checksum", km: "ផលបូកត្រួតពិនិត្យ CRC" },
  "64": { en: "Merchant Info — Language Template", km: "ព័ត៌មានអាជីវករ (ភាសាផ្សេង)" },
};

/** Additional Data Field (tag 62) sub-tag labels — EMVCo standard. */
export const ADDITIONAL_DATA_TAGS: Record<string, Bilingual> = {
  "01": { en: "Bill Number", km: "លេខវិក្កយបត្រ" },
  "02": { en: "Mobile Number", km: "លេខទូរស័ព្ទ" },
  "03": { en: "Store Label", km: "ស្លាកហាង" },
  "04": { en: "Loyalty Number", km: "លេខសមាជិកភាព" },
  "05": { en: "Reference Label", km: "ស្លាកយោង" },
  "06": { en: "Customer Label", km: "ស្លាកអតិថិជន" },
  "07": { en: "Terminal Label", km: "ស្លាកស្ថានីយ" },
  "08": { en: "Purpose of Transaction", km: "គោលបំណងប្រតិបត្តិការ" },
  "09": { en: "Additional Consumer Data Request", km: "សំណើទិន្នន័យអតិថិជនបន្ថែម" },
};

/** Language template (tag 64) sub-tag labels — EMVCo standard. */
export const LANGUAGE_TEMPLATE_TAGS: Record<string, Bilingual> = {
  "00": { en: "Language Preference", km: "ភាសាដែលពេញចិត្ត" },
  "01": { en: "Merchant Name (Alternate Language)", km: "ឈ្មោះអាជីវករ (ភាសាផ្សេង)" },
  "02": { en: "Merchant City (Alternate Language)", km: "ទីក្រុងអាជីវករ (ភាសាផ្សេង)" },
};

/** Merchant-account template (tag 26–51) sub-tag labels as Bakong commonly uses them. */
export const MERCHANT_ACCOUNT_TAGS: Record<string, Bilingual> = {
  "00": { en: "Globally Unique Identifier", km: "លេខសម្គាល់ (GUID)" },
  "01": { en: "Merchant ID (commonly)", km: "លេខសម្គាល់អាជីវករ (ជាទូទៅ)" },
  "02": { en: "Bakong Account ID (commonly)", km: "គណនី Bakong (ជាទូទៅ)" },
  "03": { en: "Merchant Name (commonly)", km: "ឈ្មោះអាជីវករ (ជាទូទៅ)" },
  "04": { en: "Merchant City (commonly)", km: "ទីក្រុងអាជីវករ (ជាទូទៅ)" },
  "05": { en: "Acquiring Bank / Merchant ID (commonly)", km: "ធនាគារ / លេខអាជីវករ (ជាទូទៅ)" },
};

/** ISO 4217 numeric currency codes seen in KHQR. */
export const CURRENCY_NAMES: Record<string, Bilingual> = {
  "116": { en: "KHR — Cambodian Riel", km: "៛ រៀល​ខ្មែរ (KHR)" },
  "840": { en: "USD — US Dollar", km: "$ ដុល្លារ​អាមេរិក (USD)" },
};

/** Point-of-initiation method meanings (tag 01) — EMVCo standard. */
export const INITIATION_METHODS: Record<string, Bilingual> = {
  "11": { en: "Static — reusable for many payments", km: "ថេរ — ប្រើឡើងវិញបានច្រើនដង" },
  "12": { en: "Dynamic — one-time / fixed amount", km: "ថាមវន្ត — ប្រើម្តង / ចំនួនកំណត់" },
};

export interface KhqrField {
  tag: string;
  label: Bilingual;
  value: string;
  /** UTF-8 byte length declared in the payload. */
  length: number;
  /** A friendly interpretation of the value, when one is known (currency name, method, etc.). */
  meaning?: Bilingual;
  /** Nested data objects for template tags (merchant account, additional data, language). */
  children?: KhqrField[];
}

export interface KhqrDecodeResult {
  fields: KhqrField[];
  crc: { embedded: string; computed: string; ok: boolean } | null;
  /** Convenience extraction of the most useful values, when present. */
  summary: {
    merchantName?: string;
    merchantNameAlt?: string;
    city?: string;
    country?: string;
    currency?: string;
    amount?: string;
    isDynamic?: boolean;
    bakongAccount?: string;
  };
  errors: string[];
}

const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();

function labelFor(tag: string, table: Record<string, Bilingual>): Bilingual {
  return table[tag] ?? { en: `Tag ${tag}`, km: `ស្លាក ${tag}` };
}

/**
 * Parse a byte view of a payload into flat tag-length-value objects. KHQR encodes
 * the length as a UTF-8 byte count (matching the generator), so parsing over bytes
 * keeps multi-byte Khmer values (e.g. a Khmer merchant name in tag 64) intact.
 */
function parseObjects(bytes: Uint8Array, errors: string[]): { tag: string; length: number; valueBytes: Uint8Array }[] {
  const objs: { tag: string; length: number; valueBytes: Uint8Array }[] = [];
  let i = 0;
  while (i < bytes.length) {
    if (i + 4 > bytes.length) {
      errors.push("Payload ends in the middle of a tag or length.");
      break;
    }
    const tag = DECODER.decode(bytes.slice(i, i + 2));
    const lenStr = DECODER.decode(bytes.slice(i + 2, i + 4));
    if (!/^[0-9]{2}$/.test(tag) || !/^[0-9]{2}$/.test(lenStr)) {
      errors.push(`Expected a numeric tag and length near position ${i}, found "${tag}${lenStr}".`);
      break;
    }
    const length = parseInt(lenStr, 10);
    const start = i + 4;
    const end = start + length;
    if (end > bytes.length) {
      errors.push(`Tag ${tag} claims ${length} bytes but the payload is shorter.`);
      break;
    }
    objs.push({ tag, length, valueBytes: bytes.slice(start, end) });
    i = end;
  }
  return objs;
}

/** Tags whose value is itself a template of nested data objects. */
function subTableFor(tag: string): Record<string, Bilingual> | null {
  const n = Number(tag);
  if (n >= 26 && n <= 51) return MERCHANT_ACCOUNT_TAGS;
  if (tag === "62") return ADDITIONAL_DATA_TAGS;
  if (tag === "64") return LANGUAGE_TEMPLATE_TAGS;
  return null;
}

/**
 * Decode a KHQR / EMVCo MPM payload into labelled fields, validate its CRC, and
 * pull out a friendly summary. Purely reads the supplied string — no reference
 * data is invented; every label comes from the public EMVCo / ISO standards.
 */
export function parseKhqr(input: string): KhqrDecodeResult {
  const payload = input.trim();
  const errors: string[] = [];
  const result: KhqrDecodeResult = { fields: [], crc: null, summary: {}, errors };
  if (!payload) return result;

  const bytes = ENCODER.encode(payload);
  const objects = parseObjects(bytes, errors);

  for (const obj of objects) {
    const value = DECODER.decode(obj.valueBytes);
    const field: KhqrField = { tag: obj.tag, label: labelFor(obj.tag, EMV_ROOT_TAGS), value, length: obj.length };

    const subTable = subTableFor(obj.tag);
    if (subTable) {
      const childObjs = parseObjects(obj.valueBytes, errors);
      field.children = childObjs.map((c) => ({
        tag: c.tag,
        label: labelFor(c.tag, subTable),
        value: DECODER.decode(c.valueBytes),
        length: c.length,
      }));
    }

    if (obj.tag === "01") field.meaning = INITIATION_METHODS[value];
    if (obj.tag === "53") field.meaning = CURRENCY_NAMES[value];

    result.fields.push(field);
  }

  // Friendly summary
  const root = (tag: string) => result.fields.find((f) => f.tag === tag);
  const initiation = root("01")?.value;
  result.summary.isDynamic = initiation === "12";
  result.summary.merchantName = root("59")?.value;
  result.summary.city = root("60")?.value;
  result.summary.country = root("58")?.value;
  result.summary.currency = root("53")?.value;
  result.summary.amount = root("54")?.value;
  result.summary.merchantNameAlt = root("64")?.children?.find((c) => c.tag === "01")?.value;
  const merchantTemplate = result.fields.find((f) => Number(f.tag) >= 26 && Number(f.tag) <= 51);
  result.summary.bakongAccount = merchantTemplate?.children?.find((c) => c.tag === "02")?.value;

  // CRC validation: EMVCo computes the CRC over everything up to and including
  // the "6304" tag+length prefix, i.e. the whole payload minus the 4-char value.
  const crcField = result.fields.find((f) => f.tag === "63");
  if (crcField) {
    const embedded = crcField.value.toUpperCase();
    const crcInput = payload.slice(0, payload.length - crcField.value.length);
    const computed = crc16ccitt(crcInput);
    result.crc = { embedded, computed, ok: embedded === computed };
  }

  return result;
}

"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * SAMPLE table — a small, partial selection of well-known public IEEE OUI
 * assignments (24-bit prefixes), bundled for offline convenience. It is NOT
 * the full IEEE OUI registry; see the IEEE link in the UI for authoritative
 * lookups.
 */
const SAMPLE_VENDORS: { vendor: string; ouis: string[] }[] = [
  { vendor: "Apple", ouis: ["3C:07:54", "A4:83:E7", "F0:18:98"] },
  { vendor: "Samsung Electronics", ouis: ["5C:0A:5B", "A8:5E:45", "58:A2:3B"] },
  { vendor: "TP-Link", ouis: ["50:FA:84", "3C:84:6A", "30:B5:C2"] },
  { vendor: "Intel", ouis: ["3C:97:0E", "F8:75:A4", "00:1B:21"] },
  { vendor: "Cisco", ouis: ["00:00:0C", "00:1A:A1", "30:F7:0D"] },
  { vendor: "Xiaomi", ouis: ["9C:99:A0", "48:7A:DA", "64:09:80"] },
  { vendor: "Dell", ouis: ["00:14:22", "F8:BC:12", "18:03:73"] },
  { vendor: "HP", ouis: ["3C:D9:2B", "9C:B6:54", "14:FD:28"] },
  { vendor: "Huawei", ouis: ["00:25:9E", "04:9F:81"] },
  { vendor: "Sony", ouis: ["00:1D:BA"] },
  { vendor: "LG Electronics", ouis: ["9C:93:4E"] },
  { vendor: "Google", ouis: ["F4:F5:D8", "3C:5A:B4", "00:1A:11"] },
  { vendor: "Amazon", ouis: ["74:C2:46", "A0:02:DC", "F0:27:2D"] },
  { vendor: "Lenovo", ouis: ["54:EE:75", "3C:A6:F6"] },
  { vendor: "ASUS", ouis: ["10:BF:48"] },
  { vendor: "Realtek", ouis: ["00:E0:4C"] },
  { vendor: "Broadcom", ouis: ["00:10:18"] },
  { vendor: "Qualcomm", ouis: ["00:0A:F5"] },
  { vendor: "MediaTek", ouis: ["00:1C:D2"] },
  { vendor: "Raspberry Pi", ouis: ["B8:27:EB", "DC:A6:32", "E4:5F:01"] },
  { vendor: "NETGEAR", ouis: ["20:4E:7F"] },
  { vendor: "Microsoft", ouis: ["00:50:F2"] },
  { vendor: "Canon", ouis: ["00:00:85"] },
  { vendor: "Seiko Epson", ouis: ["00:00:48"] },
  { vendor: "Brother Industries", ouis: ["00:80:77"] },
  { vendor: "IBM", ouis: ["00:04:AC"] },
];

const IEEE_URL = "https://standards.ieee.org/products-programs/regauth/oui/";

export default function MacVendorLookup() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("mac-vendor-lookup:input", "A4:83:E7:12:34:56");

  const result = useMemo(() => {
    const hex = input.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    const oui = hex.length === 12 ? hex.slice(0, 6) : hex.length === 6 ? hex : "";
    const ouiPretty = oui ? (oui.match(/.{2}/g) ?? []).join(":") : "";
    const valid = oui.length === 6;
    const macPretty = hex.length === 12 ? (hex.match(/.{2}/g) ?? []).join(":") : "";
    const match = valid ? SAMPLE_VENDORS.find((v) => v.ouis.includes(ouiPretty)) : undefined;
    return { valid, ouiPretty, macPretty, match };
  }, [input]);

  return (
    <ToolShell
      title="MAC Vendor Lookup"
      khmerTitle="ស្វែងរកម្ចាស់ MAC"
      description="Extract the OUI from any MAC address and look it up in a bundled sample vendor list."
      descriptionKm="ទាញ OUI ពីអាសយដ្ឋាន MAC ណាមួយ ហើយស្វែងរកក្នុងបញ្ជីម្ចាស់គំរូដែលភ្ជាប់មកជាមួយ។"
    >
      <Field
        label={t("MAC address or OUI", "អាសយដ្ឋាន MAC ឬ OUI")}
        hint={t("Colon, hyphen, dot, or no separator.", "សញ្ញា ដក ចំណុច ឬគ្មានសញ្ញាបំបែក។")}
      >
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder="A4:83:E7:12:34:56" className="font-mono-ui" />
      </Field>

      {input.trim() && !result.valid && (
        <p className="text-sm text-[var(--danger)]">
          {t(
            "Enter a valid MAC address (12 hex digits) or OUI (6 hex digits).",
            "សូមបញ្ចូលអាសយដ្ឋាន MAC (លេខគោលដប់ប្រាំមួយ ១២ ខ្ទង់) ឬ OUI (៦ ខ្ទង់) ឱ្យបានត្រឹមត្រូវ។",
          )}
        </p>
      )}

      {result.valid && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Vendor", "ម្ចាស់")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">
            {result.match ? result.match.vendor : t("Not found in sample", "រកមិនឃើញក្នុងគំរូ")}
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="flex items-baseline justify-between gap-3 border-t border-[var(--ground-line)] pt-2">
              <dt className="text-[var(--ink-dim)]">{t("OUI", "OUI")}</dt>
              <dd className="font-mono-ui text-[var(--ink)]">{result.ouiPretty}</dd>
            </div>
            {result.macPretty && (
              <div className="flex items-baseline justify-between gap-3 border-t border-[var(--ground-line)] pt-2">
                <dt className="text-[var(--ink-dim)]">{t("Normalized MAC", "MAC ដែលបានរៀប")}</dt>
                <dd className="font-mono-ui text-[var(--ink)]">{result.macPretty}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Sample data", "ទិន្នន័យគំរូ")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "This tool ships a small bundled sample list (~26 common vendors). It is not the full IEEE OUI registry: a vendor may exist in the real registry but be missing here. Use the official registry for authoritative assignments.",
            "ឧបករណ៍នេះភ្ជាប់បញ្ជីគំរូតូចមួយ (~២៦ ម្ចាស់ទូទៅ)។ វាមិនមែនជាបញ្ជីពេញលេញរបស់ IEEE OUI ទេ៖ ម្ចាស់អាចមានក្នុងបញ្ជីពិត ប៉ុន្តែមិនមាននៅទីនេះ។ សូមប្រើបញ្ជីផ្លូវការ សម្រាប់ការកំណត់ដែលមានសិទ្ធិ។",
          )}
        </p>
        <p className="mt-2 text-xs text-[var(--ink-dim)]">
          {t("Sample list, not the full IEEE OUI registry", "បញ្ជីគំរូ មិនមែនជាបញ្ជីពេញលេញរបស់ IEEE OUI")}{" "}
          <a href={IEEE_URL} target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
            {IEEE_URL}
          </a>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          <span className="font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}:</span>{" "}
          {t(
            "OUI prefixes are public IEEE registry data, included here as a partial sample for convenience.",
            "បុព្វបទ OUI ជាទិន្នន័យសាធារណៈរបស់ IEEE ដែលបញ្ចូលនៅទីនេះជាគំរូផ្នែកខ្លះសម្រាប់ភាពងាយស្រួល។",
          )}
        </p>
      </div>
    </ToolShell>
  );
}

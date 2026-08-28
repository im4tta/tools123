"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Currency = {
  code: string;
  numeric: string;
  name: string;
  km: string;
  symbol: string;
};

const CURRENCIES: Currency[] = [
  { code: "USD", numeric: "840", name: "US Dollar", km: "ដុល្លារអាមេរិក", symbol: "$" },
  { code: "EUR", numeric: "978", name: "Euro", km: "អឺរ៉ូ", symbol: "€" },
  { code: "GBP", numeric: "826", name: "British Pound", km: "ផោនអង់គ្លេស", symbol: "£" },
  { code: "JPY", numeric: "392", name: "Japanese Yen", km: "យេនជប៉ុន", symbol: "¥" },
  { code: "CNY", numeric: "156", name: "Chinese Yuan", km: "យ័នចិន", symbol: "¥" },
  { code: "HKD", numeric: "344", name: "Hong Kong Dollar", km: "ដុល្លារហុងកុង", symbol: "HK$" },
  { code: "MOP", numeric: "446", name: "Macanese Pataca", km: "ប៉ាតាកាម៉ាកាវ", symbol: "MOP$" },
  { code: "TWD", numeric: "901", name: "New Taiwan Dollar", km: "ដុល្លារតៃវ៉ាន់", symbol: "NT$" },
  { code: "KRW", numeric: "410", name: "South Korean Won", km: "វ៉ុនកូរ៉េខាងត្បូង", symbol: "₩" },
  { code: "KHR", numeric: "116", name: "Cambodian Riel", km: "រៀលកម្ពុជា", symbol: "៛" },
  { code: "THB", numeric: "764", name: "Thai Baht", km: "បាតថៃ", symbol: "฿" },
  { code: "VND", numeric: "704", name: "Vietnamese Dong", km: "ដុងវៀតណាម", symbol: "₫" },
  { code: "LAK", numeric: "418", name: "Lao Kip", km: "គីបឡាវ", symbol: "₭" },
  { code: "MMK", numeric: "104", name: "Myanmar Kyat", km: "គីយ៉ាតមីយ៉ាន់ម៉ា", symbol: "K" },
  { code: "MYR", numeric: "458", name: "Malaysian Ringgit", km: "រីងហ្គីតម៉ាឡេស៊ី", symbol: "RM" },
  { code: "SGD", numeric: "702", name: "Singapore Dollar", km: "ដុល្លារសិង្ហបុរី", symbol: "S$" },
  { code: "BND", numeric: "096", name: "Brunei Dollar", km: "ដុល្លារប្រ៊ុយណេ", symbol: "B$" },
  { code: "IDR", numeric: "360", name: "Indonesian Rupiah", km: "រូពីឥណ្ឌូនេស៊ី", symbol: "Rp" },
  { code: "PHP", numeric: "608", name: "Philippine Peso", km: "ប៉េសូហ្វីលីពីន", symbol: "₱" },
  { code: "AUD", numeric: "036", name: "Australian Dollar", km: "ដុល្លារអូស្ត្រាលី", symbol: "A$" },
  { code: "NZD", numeric: "554", name: "New Zealand Dollar", km: "ដុល្លារនូវែលសេឡង់", symbol: "NZ$" },
  { code: "INR", numeric: "356", name: "Indian Rupee", km: "រូពីឥណ្ឌា", symbol: "₹" },
  { code: "PKR", numeric: "586", name: "Pakistani Rupee", km: "រូពីប៉ាគីស្ថាន", symbol: "₨" },
  { code: "BDT", numeric: "050", name: "Bangladeshi Taka", km: "តាកាបង់ក្លាដែស", symbol: "৳" },
  { code: "LKR", numeric: "144", name: "Sri Lankan Rupee", km: "រូពីស្រីលង្កា", symbol: "Rs" },
  { code: "NPR", numeric: "524", name: "Nepalese Rupee", km: "រូពីនេប៉ាល់", symbol: "Rs" },
  { code: "CHF", numeric: "756", name: "Swiss Franc", km: "ហ្វ្រង់ស្វីស", symbol: "CHF" },
  { code: "SEK", numeric: "752", name: "Swedish Krona", km: "ក្រូណាស៊ុយអែត", symbol: "kr" },
  { code: "NOK", numeric: "578", name: "Norwegian Krone", km: "ក្រូណាន័រវេស", symbol: "kr" },
  { code: "DKK", numeric: "208", name: "Danish Krone", km: "ក្រូណាដាណឺម៉ាក", symbol: "kr" },
  { code: "ISK", numeric: "352", name: "Icelandic Króna", km: "ក្រូណាអ៊ីស្លង់", symbol: "kr" },
  { code: "PLN", numeric: "985", name: "Polish Złoty", km: "ហ្សូទីប៉ូឡូញ", symbol: "zł" },
  { code: "CZK", numeric: "203", name: "Czech Koruna", km: "កូរុណាឆេក", symbol: "Kč" },
  { code: "HUF", numeric: "348", name: "Hungarian Forint", km: "ហ្វូរីនហុងគ្រី", symbol: "Ft" },
  { code: "RON", numeric: "946", name: "Romanian Leu", km: "លេវរូម៉ានី", symbol: "lei" },
  { code: "BGN", numeric: "975", name: "Bulgarian Lev", km: "លេវប៊ុលហ្គារី", symbol: "лв" },
  { code: "TRY", numeric: "949", name: "Turkish Lira", km: "លីរ៉ាទួរគី", symbol: "₺" },
  { code: "RUB", numeric: "643", name: "Russian Ruble", km: "រូបលរុស្ស៊ី", symbol: "₽" },
  { code: "UAH", numeric: "980", name: "Ukrainian Hryvnia", km: "ហ្រីវនីអ៊ុយក្រែន", symbol: "₴" },
  { code: "ILS", numeric: "376", name: "Israeli New Shekel", km: "សេកែលអ៊ីស្រាអែល", symbol: "₪" },
  { code: "AED", numeric: "784", name: "UAE Dirham", km: "ឌៀរហាំអេមីរ៉ាត់", symbol: "د.إ" },
  { code: "SAR", numeric: "682", name: "Saudi Riyal", km: "រីយ៉ាលអារ៉ាប៊ីសាអូឌីត", symbol: "﷼" },
  { code: "QAR", numeric: "634", name: "Qatari Riyal", km: "រីយ៉ាលកាតា", symbol: "QR" },
  { code: "KWD", numeric: "414", name: "Kuwaiti Dinar", km: "ឌីណាគុយវ៉ែត", symbol: "KD" },
  { code: "BHD", numeric: "048", name: "Bahraini Dinar", km: "ឌីណាបារ៉ែន", symbol: "BD" },
  { code: "OMR", numeric: "512", name: "Omani Rial", km: "រីយ៉ាលអូម៉ង់", symbol: "ر.ع." },
  { code: "JOD", numeric: "400", name: "Jordanian Dinar", km: "ឌីណាហ្ស៊កដានី", symbol: "JD" },
  { code: "EGP", numeric: "818", name: "Egyptian Pound", km: "ផោនអេហ្ស៊ីប", symbol: "E£" },
  { code: "ZAR", numeric: "710", name: "South African Rand", km: "រ៉ង់អាហ្វ្រិកខាងត្បូង", symbol: "R" },
  { code: "NGN", numeric: "566", name: "Nigerian Naira", km: "ណៃរ៉ានីហ្សេរីយ៉ា", symbol: "₦" },
  { code: "KES", numeric: "404", name: "Kenyan Shilling", km: "ស៊ីលីងកេនយ៉ា", symbol: "KSh" },
  { code: "ETB", numeric: "230", name: "Ethiopian Birr", km: "ប៊ីរអេត្យូពី", symbol: "Br" },
  { code: "MAD", numeric: "504", name: "Moroccan Dirham", km: "ឌៀរហាំម៉ារ៉ុក", symbol: "د.م." },
  { code: "MXN", numeric: "484", name: "Mexican Peso", km: "ប៉េសូម៉ិកស៊ិក", symbol: "$" },
  { code: "BRL", numeric: "986", name: "Brazilian Real", km: "រៀលប្រេស៊ីល", symbol: "R$" },
  { code: "ARS", numeric: "032", name: "Argentine Peso", km: "ប៉េសូអាហ្សង់ទីន", symbol: "$" },
  { code: "CLP", numeric: "152", name: "Chilean Peso", km: "ប៉េសូឈីលី", symbol: "$" },
  { code: "COP", numeric: "170", name: "Colombian Peso", km: "ប៉េសូកូឡុំប៊ី", symbol: "$" },
  { code: "CAD", numeric: "124", name: "Canadian Dollar", km: "ដុល្លារកាណាដា", symbol: "C$" },
  { code: "KZT", numeric: "398", name: "Kazakhstani Tenge", km: "តេងកាហ្សាក់ស្ថាន", symbol: "₸" },
];

export default function CurrencyCodes() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("currency-codes:query", "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.numeric.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.km.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <ToolShell
      title="Currency Codes (ISO 4217)"
      khmerTitle="លេខកូដរូបិយប័ណ្ណ"
      description="Searchable reference table of ISO 4217 currency codes, numeric codes, names, and common symbols. Symbols shown are common representations, not official ISO symbols."
      descriptionKm="តារាងយោងស្វែងរកបាននៃលេខកូដរូបិយប័ណ្ណ ISO 4217 លេខកូដលេខ ឈ្មោះ និងនិមិត្តសញ្ញាទូទៅ។ និមិត្តសញ្ញាគឺជាតំណាងទូទៅ មិនមែនជានិមិត្តសញ្ញាផ្លូវការរបស់ ISO ទេ។"
    >
      <Field label={t("Search currency", "ស្វែងរករូបិយប័ណ្ណ")}>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. USD, Riel, 116", "ឧ. USD, រៀល, 116")}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-xs font-medium text-[var(--ink-dim)]">
          {t("Reference table", "តារាងយោង")}
        </span>
        <span className="text-xs text-[var(--ink-faint)]">
          {t(`${filtered.length} of ${CURRENCIES.length} currencies`, `រូបិយប័ណ្ណ ${filtered.length} ក្នុងចំណោម ${CURRENCIES.length}`)}
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">{t("Currency", "រូបិយប័ណ្ណ")}</th>
              <th className="px-3 py-2">ISO</th>
              <th className="px-3 py-2">{t("Numeric", "លេខកូដលេខ")}</th>
              <th className="px-3 py-2">{t("Symbol", "និមិត្តសញ្ញា")}</th>
              <th className="px-3 py-2"><span className="sr-only">{t("Copy", "ចម្លង")}</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2 text-[var(--ink)]">{t(c.name, c.km)}</td>
                <td className="px-3 py-2 font-mono-ui font-semibold text-[var(--gold)]">{c.code}</td>
                <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{c.numeric}</td>
                <td className="px-3 py-2 font-mono-ui text-[var(--ink)]">{c.symbol}</td>
                <td className="px-3 py-2">
                  <CopyButton text={c.code} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-6 text-center text-sm text-[var(--ink-dim)]">{t("No matches.", "រកមិនឃើញទេ។")}</p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Curated reference — codes follow the ISO 4217 standard (maintained by SIX Interbank Clearing on behalf of ISO); numeric codes keep leading zeros as published. Symbols may vary by font or locale.",
          "ឯកសារយោងដកស្រង់ — លេខកូដធ្វើតាមស្ដង់ដារ ISO 4217 (គ្រប់គ្រងដោយ SIX Interbank Clearing ក្នុងនាម ISO); លេខកូដលេខរក្សាលេខសូន្យខាងមុខដូចដែលបានបោះពុម្ព។ និមិត្តសញ្ញាអាចខុសគ្នាតាមពុម្ពអក្សរ ឬតំបន់។"
        )}
      </p>
    </ToolShell>
  );
}

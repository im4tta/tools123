"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Country = {
  flag: string;
  name: string;
  km: string;
  iso2: string;
  code: string;
  example: string;
};

const COUNTRIES: Country[] = [
  { flag: "🇰🇭", name: "Cambodia", km: "កម្ពុជា", iso2: "KH", code: "+855", example: "+855 12 345 678" },
  { flag: "🇹🇭", name: "Thailand", km: "ថៃ", iso2: "TH", code: "+66", example: "+66 81 234 5678" },
  { flag: "🇻🇳", name: "Vietnam", km: "វៀតណាម", iso2: "VN", code: "+84", example: "+84 91 234 5678" },
  { flag: "🇱🇦", name: "Laos", km: "ឡាវ", iso2: "LA", code: "+856", example: "+856 20 1234 5678" },
  { flag: "🇲🇲", name: "Myanmar", km: "មីយ៉ាន់ម៉ា", iso2: "MM", code: "+95", example: "+95 9 123 456 789" },
  { flag: "🇲🇾", name: "Malaysia", km: "ម៉ាឡេស៊ី", iso2: "MY", code: "+60", example: "+60 12 345 6789" },
  { flag: "🇸🇬", name: "Singapore", km: "សិង្ហបុរី", iso2: "SG", code: "+65", example: "+65 8123 4567" },
  { flag: "🇮🇩", name: "Indonesia", km: "ឥណ្ឌូនេស៊ី", iso2: "ID", code: "+62", example: "+62 812 3456 7890" },
  { flag: "🇵🇭", name: "Philippines", km: "ហ្វីលីពីន", iso2: "PH", code: "+63", example: "+63 917 123 4567" },
  { flag: "🇧🇳", name: "Brunei", km: "ប្រ៊ុយណេ", iso2: "BN", code: "+673", example: "+673 712 3456" },
  { flag: "🇨🇳", name: "China", km: "ចិន", iso2: "CN", code: "+86", example: "+86 138 1234 5678" },
  { flag: "🇭🇰", name: "Hong Kong", km: "ហុងកុង", iso2: "HK", code: "+852", example: "+852 9123 4567" },
  { flag: "🇹🇼", name: "Taiwan", km: "តៃវ៉ាន់", iso2: "TW", code: "+886", example: "+886 912 345 678" },
  { flag: "🇯🇵", name: "Japan", km: "ជប៉ុន", iso2: "JP", code: "+81", example: "+81 90 1234 5678" },
  { flag: "🇰🇷", name: "South Korea", km: "កូរ៉េខាងត្បូង", iso2: "KR", code: "+82", example: "+82 10 1234 5678" },
  { flag: "🇲🇳", name: "Mongolia", km: "ម៉ុងហ្គោលី", iso2: "MN", code: "+976", example: "+976 9911 2345" },
  { flag: "🇮🇳", name: "India", km: "ឥណ្ឌា", iso2: "IN", code: "+91", example: "+91 98123 45678" },
  { flag: "🇵🇰", name: "Pakistan", km: "ប៉ាគីស្ថាន", iso2: "PK", code: "+92", example: "+92 301 234 5678" },
  { flag: "🇧🇩", name: "Bangladesh", km: "បង់ក្លាដែស", iso2: "BD", code: "+880", example: "+880 1712 345678" },
  { flag: "🇱🇰", name: "Sri Lanka", km: "ស្រីលង្កា", iso2: "LK", code: "+94", example: "+94 71 234 5678" },
  { flag: "🇳🇵", name: "Nepal", km: "នេប៉ាល់", iso2: "NP", code: "+977", example: "+977 981 234 5678" },
  { flag: "🇦🇫", name: "Afghanistan", km: "អាហ្វហ្គានីស្ថាន", iso2: "AF", code: "+93", example: "+93 70 123 4567" },
  { flag: "🇮🇷", name: "Iran", km: "អ៊ីរ៉ង់", iso2: "IR", code: "+98", example: "+98 912 123 4567" },
  { flag: "🇮🇶", name: "Iraq", km: "អ៊ីរ៉ាក់", iso2: "IQ", code: "+964", example: "+964 791 123 4567" },
  { flag: "🇸🇦", name: "Saudi Arabia", km: "អារ៉ាប៊ីសាអូឌីត", iso2: "SA", code: "+966", example: "+966 55 123 4567" },
  { flag: "🇦🇪", name: "United Arab Emirates", km: "អេមីរ៉ាតអារ៉ាប់រួម", iso2: "AE", code: "+971", example: "+971 50 123 4567" },
  { flag: "🇮🇱", name: "Israel", km: "អ៊ីស្រាអែល", iso2: "IL", code: "+972", example: "+972 50 123 4567" },
  { flag: "🇹🇷", name: "Turkey", km: "ទួរគី", iso2: "TR", code: "+90", example: "+90 532 123 4567" },
  { flag: "🇰🇿", name: "Kazakhstan", km: "កាហ្សាក់ស្ថាន", iso2: "KZ", code: "+7", example: "+7 701 123 4567" },
  { flag: "🇺🇿", name: "Uzbekistan", km: "អ៊ូសបេគីស្ថាន", iso2: "UZ", code: "+998", example: "+998 90 123 4567" },
  { flag: "🇯🇴", name: "Jordan", km: "ហ្ស៊កដានី", iso2: "JO", code: "+962", example: "+962 79 1234 567" },
  { flag: "🇱🇧", name: "Lebanon", km: "លីបង់", iso2: "LB", code: "+961", example: "+961 70 123 456" },
  { flag: "🇰🇼", name: "Kuwait", km: "គុយវ៉ែត", iso2: "KW", code: "+965", example: "+965 5123 4567" },
  { flag: "🇶🇦", name: "Qatar", km: "កាតា", iso2: "QA", code: "+974", example: "+974 3312 3456" },
  { flag: "🇧🇭", name: "Bahrain", km: "បារ៉ែន", iso2: "BH", code: "+973", example: "+973 3612 3456" },
  { flag: "🇴🇲", name: "Oman", km: "អូម៉ង់", iso2: "OM", code: "+968", example: "+968 9212 3456" },
  { flag: "🇺🇸", name: "United States", km: "សហរដ្ឋអាមេរិក", iso2: "US", code: "+1", example: "+1 555 123 4567" },
  { flag: "🇨🇦", name: "Canada", km: "កាណាដា", iso2: "CA", code: "+1", example: "+1 555 123 4567" },
  { flag: "🇲🇽", name: "Mexico", km: "ម៉ិកស៊ិក", iso2: "MX", code: "+52", example: "+52 55 1234 5678" },
  { flag: "🇧🇷", name: "Brazil", km: "ប្រេស៊ីល", iso2: "BR", code: "+55", example: "+55 11 91234 5678" },
  { flag: "🇦🇷", name: "Argentina", km: "អាហ្សង់ទីន", iso2: "AR", code: "+54", example: "+54 9 11 1234 5678" },
  { flag: "🇨🇱", name: "Chile", km: "ឈីលី", iso2: "CL", code: "+56", example: "+56 9 1234 5678" },
  { flag: "🇨🇴", name: "Colombia", km: "កូឡុំប៊ី", iso2: "CO", code: "+57", example: "+57 300 123 4567" },
  { flag: "🇵🇪", name: "Peru", km: "ប៉េរូ", iso2: "PE", code: "+51", example: "+51 912 345 678" },
  { flag: "🇻🇪", name: "Venezuela", km: "វេណេស៊ុយអេឡា", iso2: "VE", code: "+58", example: "+58 412 123 4567" },
  { flag: "🇪🇨", name: "Ecuador", km: "អេក្វាឌ័រ", iso2: "EC", code: "+593", example: "+593 99 123 4567" },
  { flag: "🇬🇧", name: "United Kingdom", km: "ចក្រភពអង់គ្លេស", iso2: "GB", code: "+44", example: "+44 7700 900123" },
  { flag: "🇫🇷", name: "France", km: "បារាំង", iso2: "FR", code: "+33", example: "+33 6 12 34 56 78" },
  { flag: "🇩🇪", name: "Germany", km: "អាល្លឺម៉ង់", iso2: "DE", code: "+49", example: "+49 151 1234 5678" },
  { flag: "🇮🇹", name: "Italy", km: "អ៊ីតាលី", iso2: "IT", code: "+39", example: "+39 320 123 4567" },
  { flag: "🇪🇸", name: "Spain", km: "អេស្ប៉ាញ", iso2: "ES", code: "+34", example: "+34 612 345 678" },
  { flag: "🇵🇹", name: "Portugal", km: "ព័រទុយហ្គាល់", iso2: "PT", code: "+351", example: "+351 912 345 678" },
  { flag: "🇳🇱", name: "Netherlands", km: "ហូឡង់", iso2: "NL", code: "+31", example: "+31 6 1234 5678" },
  { flag: "🇧🇪", name: "Belgium", km: "បែលហ្ស៊ិក", iso2: "BE", code: "+32", example: "+32 470 12 34 56" },
  { flag: "🇨🇭", name: "Switzerland", km: "ស្វីស", iso2: "CH", code: "+41", example: "+41 79 123 45 67" },
  { flag: "🇦🇹", name: "Austria", km: "អូទ្រីស", iso2: "AT", code: "+43", example: "+43 664 123 4567" },
  { flag: "🇸🇪", name: "Sweden", km: "ស៊ុយអែត", iso2: "SE", code: "+46", example: "+46 70 123 45 67" },
  { flag: "🇳🇴", name: "Norway", km: "ន័រវេស", iso2: "NO", code: "+47", example: "+47 412 34 567" },
  { flag: "🇩🇰", name: "Denmark", km: "ដាណឺម៉ាក", iso2: "DK", code: "+45", example: "+45 20 12 34 56" },
  { flag: "🇫🇮", name: "Finland", km: "ហ្វាំងឡង់", iso2: "FI", code: "+358", example: "+358 40 123 4567" },
  { flag: "🇵🇱", name: "Poland", km: "ប៉ូឡូញ", iso2: "PL", code: "+48", example: "+48 512 345 678" },
  { flag: "🇨🇿", name: "Czech Republic", km: "សាធារណរដ្ឋឆេក", iso2: "CZ", code: "+420", example: "+420 601 123 456" },
  { flag: "🇬🇷", name: "Greece", km: "ក្រិក", iso2: "GR", code: "+30", example: "+30 691 234 5678" },
  { flag: "🇮🇪", name: "Ireland", km: "អៀរឡង់", iso2: "IE", code: "+353", example: "+353 85 123 4567" },
  { flag: "🇷🇺", name: "Russia", km: "រុស្ស៊ី", iso2: "RU", code: "+7", example: "+7 912 345 67 89" },
  { flag: "🇺🇦", name: "Ukraine", km: "អ៊ុយក្រែន", iso2: "UA", code: "+380", example: "+380 67 123 4567" },
  { flag: "🇭🇺", name: "Hungary", km: "ហុងគ្រី", iso2: "HU", code: "+36", example: "+36 30 123 4567" },
  { flag: "🇷🇴", name: "Romania", km: "រូម៉ានី", iso2: "RO", code: "+40", example: "+40 712 345 678" },
  { flag: "🇧🇬", name: "Bulgaria", km: "ប៊ុលហ្គារី", iso2: "BG", code: "+359", example: "+359 88 123 4567" },
  { flag: "🇦🇺", name: "Australia", km: "អូស្ត្រាលី", iso2: "AU", code: "+61", example: "+61 412 345 678" },
  { flag: "🇳🇿", name: "New Zealand", km: "នូវែលសេឡង់", iso2: "NZ", code: "+64", example: "+64 21 123 4567" },
  { flag: "🇪🇬", name: "Egypt", km: "អេហ្ស៊ីប", iso2: "EG", code: "+20", example: "+20 100 123 4567" },
  { flag: "🇿🇦", name: "South Africa", km: "អាហ្វ្រិកខាងត្បូង", iso2: "ZA", code: "+27", example: "+27 82 123 4567" },
  { flag: "🇳🇬", name: "Nigeria", km: "នីហ្សេរីយ៉ា", iso2: "NG", code: "+234", example: "+234 803 123 4567" },
  { flag: "🇰🇪", name: "Kenya", km: "កេនយ៉ា", iso2: "KE", code: "+254", example: "+254 712 345 678" },
  { flag: "🇪🇹", name: "Ethiopia", km: "អេត្យូពី", iso2: "ET", code: "+251", example: "+251 91 123 4567" },
  { flag: "🇲🇦", name: "Morocco", km: "ម៉ារ៉ុក", iso2: "MA", code: "+212", example: "+212 661 234 567" },
  { flag: "🇩🇿", name: "Algeria", km: "អាល់ហ្សេរី", iso2: "DZ", code: "+213", example: "+213 661 234 567" },
  { flag: "🇹🇳", name: "Tunisia", km: "ទុយនីស៊ី", iso2: "TN", code: "+216", example: "+216 22 123 456" },
  { flag: "🇬🇭", name: "Ghana", km: "ហ្គាណា", iso2: "GH", code: "+233", example: "+233 24 123 4567" },
];

export default function CountryDialingCodes() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("dialing-codes:query", "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const plain = q.replace("+", "");
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.km.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.code.replace("+", "").includes(plain) ||
        c.example.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <ToolShell
      title="Country Dialing Codes"
      khmerTitle="លេខកូដទូរស័ព្ទអន្តរជាតិ"
      description="Searchable reference table of international country calling codes (ITU E.164) with flags, ISO codes, and an illustrative example format. Codes can vary by carrier — always verify before dialing."
      descriptionKm="តារាងយោងស្វែងរកបាននៃលេខកូដទូរស័ព្ទអន្តរជាតិ (ITU E.164) រួមជាមួយទង់ លេខកូដ ISO និងឧទាហរណ៍ទម្រង់លេខ។ លេខកូដអាចប្រែប្រួលតាមក្រុមហ៊ុនទូរស័ព្ទ — សូមផ្ទៀងផ្ទាត់ជានិច្ចមុនពេលទូរស័ព្ទ។"
    >
      <Field label={t("Search country or code", "ស្វែងរកប្រទេស ឬលេខកូដ")}>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. Cambodia, KH, 855", "ឧ. កម្ពុជា, KH, 855")}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-xs font-medium text-[var(--ink-dim)]">
          {t("Reference table", "តារាងយោង")}
        </span>
        <span className="text-xs text-[var(--ink-faint)]">
          {t(`${filtered.length} of ${COUNTRIES.length} countries`, `ប្រទេស ${filtered.length} ក្នុងចំណោម ${COUNTRIES.length}`)}
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">{t("Country", "ប្រទេស")}</th>
              <th className="px-3 py-2">ISO2</th>
              <th className="px-3 py-2">{t("Calling code", "លេខកូដទូរស័ព្ទ")}</th>
              <th className="px-3 py-2">{t("Example format", "ទម្រង់ឧទាហរណ៍")}</th>
              <th className="px-3 py-2"><span className="sr-only">{t("Copy", "ចម្លង")}</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.iso2} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2 text-[var(--ink)]">
                  <span className="mr-2">{c.flag}</span>
                  {t(c.name, c.km)}
                </td>
                <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{c.iso2}</td>
                <td className="px-3 py-2 font-mono-ui font-semibold text-[var(--gold)]">{c.code}</td>
                <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{c.example}</td>
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
          "Curated reference — calling codes follow the ITU-T E.164 numbering plan; some countries share a code (e.g. +1 for the US and Canada). Example formats are illustrative patterns only, not real phone numbers — verify the exact numbering plan with your carrier before dialing.",
          "ឯកសារយោងដកស្រង់ — លេខកូដទូរស័ព្ទធ្វើតាមផែនការលេខរៀង ITU-T E.164; ប្រទេសខ្លះប្រើលេខកូដរួមគ្នា (ឧ. +1 សម្រាប់អាមេរិក និងកាណាដា)។ ទម្រង់ឧទាហរណ៍គ្រាន់តែជាគំរូបង្ហាញ មិនមែនជាលេខទូរស័ព្ទពិតទេ — សូមផ្ទៀងផ្ទាត់ផែនការលេខរៀងជាមួយក្រុមហ៊ុនទូរស័ព្ទរបស់អ្នកមុនពេលទូរស័ព្ទ។"
        )}
      </p>
    </ToolShell>
  );
}

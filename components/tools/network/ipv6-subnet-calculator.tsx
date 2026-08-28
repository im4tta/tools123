"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { parseIpv6, expandIpv6, formatIpv6, ipv6Type, ipv6Range } from "@/lib/calc/net";

export default function Ipv6SubnetCalculator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("ipv6:input", "2001:db8:1234:5678::/48");

  const result = useMemo(() => {
    const parsed = parseIpv6(input);
    if (!parsed) return { error: true } as const;
    const prefix = parsed.prefix ?? 128;
    return {
      error: false,
      value: parsed.value,
      prefix,
      type: ipv6Type(parsed.value),
      expanded: expandIpv6(parsed.value),
      compressed: formatIpv6(parsed.value),
      range: ipv6Range(parsed.value, prefix),
    } as const;
  }, [input]);

  const big = (v: bigint) => v.toString();

  return (
    <ToolShell
      title="IPv6 Subnet Calculator"
      khmerTitle="គណនា Subnet IPv6"
      description="Expand or compress an IPv6 address, identify its scope, and compute the exact first/last address and size of its subnet."
      descriptionKm="ពង្រីក ឬបង្រួមអាសយដ្ឋាន IPv6 កំណត់ប្រភេទរបស់វា និងគណនាអាសយដ្ឋានដើម/ចុង និងទំហំ subnet ពិតប្រាកដ។"
    >
      <Field label={t("Address or address/prefix", "អាសយដ្ឋាន ឬអាសយដ្ឋាន/prefix")} hintKm={t("e.g. 2001:db8::/32", "ឧ. 2001:db8::/32")}>
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder="2001:db8::/32" className="font-mono-ui" />
      </Field>

      {result.error ? (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Not a valid IPv6 address or prefix. Use forms like 2001:db8::1 or 2001:db8::/48.", "អាសយដ្ឋាន IPv6 ឬ prefix មិនត្រឹមត្រូវ។ ប្រើទម្រង់ដូចជា 2001:db8::1 ឬ 2001:db8::/48។")} error />
      ) : (
        <div className="space-y-2">
          <Output label={t("Address type", "ប្រភេទអាសយដ្ឋាន")} value={result.type} mono={false} />
          <Output label={t("Compressed (RFC 5952)", "បង្រួម (RFC 5952)")} value={result.compressed} />
          <Output label={t("Expanded", "ពង្រីកពេញ")} value={result.expanded} />
          <Output label={t("Prefix length", "ប្រវែង prefix")} value={`/${result.prefix}`} />
          {result.range && (
            <>
              <Output label={t("First address in subnet", "អាសយដ្ឋានដើមក្នុង subnet")} value={formatIpv6(result.range.first)} />
              <Output label={t("Last address in subnet", "អាសយដ្ឋានចុងក្នុង subnet")} value={formatIpv6(result.range.last)} />
              <Output label={t("Total addresses", "អាសយដ្ឋានសរុប")} value={`2^${128 - result.prefix} = ${big(result.range.count)}`} />
              {result.prefix < 64 && (
                <Output label={t("Number of /64 subnets", "ចំនួន subnet /64")} value={`2^${64 - result.prefix} = ${big(result.range.count / (2n ** 64n))}`} />
              )}
            </>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Math per RFC 4291: an IPv6 address is a 128-bit integer; the /prefix fixes the leading bits and the remaining host bits range within the subnet. Compression follows RFC 5952 (longest zero run becomes ::). Address scopes: fe80::/10 link-local, fc00::/7 unique local, ff00::/8 multicast, 2000::/3 global unicast, 2001:db8::/32 documentation.", "គណិតវិទ្យាតាម RFC 4291៖ អាសយដ្ឋាន IPv6 ជាលេខគត់ ១២៨-ប៊ីត; /prefix កំណត់ប៊ីតដើម ហើយប៊ីតផ្សេងទៀតផ្លាស់ប្តូរក្នុង subnet។ ការបង្រួមតាម RFC ៥៩៥២ (ដំរីសុទ្ធក្រោយវែងបំផុតទៅជា ::)។ ប្រភេទ៖ fe80::/១០ link-local, fc00::/៧ unique local, ff00::/៨ multicast, ២០០០::/៣ global unicast, 2001:db8::/៣២ ឯកសារ។")}
      </p>
    </ToolShell>
  );
}

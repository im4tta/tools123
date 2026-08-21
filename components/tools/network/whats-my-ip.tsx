"use client";
import { useCallback, useEffect, useState } from "react";
import { Copy, Globe, Loader2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useClipboard } from "@/components/ClipboardProvider";
import { useLanguage } from "@/components/LanguageProvider";

interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  timezone?: string;
}

export default function WhatsMyIp() {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as IpInfo;
      if (!json.ip) throw new Error("no ip");
      setInfo(json);
    } catch {
      try {
        const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(10000) });
        const json = (await res.json()) as { ip: string };
        setInfo({ ip: json.ip });
      } catch {
        setError(t("Could not detect your IP — check your connection and retry.", "មិនអាចរកលេខ IP របស់អ្នកបានទេ — សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត។"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function copyIp() {
    if (!info?.ip) return;
    await copyText(info.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const rows: [string, string | undefined][] = info
    ? [
        [t("City", "ក្រុង"), info.city],
        [t("Region", "តំបន់"), info.region],
        [t("Country", "ប្រទេស"), info.country_name],
        [t("ISP / Organization", "អ៊ីស្ពី / អង្គភាព"), info.org],
        [t("Timezone", "តំបន់ពេលវេលា"), info.timezone],
      ]
    : [];

  return (
    <ToolShell
      title="What's My IP"
      khmerTitle="លេខ IP របស់ខ្ញុំ"
      description="Show your public IP address with ISP and rough location details from a free IP API."
      descriptionKm="បង្ហាញលេខ IP សាធារណៈរបស់អ្នក ព្រមទាំងអ៊ីស្ពី និងទីតាំងប្រហាក់ប្រហែល។"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8">
          {loading ? (
            <Loader2 size={28} className="animate-spin text-[var(--ink-faint)]" />
          ) : error ? (
            <>
              <p className="text-sm text-[var(--danger)]">{error}</p>
              <button type="button" onClick={load} className="rounded-lg border border-[var(--ground-line)] px-4 py-2 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
                {t("Retry", "ព្យាយាមម្តងទៀត")}
              </button>
            </>
          ) : (
            <>
              <Globe size={22} className="text-[var(--teal)]" />
              <div className="font-mono-ui text-3xl font-bold tabular-nums text-[var(--ink)]">{info?.ip}</div>
              <button type="button" onClick={copyIp} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
                <Copy size={13} />{copied ? t("Copied!", "បានចម្លង!") : t("Copy IP", "ចម្លង IP")}
              </button>
            </>
          )}
        </div>

        {info && rows.some(([, v]) => v) && (
          <div className="divide-y divide-[var(--ground-line)] rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]">
            {rows.filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-[var(--ink-dim)]">{label}</span>
                <span className="text-right text-[var(--ink)]">{value}</span>
              </div>
            ))}
          </div>
        )}

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Live data: your IP is looked up via ipapi.co (fallback: ipify.org). Location is approximate and comes from your ISP's registration.", "ទិន្នន័យផ្ទាល់៖ លេខ IP របស់អ្នកត្រូវបានពិនិត្យតាម ipapi.co (បញ្ចូលគ្នា៖ ipify.org)។ ទីតាំងគឺប្រហាក់ប្រហែល ដោយផ្អែកលើការចុះឈ្មោះរបស់អ៊ីស្ពី។")}
        </p>
      </div>
    </ToolShell>
  );
}
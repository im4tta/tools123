"use client";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface DnsRow { name: string; type: number; TTL: number; data: string }
const TYPE_IDS: Record<number, string> = { 1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 43: "DS", 46: "RRSIG", 48: "DNSKEY", 45: "NSEC" };

async function withTimeout(fn: () => Promise<Response>, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fn(); } finally { clearTimeout(timer); }
}

function normalizeHost(input: string): string {
  return input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();
}

export default function SiteForensics() {
  const { text: t } = useLanguage();
  const [url, setUrl] = useToolState("site-forensics:url", "khmerfox.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | {
    host: string;
    dns: { type: number; data: string; TTL: number }[];
    http: { status: number; url: string; server?: string; contentType?: string; location?: string; headers: Record<string, string> };
    ip?: { ip: string; region?: string; country?: string; city?: string; org?: string };
    whois?: { name: string; description?: string; eventDate?: string; events: { eventAction: string; eventDate: string }[] };
    wayback?: { url: string; timestamp: string; available: boolean; statusCode?: number };
  } | null>(null);

  async function inspect() {
    const host = normalizeHost(url);
    if (!host) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const [dnsRes, httpRes, whoisRes, ipRes, waybackRes] = await Promise.allSettled([
        withTimeout(() => fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=ANY`)),
        withTimeout(() => fetch(`https://${host}/`, { redirect: "follow" })),
        fetch(`https://rdap.org/domain/${encodeURIComponent(host)}`),
        withTimeout(() => fetch(`https://ipapi.co/json/`)),
        withTimeout(() => fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(host)}`)),
      ]);

      // DNS
      let dns: { type: number; data: string; TTL: number }[] = [];
      if (dnsRes.status === "fulfilled") {
        const json = (await dnsRes.value.json()) as { Answer?: DnsRow[] };
        dns = (json.Answer ?? []).map((a) => ({ type: a.type, data: a.data, TTL: a.TTL }));
      }

      // HTTP
      let http: { status: number; url: string; server?: string; contentType?: string; location?: string; headers: Record<string, string> } | null = null;
      if (httpRes.status === "fulfilled") {
        const head: Record<string, string> = {};
        httpRes.value.headers.forEach((v, k) => { head[k] = v; });
        http = {
          status: httpRes.value.status,
          url: httpRes.value.url || `https://${host}/`,
          server: head["server"],
          contentType: head["content-type"],
          location: head["location"],
          headers: head,
        };
      }

      // WHOIS via RDAP
      let whois: { name: string; description?: string; events: { eventAction: string; eventDate: string }[] } | null = null;
      if (whoisRes.status === "fulfilled" && whoisRes.value.ok) {
        const j = (await whoisRes.value.json()) as {
          handle?: string;
          ldhName?: string;
          events?: { eventAction?: string; eventDate?: string }[];
          entities?: { roles?: string[]; vcardArray?: [string, unknown[]] }[];
        };
        whois = {
          name: j.ldhName || host,
          events: (j.events ?? []).filter((e) => e.eventAction && e.eventDate).map((e) => ({ eventAction: e.eventAction!, eventDate: e.eventDate! })),
        };
      }

      // IP info
      let ip: { ip: string; region?: string; country?: string; city?: string; org?: string } | null = null;
      if (ipRes.status === "fulfilled") {
        const j = (await ipRes.value.json()) as { ip?: string; region?: string; country_name?: string; country?: string; city?: string; org?: string };
        if (j.ip) ip = { ip: j.ip, region: j.region, country: j.country || j.country_name, city: j.city, org: j.org };
      }

      // Wayback
      let wayback: { url: string; timestamp: string; available: boolean; statusCode?: number } | null = null;
      if (waybackRes.status === "fulfilled") {
        const j = (await waybackRes.value.json()) as { closest?: { url?: string; timestamp?: string; available?: boolean; status?: string } };
        if (j.closest && j.closest.available) {
          wayback = {
            url: j.closest.url ?? "",
            timestamp: j.closest.timestamp ?? "",
            available: !!j.closest.available,
            statusCode: j.closest.status ? Number(j.closest.status) : undefined,
          };
        }
      }

      if (!http && dns.length === 0 && !whois && !ip && !wayback) {
        setError(t("No forensic data could be gathered for this host.", "រកមិនឃើញទិន្នន័យស្រាវជ្រាវសម្រាប់ដូមេននេះទេ។"));
        return;
      }
      setResult({ host, dns, http: http ?? { status: 0, url: "", headers: {} }, ip: ip ?? undefined, whois: whois ?? undefined, wayback: wayback ?? undefined });
    } catch {
      setError(t("Forensics failed — check the host and your connection.", "ការស្រាវជ្រាវបរាជ័យ — សូមពិនិត្យដូមេន និងការតភ្ជាប់។"));
    } finally {
      setLoading(false);
    }
  }

  const chip = (label: string, value?: string) => value && (
    <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="mt-1 break-all font-mono-ui text-sm text-[var(--ink)]">{value}</div>
    </div>
  );

  return (
    <ToolShell
      title="Site Forensics"
      khmerTitle="ស្រាវជ្រាវគេហទំព័រ"
      description="Inspect any domain in one shot — live DNS records, HTTP response headers, WHOIS registration (RDAP), IP geolocation, and the Wayback Machine history."
      descriptionKm="ពិនិត្យដូមេនណាមួយក្នុងមួយដង — កំណត់ត្រា DNS ផ្ទាល់ បឋមកថា HTTP ការចុះបញ្ជី WHOIS (RDAP) ទីតាំង IP និងប្រវត្តិ Wayback Machine។"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Field label={t("Domain / URL", "ដូមេន / URL")}>
            <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" className="font-mono-ui" />
          </Field>
        </div>
        <div className="flex items-end pb-[2px]">
          <Button onClick={inspect} disabled={loading || !url.trim()}>
            {loading ? <Loader2 size={15} className="mr-1 inline animate-spin" /> : <Search size={15} className="mr-1 inline" />}
            {loading ? t("Inspecting…", "កំពុងពិនិត្យ…") : t("Inspect", "ពិនិត្យ")}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {result && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="font-medium text-[var(--ink)]">{result.host}</h2>
            {result.http?.status > 0 && (
              <span className="rounded bg-[var(--gold-dim)]/30 px-2 py-0.5 text-xs text-[var(--gold)]">HTTP {result.http.status}</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chip(t("Resolved IP", "IP ដែលបានដោះស្រាយ"), result.ip?.ip)}
            {chip(t("Server", "ម៉ាស៊ីនរក្សាទុក"), result.http?.server)}
            {chip(t("Country", "ប្រទេស"), result.ip?.country)}
            {chip(t("City", "ទីក្រុង"), result.ip?.city)}
            {chip(t("ISP / Org", "ISP / អង្គការ"), result.ip?.org)}
            {chip(t("Content-Type", "ប្រភេទមាតិកា"), result.http?.contentType?.split(";")[0])}
          </div>

          {result.whois && (
            <div className="rounded-xl border border-[var(--ground-line)]">
              <div className="border-b border-[var(--ground-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("WHOIS (RDAP)", "WHOIS (RDAP)")}</div>
              <div className="divide-y divide-[var(--ground-line)] text-sm">
                {result.whois.events.map((e, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5">
                    <span className="capitalize text-[var(--ink-dim)]">{e.eventAction.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>
                    <span className="font-mono-ui text-[var(--ink)]">{new Date(e.eventDate).toUTCString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.dns.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)]">
              <div className="border-b border-[var(--ground-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("DNS records", "កំណត់ត្រា DNS")}</div>
              <table className="w-full min-w-[480px] border-collapse text-xs">
                <tbody>
                  {result.dns.slice(0, 40).map((r, i) => (
                    <tr key={i} className="border-b border-[var(--ground-line)] last:border-0">
                      <td className="w-20 px-3 py-2 font-mono-ui text-[var(--ink)]">{TYPE_IDS[r.type] ?? r.type}</td>
                      <td className="break-all px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{r.data}</td>
                      <td className="px-3 py-2 text-right text-[var(--ink-faint)]">{r.TTL}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.wayback && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Wayback snapshot", "រូបថត Wayback")}</div>
              <a href={`https://web.archive.org/web/${result.wayback.timestamp}/${result.host}`} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-[var(--gold)] underline underline-offset-2">
                https://web.archive.org/web/{result.wayback.timestamp}/{result.host}
              </a>
              <p className="mt-1 text-xs text-[var(--ink-faint)]">{new Date(result.wayback.timestamp.replace(/^(\d{4})(\d{2})(\d{2}).*$/, "$1/$2/$3")).toUTCString()}</p>
            </div>
          )}

          {result.http?.headers && Object.keys(result.http.headers).length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)]">
              <div className="border-b border-[var(--ground-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Response headers", "បឋមកថាឆ្លើយតប")}</div>
              <table className="w-full min-w-[480px] border-collapse text-xs">
                <tbody>
                  {Object.entries(result.http.headers).slice(0, 30).map(([k, v]) => (
                    <tr key={k} className="border-b border-[var(--ground-line)] last:border-0">
                      <td className="w-40 break-all px-3 py-2 font-mono-ui text-[var(--ink)]">{k}</td>
                      <td className="break-all px-3 py-2 text-[var(--ink-dim)]">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Live data: DNS queries go to Google Public DNS and your host is fetched from your browser, so the site you inspect is visible to those services. WHOIS uses the public RDAP (rdap.org); IP location via ipapi.co is approximate.", "ទិន្នន័យផ្ទាល់៖ ការស្នើសុំ DNS ទៅ Google Public DNS ហើយដូមេនត្រូវបានទាញពីកម្មវិធីរុករករបស់អ្នក ដូច្នេះគេហទំព័រដែលអ្នកពិនិត្យនឹងត្រូវបានគេឃើញ។ WHOIS ប្រើ RDAP សាធារណៈ (rdap.org); ទីតាំង IP តាម ipapi.co គឺប្រហាក់ប្រហែល។")}
      </p>
    </ToolShell>
  );
}

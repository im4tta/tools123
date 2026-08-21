"use client";
import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA"] as const;
type RecordType = (typeof TYPES)[number];

interface Answer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

const TYPE_IDS: Record<number, string> = { 1: "A", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 2: "NS", 28: "AAAA" };

export default function DnsLookup() {
  const { text: t } = useLanguage();
  const [domain, setDomain] = useToolState("dns-lookup:domain", "google.com");
  const [type, setType] = useToolState<RecordType>("dns-lookup:type", "A");
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup() {
    const host = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!host) return;
    setLoading(true);
    setError("");
    setAnswers(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${type}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { Status: number; Answer?: Answer[] };
      if (json.Status !== 0) {
        setError(t("No records found for this name.", "រកមិនឃើញកំណត់ត្រាសម្រាប់ឈ្មោះនេះទេ។"));
      } else {
        setAnswers((json.Answer ?? []).filter((a) => TYPE_IDS[a.type] === type));
      }
    } catch {
      setError(t("Lookup failed — check your connection and try again.", "ការស្វែងរកបរាជ័យ — សូមពិនិត្យការតភ្ជាប់របស់អ្នក ហើយព្យាយាមម្តងទៀត។"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      title="Live DNS Lookup"
      khmerTitle="ស្វែងរក DNS ផ្ទាល់"
      description="Query live DNS records (A, AAAA, MX, TXT, NS, CNAME, SOA) for any domain via DNS-over-HTTPS."
      descriptionKm="សួរកំណត់ត្រា DNS ផ្ទាល់ (A, AAAA, MX, TXT, NS, CNAME, SOA) សម្រាប់ដូមេនណាមួយ។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
          <Field label={t("Domain", "ដូមេន")}>
            <TextInput value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="font-mono-ui" />
          </Field>
          <Field label={t("Record type", "ប្រភេទកំណត់ត្រា")}>
            <Select value={type} onChange={(e) => setType(e.target.value as RecordType)}>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </Select>
          </Field>
        </div>

        <button type="button" onClick={lookup} disabled={loading || !domain.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
          {t("Look up", "ស្វែងរក")}
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {answers && answers.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)]">
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-left text-[var(--ink-dim)]">
                  <th className="px-3 py-2 font-semibold">{t("Name", "ឈ្មោះ")}</th>
                  <th className="px-3 py-2 font-semibold">{t("Type", "ប្រភេទ")}</th>
                  <th className="px-3 py-2 font-semibold">TTL</th>
                  <th className="px-3 py-2 font-semibold">{t("Value", "តម្លៃ")}</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((a, i) => (
                  <tr key={i} className="border-b border-[var(--ground-line)] last:border-0">
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink)]">{a.name}</td>
                    <td className="px-3 py-2 text-[var(--ink-dim)]">{TYPE_IDS[a.type] ?? a.type}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{a.TTL}s</td>
                    <td className="break-all px-3 py-2 font-mono-ui text-[var(--ink)]">{a.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Live data: queries are sent to Google Public DNS (dns.google) from your browser. The domain you look up is visible to that service.", "ទិន្នន័យផ្ទាល់៖ សំណើត្រូវបានបញ្ជូនទៅ Google Public DNS (dns.google) ពីកម្មវិធីរុករករបស់អ្នក។ ដូមេនដែលអ្នកស្វែងរកនឹងត្រូវបានគេមើលឃើញ។")}
        </p>
      </div>
    </ToolShell>
  );
}
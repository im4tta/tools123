"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type HeaderField = { name: string; value: string };
type IpInfo = { ip: string; private: boolean };

type ReceivedHop = {
  from?: string;
  by?: string;
  with?: string;
  for?: string;
  id?: string;
  timestamp?: string;
  ips: IpInfo[];
};

type ParsedHeaders = {
  total: number;
  known: { key: string; value: string }[];
  received: ReceivedHop[];
  authRaw: string[];
  auth: { spf?: string; dkim?: string; dmarc?: string };
};

const KNOWN_ORDER = ["from", "to", "date", "subject", "message-id", "reply-to", "return-path", "delivered-to"] as const;

const FIELD_LABELS: Record<string, [string, string]> = {
  from: ["From", "អ្នកផ្ញើ"],
  to: ["To", "អ្នកទទួល"],
  date: ["Date", "កាលបរិច្ឆេទ"],
  subject: ["Subject", "ប្រធានបទ"],
  "message-id": ["Message-ID", "លេខសារ"],
  "reply-to": ["Reply-To", "ឆ្លើយទៅ"],
  "return-path": ["Return-Path", "ផ្លូវត្រឡប់"],
  "delivered-to": ["Delivered-To", "ដល់អ្នកទទួល"],
};

function isPrivateIp(ip: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // fe80::/10
  return false;
}

function extractIps(value: string): IpInfo[] {
  const seen = new Set<string>();
  const ips: IpInfo[] = [];
  const push = (ip: string) => {
    if (seen.has(ip)) return;
    seen.add(ip);
    ips.push({ ip, private: isPrivateIp(ip) });
  };
  const v4re = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;
  let m: RegExpExecArray | null;
  while ((m = v4re.exec(value)) !== null) {
    const octets = m[0].split(".").map(Number);
    if (octets.every((o) => o <= 255)) push(m[0]);
  }
  const v6re = /\[([0-9a-fA-F:]+)\]/g;
  while ((m = v6re.exec(value)) !== null) {
    if (m[1].includes(":")) push(m[1]);
  }
  return ips;
}

function parseHeaders(raw: string): ParsedHeaders {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const fields: HeaderField[] = [];
  let current: HeaderField | null = null;

  for (const line of lines) {
    if (!line.trim()) break; // blank line ends the header block
    if (/^[ \t]/.test(line) && current) {
      current.value += " " + line.trim();
      continue;
    }
    const idx = line.indexOf(":");
    if (idx <= 0) continue; // malformed line — skip
    const name = line.slice(0, idx).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(name)) continue;
    current = { name, value: line.slice(idx + 1).trim() };
    fields.push(current);
  }

  const known = KNOWN_ORDER.map((k) => fields.find((f) => f.name === k))
    .filter((f): f is HeaderField => f !== undefined)
    .map((f) => ({ key: f.name, value: f.value }));

  const receivedRaw = fields.filter((f) => f.name === "received").map((f) => f.value);
  const received: ReceivedHop[] = receivedRaw.map((value) => {
    const hop: ReceivedHop = { ips: extractIps(value) };
    const fromMatch = /from\s+(\S+)/.exec(value);
    if (fromMatch) hop.from = fromMatch[1];
    const byMatch = /by\s+(\S+)/.exec(value);
    if (byMatch) hop.by = byMatch[1];
    const withMatch = /with\s+(\S+)/.exec(value);
    if (withMatch) hop.with = withMatch[1];
    const idMatch = /id\s+(\S+)/.exec(value);
    if (idMatch) hop.id = idMatch[1];
    const forMatch = /for\s+<([^>]+)>|for\s+(\S+)/.exec(value);
    if (forMatch) hop.for = forMatch[1] ?? forMatch[2];
    const semi = value.lastIndexOf(";");
    if (semi !== -1) hop.timestamp = value.slice(semi + 1).trim();
    return hop;
  });
  received.reverse(); // newest-first in raw order → oldest → newest

  const authRaw = fields.filter((f) => f.name === "authentication-results").map((f) => f.value);
  const auth: { spf?: string; dkim?: string; dmarc?: string } = {};
  for (const v of authRaw) {
    if (!auth.spf) auth.spf = /spf=(\w+)/i.exec(v)?.[1];
    if (!auth.dkim) auth.dkim = /dkim=(\w+)/i.exec(v)?.[1];
    if (!auth.dmarc) auth.dmarc = /dmarc=(\w+)/i.exec(v)?.[1];
  }

  return { total: fields.length, known, received, authRaw, auth };
}

const VERDICT_UI: Record<string, string> = {
  pass: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]",
  fail: "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]",
  hardfail: "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]",
  softfail: "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]",
  neutral: "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]",
  none: "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]",
};

export default function EmailHeaderAnalyzer() {
  const { text: t } = useLanguage();
  const [raw, setRaw] = useToolState("eha:headers", "");

  const parsed = useMemo(() => {
    try {
      return parseHeaders(raw);
    } catch {
      return { total: 0, known: [], received: [], authRaw: [], auth: {} } as ParsedHeaders;
    }
  }, [raw]);

  return (
    <ToolShell
      title="Email Header Analyzer"
      khmerTitle="វិភាគបឋមកថាអ៊ីមែល"
      description="Paste raw email headers to trace the Received chain, extract IPs, and review SPF/DKIM/DMARC results."
      descriptionKm="បិទភ្ជាប់បឋមកថាអ៊ីមែល ដើម្បីតាមដានខ្សែបញ្ជូន Received ទាញយក IP និងពិនិត្យលទ្ធផល SPF/DKIM/DMARC។"
    >
      <Field label={t("Raw email headers", "បឋមកថាអ៊ីមែលដើម")}>
        <TextArea
          rows={8}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t("Paste the full headers from “Show original”…", "បិទភ្ជាប់បឋមកថាពេញលេញពី “Show original”…")}
        />
      </Field>

      {raw.trim() === "" ? (
        <p className="text-sm text-[var(--ink-dim)]">{t("Paste headers to analyze them.", "សូមបិទភ្ជាប់បឋមកថាដើម្បីវិភាគ។")}</p>
      ) : parsed.total === 0 ? (
        <p className="text-sm text-[var(--danger)]">
          {t("No headers found. Paste the raw message headers (each line like “From: …”), not just the message body.", "រកមិនឃើញបឋមកថាទេ។ សូមបិទភ្ជាប់បឋមកថាដើម (បន្ទាត់នីមួយៗដូចជា “From: …”) មិនមែនត្រឹមតែអត្ថបទសារទេ។")}
        </p>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-[var(--ink-dim)]">
            {t("Parsed", "បានវិភាគ")} {parsed.total} {t("headers", "បឋមកថា")}
          </p>

          {parsed.known.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {parsed.known.map((f) => {
                const labels = FIELD_LABELS[f.key] ?? [f.key, f.key];
                return (
                  <div key={f.key} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(labels[0], labels[1])}</div>
                    <div className="mt-0.5 break-all text-sm text-[var(--ink)]">{f.value}</div>
                  </div>
                );
              })}
            </div>
          )}

          {parsed.received.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">
                {t("Received chain (oldest → newest)", "ខ្សែបញ្ជូន Received (ចាស់ → ថ្មី)")}
              </h3>
              {parsed.received.map((hop, i) => (
                <div key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono-ui font-semibold text-[var(--gold)]">#{i + 1}</span>
                    {i === 0 && <span className="text-[var(--ink-dim)]">{t("(oldest)", "(ចាស់ជាងគេ)")}</span>}
                    {i === parsed.received.length - 1 && <span className="text-[var(--ink-dim)]">{t("(newest)", "(ថ្មីជាងគេ)")}</span>}
                    {hop.timestamp && <span className="font-mono-ui text-[var(--ink-dim)]">{hop.timestamp}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {hop.from && <span className="rounded bg-[var(--ground-line)]/50 px-2 py-0.5 text-[var(--ink)]"><span className="text-[var(--ink-dim)]">from </span>{hop.from}</span>}
                    {hop.by && <span className="rounded bg-[var(--ground-line)]/50 px-2 py-0.5 text-[var(--ink)]"><span className="text-[var(--ink-dim)]">by </span>{hop.by}</span>}
                    {hop.with && <span className="rounded bg-[var(--ground-line)]/50 px-2 py-0.5 text-[var(--ink)]"><span className="text-[var(--ink-dim)]">with </span>{hop.with}</span>}
                    {hop.id && <span className="rounded bg-[var(--ground-line)]/50 px-2 py-0.5 text-[var(--ink)]"><span className="text-[var(--ink-dim)]">id </span>{hop.id}</span>}
                    {hop.for && <span className="rounded bg-[var(--ground-line)]/50 px-2 py-0.5 text-[var(--ink)]"><span className="text-[var(--ink-dim)]">for </span>{hop.for}</span>}
                  </div>
                  {hop.ips.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {hop.ips.map((ip) => (
                        <span
                          key={ip.ip}
                          className={`rounded-full border px-2 py-0.5 font-mono-ui text-[10px] font-medium ${
                            ip.private
                              ? "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"
                              : "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
                          }`}
                        >
                          {ip.ip} · {ip.private ? t("private", "ឯកជន") : t("public", "សាធារណៈ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {parsed.authRaw.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{t("Authentication-Results", "លទ្ធផលផ្ទៀងផ្ទាត់")}</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {(["spf", "dkim", "dmarc"] as const).map((method) => {
                  const verdict = parsed.auth[method];
                  return (
                    <span
                      key={method}
                      className={`rounded-full border px-2.5 py-1 font-mono-ui font-medium uppercase ${verdict ? (VERDICT_UI[verdict.toLowerCase()] ?? VERDICT_UI.neutral) : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
                    >
                      {method}={verdict ?? t("absent", "មិនមាន")}
                    </span>
                  );
                })}
              </div>
              <Output label={t("Raw Authentication-Results", "Authentication-Results ដើម")} value={parsed.authRaw.join("\n")} />
            </div>
          )}

          {!parsed.authRaw.length && parsed.received.length > 0 && (
            <p className="text-xs text-[var(--ink-dim)]">
              {t("No Authentication-Results header present — the message may not have passed SPF/DKIM/DMARC checks or the sender did not publish results.", "មិនមានបឋមកថា Authentication-Results ទេ — សារអាចមិនបានឆ្លងកាត់ការត្រួតពិនិត្យ SPF/DKIM/DMARC ឬអ្នកផ្ញើមិនបានផ្សាយលទ្ធផល។")}
            </p>
          )}

          <p className="text-xs text-[var(--ink-dim)]">
            {t("Parsing is local and heuristic — it never contacts any server. Private IPs (RFC 1918, link-local, loopback) are flagged so you can spot internal hops.", "ការវិភាគធ្វើក្នុងឧបករណ៍ និងតាមបែបប៉ាន់ស្មាន — មិនដែលទាក់ទងម៉ាស៊ីនមេណាទេ។ IP ឯកជន (RFC 1918, link-local, loopback) ត្រូវបានគូសសម្គាល់ ដើម្បីសម្គាល់ការបញ្ជូនផ្ទៃក្នុង។")}
          </p>
        </div>
      )}
    </ToolShell>
  );
}

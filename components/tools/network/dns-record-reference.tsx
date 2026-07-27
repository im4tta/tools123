"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const RECORDS: [string, string][] = [
  ["A", "Maps a hostname to an IPv4 address"],
  ["AAAA", "Maps a hostname to an IPv6 address"],
  ["CNAME", "Aliases one hostname to another"],
  ["MX", "Specifies mail servers for the domain"],
  ["TXT", "Arbitrary text — SPF, DKIM, verification"],
  ["NS", "Delegates the domain to name servers"],
  ["SOA", "Start of authority — zone admin info"],
  ["PTR", "Reverse lookup, IP to hostname"],
  ["SRV", "Service location, port, and priority"],
  ["CAA", "Restricts which CAs may issue certificates"],
  ["NAPTR", "Naming authority pointer, used in SIP/ENUM"],
];

export default function DnsRecordReference() {
  const [query, setQuery] = useToolState("dns-record-reference:query", "");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECORDS.filter(([name, desc]) => name.toLowerCase().includes(q) || desc.toLowerCase().includes(q));
  }, [query]);

  return (
    <ToolShell title="DNS Record Type Reference" description="Quick lookup of common DNS record types and what they do.">
      <Field label="Filter"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. mail, mx, ipv6" /></Field>
      <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">
        {filtered.map(([name, desc]) => (
          <div key={name} className="flex gap-4 px-3 py-2.5 text-sm">
            <span className="w-16 shrink-0 font-mono-ui text-[var(--gold)]">{name}</span>
            <span className="text-[var(--ink-dim)]">{desc}</span>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const PORTS: [number, string, string][] = [
  [20, "FTP", "Data transfer"], [21, "FTP", "Control"], [22, "SSH", "Secure shell"],
  [23, "Telnet", "Unencrypted remote login"], [25, "SMTP", "Mail transfer"],
  [53, "DNS", "Domain name lookup"], [80, "HTTP", "Web traffic"], [110, "POP3", "Mail retrieval"],
  [123, "NTP", "Time synchronization"], [143, "IMAP", "Mail retrieval"], [161, "SNMP", "Network management"],
  [194, "IRC", "Chat"], [389, "LDAP", "Directory access"], [443, "HTTPS", "Encrypted web traffic"],
  [465, "SMTPS", "Encrypted mail submission"], [587, "SMTP", "Mail submission"],
  [993, "IMAPS", "Encrypted mail retrieval"], [995, "POP3S", "Encrypted mail retrieval"],
  [1433, "MSSQL", "SQL Server"], [1521, "Oracle DB", "Database listener"],
  [3306, "MySQL", "Database"], [3389, "RDP", "Remote desktop"], [5432, "PostgreSQL", "Database"],
  [5900, "VNC", "Remote desktop"], [6379, "Redis", "In-memory data store"],
  [8080, "HTTP-alt", "Alternate web / proxy"], [27017, "MongoDB", "Database"],
];

export default function PortLookup() {
  const [query, setQuery] = useToolState("port-lookup:query", "443");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PORTS.filter(([port, name, desc]) => String(port).includes(q) || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q));
  }, [query]);

  return (
    <ToolShell title="Common Port Number Reference" description="Search well-known TCP/UDP ports by number or service name.">
      <Field label="Search"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
      <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">
        {results.map(([port, name, desc]) => (
          <div key={port} className="flex items-center gap-4 px-3 py-2 text-sm">
            <span className="w-14 font-mono-ui text-[var(--gold)]">{port}</span>
            <span className="w-24 shrink-0 text-[var(--ink)]">{name}</span>
            <span className="text-[var(--ink-dim)]">{desc}</span>
          </div>
        ))}
        {results.length === 0 && <div className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">No match</div>}
      </div>
    </ToolShell>
  );
}

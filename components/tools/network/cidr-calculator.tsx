"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function ipToInt(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
function intToIp(n: number) {
  return [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255].join(".");
}

export default function CidrCalculator() {
  const [cidr, setCidr] = useToolState("cidr-calculator:cidr", "192.168.1.0/24");
  const [ip, prefixStr] = cidr.split("/");
  const prefix = Number(prefixStr);
  const base = ipToInt(ip ?? "");
  const valid = base !== null && !isNaN(prefix) && prefix >= 0 && prefix <= 32;

  function compute() {
    if (!valid || base === null) return null;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = (base & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? total : Math.max(0, total - 2);
    return {
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      mask: intToIp(mask),
      firstHost: prefix >= 31 ? intToIp(network) : intToIp(network + 1),
      lastHost: prefix >= 31 ? intToIp(broadcast) : intToIp(broadcast - 1),
      total,
      usable,
    };
  }
  const r = compute();

  return (
    <ToolShell title="CIDR / Subnet Calculator" description="Enter an address in CIDR notation (e.g. 192.168.1.0/24) to see network details.">
      <Field label="CIDR"><TextInput value={cidr} onChange={(e) => setCidr(e.target.value)} className="font-mono-ui" /></Field>
      {r ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Network address", r.network], ["Broadcast address", r.broadcast], ["Subnet mask", r.mask],
            ["First usable host", r.firstHost], ["Last usable host", r.lastHost],
            ["Total addresses", r.total.toLocaleString()], ["Usable hosts", r.usable.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
              <div className="mt-1 font-mono-ui text-[var(--ink)]">{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <Output label="Result" value="Enter a valid IPv4 CIDR, e.g. 10.0.0.0/16" error />
      )}
    </ToolShell>
  );
}

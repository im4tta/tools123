"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

function expand(addr: string): string[] | null {
  const parts = addr.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  if (parts.length === 1 && head.length !== 8) return null;
  if (parts.length === 2 && head.length + tail.length >= 8) return null;

  const missing = 8 - head.length - tail.length;
  const full = parts.length === 2 ? [...head, ...Array(missing).fill("0"), ...tail] : head;
  if (full.length !== 8) return null;

  const out: string[] = [];
  for (const g of full) {
    if (!/^[0-9a-fA-F]{0,4}$/.test(g)) return null;
    out.push((g || "0").padStart(4, "0").toLowerCase());
  }
  return out;
}

function compress(groups: string[]): string {
  const stripped = groups.map((g) => g.replace(/^0+(?=.)/, ""));
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (stripped[i] === "0") {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }
  if (bestLen < 2) return stripped.join(":");
  const before = stripped.slice(0, bestStart).join(":");
  const after = stripped.slice(bestStart + bestLen).join(":");
  return `${before}::${after}`;
}

export default function Ipv6CompressorTool() {
  const [input, setInput] = useState("2001:0db8:0000:0000:0000:ff00:0042:8329");

  const { expanded, compressed, error } = useMemo(() => {
    const groups = expand(input.trim());
    if (!groups) return { expanded: "", compressed: "", error: true };
    return { expanded: groups.join(":"), compressed: compress(groups), error: false };
  }, [input]);

  return (
    <ToolShell
      title="IPv6 Address Compressor / Expander"
      description="Convert an IPv6 address between its fully expanded form and its shortest compressed (::) representation."
    >
      <Field label="IPv6 address" hint="Accepts full or already-compressed form">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label="Expanded" value={expanded} error={error} />
      <Output label="Compressed" value={compressed} error={error} />
      {error && <p className="text-xs text-[var(--danger)]">Not a recognizable IPv6 address.</p>}
    </ToolShell>
  );
}

"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function classify(o1: number) {
  if (o1 >= 1 && o1 <= 126) return "Class A";
  if (o1 === 127) return "Loopback";
  if (o1 >= 128 && o1 <= 191) return "Class B";
  if (o1 >= 192 && o1 <= 223) return "Class C";
  if (o1 >= 224 && o1 <= 239) return "Class D (multicast)";
  return "Class E (reserved)";
}
function isPrivate(parts: number[]) {
  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export default function IpParser() {
  const [ip, setIp] = useToolState("ip-parser:ip", "192.168.1.42");
  const parts = ip.split(".").map(Number);
  const valid = parts.length === 4 && parts.every((p) => Number.isInteger(p) && p >= 0 && p <= 255);

  return (
    <ToolShell title="IPv4 Address Parser" description="Classifies an IPv4 address and shows its binary form.">
      <Field label="IPv4 address"><TextInput value={ip} onChange={(e) => setIp(e.target.value)} className="font-mono-ui" /></Field>
      {valid ? (
        <>
          <Output label="Class" value={classify(parts[0])} />
          <Output label="Scope" value={isPrivate(parts) ? "Private (RFC 1918)" : "Public / routable"} />
          <Output label="Binary" value={parts.map((p) => p.toString(2).padStart(8, "0")).join(".")} />
        </>
      ) : (
        <Output label="Result" value="Enter a valid IPv4 address, e.g. 10.0.0.1" error />
      )}
    </ToolShell>
  );
}

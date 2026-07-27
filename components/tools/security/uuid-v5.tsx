"use client";
import { useEffect } from "react";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const NAMESPACES: Record<string, string> = {
  DNS: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  URL: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
};

function hexToBytes(hex: string) {
  const clean = hex.replace(/-/g, "");
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function uuidV5(namespace: string, name: string) {
  const nsBytes = hexToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const buffer = new Uint8Array(nsBytes.length + nameBytes.length);
  buffer.set(nsBytes, 0);
  buffer.set(nameBytes, nsBytes.length);
  const hashBuf = await crypto.subtle.digest("SHA-1", buffer);
  const hash = new Uint8Array(hashBuf).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function UuidV5() {
  const [ns, setNs] = useToolState("uuid-v5:ns", "URL");
  const [name, setName] = useToolState("uuid-v5:name", "https://toolbox.example/123");
  const [result, setResult] = useToolState("uuid-v5:result", "");

  useEffect(() => {
    uuidV5(NAMESPACES[ns], name).then(setResult);
  }, [ns, name]);

  return (
    <ToolShell title="Namespace UUID (v5) Generator" description="Deterministic SHA-1-based UUID from a namespace and name — same inputs always give the same UUID.">
      <Row>
        <Field label="Namespace">
          <Select value={ns} onChange={(e) => setNs(e.target.value)}>
            {Object.keys(NAMESPACES).map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </Field>
        <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="UUID v5" value={result} />
    </ToolShell>
  );
}

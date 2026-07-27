"use client";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function TimestampTool() {
  const [unix, setUnix] = useToolState("timestamp:unix", String(Math.floor(Date.now() / 1000)));
  const [iso, setIso] = useToolState("timestamp:iso", new Date().toISOString());

  function fromUnix(v: string) {
    setUnix(v);
    const n = Number(v);
    if (!isNaN(n)) setIso(new Date(n * (v.length <= 10 ? 1000 : 1)).toISOString());
  }
  function fromIso(v: string) {
    setIso(v);
    const t = Date.parse(v);
    if (!isNaN(t)) setUnix(String(Math.floor(t / 1000)));
  }

  return (
    <ToolShell title="Unix Timestamp Converter" description="Convert between Unix time and ISO 8601 / local date-time, both directions live.">
      <Row>
        <Field label="Unix timestamp (seconds)"><TextInput value={unix} onChange={(e) => fromUnix(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="ISO 8601"><TextInput value={iso} onChange={(e) => fromIso(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Button onClick={() => fromUnix(String(Math.floor(Date.now() / 1000)))}>Use current time</Button>
      <Output label="Local time" value={isNaN(Date.parse(iso)) ? "" : new Date(iso).toString()} />
    </ToolShell>
  );
}

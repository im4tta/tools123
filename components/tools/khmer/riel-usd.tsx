"use client";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function RielUsd() {
  const [riel, setRiel] = useToolState("riel-usd:riel", "400000");
  const [rate, setRate] = useToolState("riel-usd:rate", "4100");
  const r = Number(riel);
  const rt = Number(rate);
  const usd = !isNaN(r) && !isNaN(rt) && rt > 0 ? r / rt : null;

  return (
    <ToolShell title="Riel ⟷ USD Converter" khmerTitle="ប្តូររូបិយប័ណ្ណ" description="Convert between Riel and USD using a rate you set — Cambodia has no single fixed peg, so enter today's rate from your bank or NBC.">
      <Row>
        <Field label="Amount (KHR)"><TextInput value={riel} onChange={(e) => setRiel(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Rate (KHR per USD)"><TextInput value={rate} onChange={(e) => setRate(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="≈ USD" value={usd === null ? "" : `$${usd.toFixed(2)}`} error={usd === null} />
    </ToolShell>
  );
}

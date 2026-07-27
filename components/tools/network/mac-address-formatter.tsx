"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function MacAddressFormatter() {
  const [input, setInput] = useToolState("mac-address-formatter:input", "00:1A:2B:3C:4D:5E");
  const [format, setFormat] = useToolState<"colon" | "hyphen" | "dot" | "plain">("mac-address-formatter:format", "colon");

  const hex = input.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  const valid = hex.length === 12;

  function formatted() {
    if (!valid) return "";
    const bytes = hex.match(/.{2}/g) ?? [];
    if (format === "colon") return bytes.join(":");
    if (format === "hyphen") return bytes.join("-");
    if (format === "plain") return hex;
    const groups = hex.match(/.{4}/g) ?? [];
    return groups.join(".");
  }

  return (
    <ToolShell title="MAC Address Formatter" description="Normalize a MAC address into colon, hyphen, dot, or plain notation.">
      <Row>
        <Field label="MAC address"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Format">
          <Select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="colon">Colon (00:1A:2B:3C:4D:5E)</option>
            <option value="hyphen">Hyphen (00-1A-2B-3C-4D-5E)</option>
            <option value="dot">Cisco dot (001A.2B3C.4D5E)</option>
            <option value="plain">Plain (001A2B3C4D5E)</option>
          </Select>
        </Field>
      </Row>
      <Output label="Formatted" value={formatted()} error={!valid} />
    </ToolShell>
  );
}

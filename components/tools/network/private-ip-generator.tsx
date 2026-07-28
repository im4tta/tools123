"use client";
import { useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const RANGES = {
  "10": () => `10.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
  "172": () => `172.${rand(16, 31)}.${rand(0, 255)}.${rand(1, 254)}`,
  "192": () => `192.168.${rand(0, 255)}.${rand(1, 254)}`,
  "link-local": () => `169.254.${rand(0, 255)}.${rand(1, 254)}`,
} as const;

function rand(min: number, max: number) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return min + (arr[0] % (max - min + 1));
}

type RangeKey = keyof typeof RANGES;

export default function PrivateIpGeneratorTool() {
  const [range, setRange] = useToolState<RangeKey>("private-ip-generator-range", "192");
  const [list, setList] = useState<string[]>([]);

  function generate() {
    setList(Array.from({ length: 10 }, () => RANGES[range]()));
  }

  return (
    <ToolShell
      title="Random Private IP Generator"
      description="Generate random addresses from the RFC 1918 private ranges (or the link-local block) for test fixtures and documentation."
    >
      <Field label="Range">
        <Select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className="w-64">
          <option value="10">10.0.0.0/8</option>
          <option value="172">172.16.0.0/12</option>
          <option value="192">192.168.0.0/16</option>
          <option value="link-local">169.254.0.0/16 (link-local)</option>
        </Select>
      </Field>
      <Button onClick={generate}>Generate 10</Button>
      <Output label="Addresses" value={list.join("\n")} />
    </ToolShell>
  );
}

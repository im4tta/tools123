"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function UuidTool() {
  const [count, setCount] = useToolState("uuid:count", 5);
  const [list, setList] = useToolState<string[]>("uuid:list", Array.from({ length: 5 }, () => crypto.randomUUID()));

  function generate() {
    setList(Array.from({ length: Math.max(1, Math.min(50, count)) }, () => crypto.randomUUID()));
  }

  return (
    <ToolShell title="UUID Generator" description="Generate RFC 4122 v4 UUIDs using the browser's cryptographically secure random source.">
      <Field label="How many" hint="1–50">
        <TextInput type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-32" />
      </Field>
      <Button onClick={generate}>Generate</Button>
      <Output label="UUIDs" value={list.join("\n")} />
    </ToolShell>
  );
}

"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const FIELD_NAMES = ["minute", "hour", "day of month", "month", "day of week"];

function describeField(value: string, name: string) {
  if (value === "*") return `every ${name}`;
  if (value.includes("/")) {
    const [range, step] = value.split("/");
    return `every ${step} ${name}${range !== "*" ? ` within ${range}` : "s"}`;
  }
  if (value.includes(",")) return `${name} in {${value}}`;
  if (value.includes("-")) return `${name} ${value.replace("-", " through ")}`;
  return `${name} ${value}`;
}

export default function CronParser() {
  const [expr, setExpr] = useToolState("cron-parser:expr", "*/15 6-18 * * 1-5");
  const { description, error } = useMemo(() => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return { description: "", error: "Expected 5 fields: minute hour day month weekday" };
    return { description: parts.map((p, i) => describeField(p, FIELD_NAMES[i])).join(" · "), error: "" };
  }, [expr]);

  return (
    <ToolShell title="Cron Expression Explainer" description="Paste a standard 5-field cron expression and get a plain-language breakdown.">
      <Field label="Cron expression"><TextInput value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono-ui" /></Field>
      <Output label={error ? "Error" : "Reads as"} value={error || description} error={!!error} mono={false} />
    </ToolShell>
  );
}

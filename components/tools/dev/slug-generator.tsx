"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function SlugGenerator() {
  const [input, setInput] = useToolState("slug-generator:input", "Roeuh — Cambodia Temple Heritage Map");
  const slug = useMemo(
    () => input.toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    [input]
  );
  return (
    <ToolShell title="Slug Generator" description="Turn a title into a clean, URL-safe slug.">
      <Field label="Title"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Output label="Slug" value={slug} />
    </ToolShell>
  );
}

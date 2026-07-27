"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function WordCounter() {
  const [text, setText] = useToolState("word-counter:text", "");
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = [...text].length;
    const charsNoSpace = [...text.replace(/\s/g, "")].length;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const sentences = (text.match(/[.!?។]+(\s|$)/g) || []).length;
    return { words, chars, charsNoSpace, lines, sentences };
  }, [text]);

  return (
    <ToolShell title="Word & Character Counter" description="Count words, characters, lines and sentences as you type — Unicode aware, so Khmer text counts correctly too.">
      <Field label="Text">
        <TextArea rows={10} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
            <div className="font-mono-ui text-xl text-[var(--gold)]">{v}</div>
            <div className="text-xs capitalize text-[var(--ink-dim)]">{k === "charsNoSpace" ? "no-space" : k}</div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

"use client";
import { ToolShell, TextArea, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function LineSorter() {
  const [input, setInput] = useToolState("line-sorter:input", "banana\napple\ncherry");
  const [order, setOrder] = useToolState<"asc" | "desc">("line-sorter:order", "asc");
  const [mode, setMode] = useToolState<"alpha" | "numeric" | "length">("line-sorter:mode", "alpha");

  function sorted() {
    const lines = input.split("\n");
    const cmp = (a: string, b: string) => {
      if (mode === "numeric") return (Number(a) || 0) - (Number(b) || 0);
      if (mode === "length") return a.length - b.length;
      return a.localeCompare(b);
    };
    const result = [...lines].sort(cmp);
    return order === "asc" ? result : result.reverse();
  }

  return (
    <ToolShell title="Line Sorter" description="Sort lines alphabetically, numerically, or by length.">
      <Field label="Lines"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Row>
        <Field label="Sort by">
          <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="alpha">Alphabetical</option>
            <option value="numeric">Numeric</option>
            <option value="length">Length</option>
          </Select>
        </Field>
        <Field label="Order">
          <Select value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
        </Field>
      </Row>
      <Output label="Sorted" value={sorted().join("\n")} />
    </ToolShell>
  );
}

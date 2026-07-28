"use client";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const WORDS = "sen preah reach kandal stung phnom penh tonle sap angkor wat khmer riel canal branch structure ledger survey manifest cadastral irrigation".split(" ");

function makeParagraph(len: number) {
  const arr = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const s = arr.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

export default function LoremIpsum() {
  const [count, setCount] = useToolState("lorem-ipsum:count", 3);
  const [unit, setUnit] = useToolState<"paragraphs" | "sentences">("lorem-ipsum:unit", "paragraphs");
  const [output, setOutput] = useToolState("lorem-ipsum:output", Array.from({ length: 3 }, () => makeParagraph(24)).join("\n\n"));

  function generate() {
    if (unit === "paragraphs") {
      setOutput(Array.from({ length: count }, () => makeParagraph(24)).join("\n\n"));
    } else {
      setOutput(Array.from({ length: count }, () => makeParagraph(9)).join(" "));
    }
  }

  return (
    <ToolShell title="Placeholder Text Generator" description="Generate filler text for mockups — sized by paragraph or sentence count.">
      <div className="flex items-end gap-3">
        <Field label="Count"><TextInput type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-24" /></Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="w-40">
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
          </Select>
        </Field>
        <Button onClick={generate}>Generate</Button>
      </div>
      <Output value={output} mono={false} />
    </ToolShell>
  );
}

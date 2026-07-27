"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const MINOR = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "at", "by", "in", "of", "on", "to", "up", "as", "is"]);

export default function TitleCase() {
  const [input, setInput] = useToolState("title-case:input", "one workbench, one hundred twenty-three instruments");

  function toTitleCase(text: string) {
    const words = text.split(" ");
    return words.map((word, i) => {
      const lower = word.toLowerCase();
      if (i !== 0 && i !== words.length - 1 && MINOR.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(" ");
  }

  return (
    <ToolShell title="Title Case Converter" description="AP-style title casing: capitalizes major words, lowercases short articles and conjunctions mid-title.">
      <Field label="Text"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Output label="Title Case" value={toTitleCase(input)} />
    </ToolShell>
  );
}

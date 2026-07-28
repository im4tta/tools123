"use client";
import { useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";

const WORDS = [
  "river", "temple", "lotus", "market", "silver", "granite", "harbor", "meadow", "cinder", "willow",
  "canyon", "ember", "falcon", "garnet", "horizon", "island", "jasmine", "kernel", "lantern", "mango",
  "nectar", "orchid", "palace", "quartz", "ribbon", "summit", "thicket", "umbrella", "velvet", "walnut",
  "xylophone", "yonder", "zephyr", "amber", "boulder", "cascade", "delta", "echo", "forest", "glacier",
  "harvest", "indigo", "jungle", "kestrel", "lagoon", "monsoon", "nebula", "opal", "pinnacle", "quiver",
];

function randomWord() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return WORDS[arr[0] % WORDS.length];
}

function randomDigit() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % 10;
}

export default function PassphraseGeneratorTool() {
  const [count, setCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [addNumber, setAddNumber] = useState(true);
  const [capitalize, setCapitalize] = useState(true);
  const [list, setList] = useState<string[]>([]);

  function generate() {
    const passphrases = Array.from({ length: 5 }, () => {
      const n = Math.max(3, Math.min(8, count));
      const words = Array.from({ length: n }, () => {
        const w = randomWord();
        return capitalize ? w[0].toUpperCase() + w.slice(1) : w;
      });
      if (addNumber) words.push(String(randomDigit()) + String(randomDigit()));
      return words.join(separator);
    });
    setList(passphrases);
  }

  return (
    <ToolShell
      title="Passphrase Generator"
      description="Generate memorable word-based passphrases (diceware-style) as a friendlier alternative to random character passwords."
    >
      <Row>
        <Field label="Word count" hint="3–8">
          <TextInput type="number" min={3} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </Field>
        <Field label="Separator">
          <Select value={separator} onChange={(e) => setSeparator(e.target.value)}>
            <option value="-">Hyphen (-)</option>
            <option value="_">Underscore (_)</option>
            <option value=".">Period (.)</option>
            <option value=" ">Space</option>
            <option value="">None</option>
          </Select>
        </Field>
      </Row>
      <div className="flex gap-6 text-sm text-[var(--ink-dim)]">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} />
          Capitalize words
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={addNumber} onChange={(e) => setAddNumber(e.target.checked)} />
          Append 2-digit number
        </label>
      </div>
      <Button onClick={generate}>Generate</Button>
      <Output label="Passphrases" value={list.join("\n")} />
    </ToolShell>
  );
}

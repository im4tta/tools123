"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .split("")
    .sort()
    .join("");
}

export default function AnagramCheckerTool() {
  const [a, setA] = useState("listen");
  const [b, setB] = useState("silent");

  const { isAnagram, normA, normB } = useMemo(() => {
    const na = normalize(a);
    const nb = normalize(b);
    return { isAnagram: na.length > 0 && na === nb, normA: na, normB: nb };
  }, [a, b]);

  return (
    <ToolShell
      title="Anagram Checker"
      description="Check whether two phrases are anagrams of each other, ignoring case, spaces, and punctuation."
    >
      <Field label="Phrase A">
        <TextInput value={a} onChange={(e) => setA(e.target.value)} />
      </Field>
      <Field label="Phrase B">
        <TextInput value={b} onChange={(e) => setB(e.target.value)} />
      </Field>
      <Output
        label="Result"
        value={
          normA.length === 0 || normB.length === 0
            ? "Enter both phrases"
            : isAnagram
            ? "✓ These are anagrams"
            : "✗ Not anagrams"
        }
        mono={false}
      />
      <Output label="Sorted letters (A / B)" value={`${normA}\n${normB}`} />
    </ToolShell>
  );
}

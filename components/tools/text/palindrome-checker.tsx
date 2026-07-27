"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function PalindromeChecker() {
  const [input, setInput] = useToolState("palindrome-checker:input", "A man a plan a canal Panama");
  const normalized = useMemo(() => input.toLowerCase().replace(/[^a-z0-9]/g, ""), [input]);
  const isPalindrome = normalized.length > 0 && normalized === [...normalized].reverse().join("");

  return (
    <ToolShell title="Palindrome Checker" description="Checks if text reads the same forwards and backwards, ignoring case, spaces, and punctuation.">
      <Field label="Text"><TextInput value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Output label="Normalized" value={normalized} />
      <Output label="Result" value={normalized ? (isPalindrome ? "Yes — it is a palindrome" : "No — not a palindrome") : ""} error={normalized.length > 0 && !isPalindrome} />
    </ToolShell>
  );
}

"use client";
import { useEffect } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

export default function HashTool() {
  const [input, setInput] = useToolState("hash:input", "waterworks-kandal-stung");
  const [hashes, setHashes] = useToolState<Record<string, string>>("hash:hashes", {});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const enc = new TextEncoder().encode(input);
      const results: Record<string, string> = {};
      for (const algo of ALGOS) {
        const digest = await crypto.subtle.digest(algo, enc);
        results[algo] = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
      }
      if (!cancelled) setHashes(results);
    }
    run();
    return () => { cancelled = true; };
  }, [input]);

  return (
    <ToolShell title="Hash Generator" description="Compute SHA-1 / SHA-256 / SHA-384 / SHA-512 digests via the Web Crypto API. Nothing leaves the browser.">
      <Field label="Input text">
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      {ALGOS.map((a) => (
        <Output key={a} label={a} value={hashes[a] ?? ""} />
      ))}
    </ToolShell>
  );
}

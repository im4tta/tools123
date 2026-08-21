"use client";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64(buf: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function computeHmac(message: string, secret: string, algo: Algo): Promise<{ hex: string; base64: string }> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: algo }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return { hex: toHex(sig), base64: toBase64(sig) };
}

export default function HmacGenerator() {
  const { text: t } = useLanguage();
  const [message, setMessage] = useToolState("hmac:message", "The quick brown fox jumps over the lazy dog");
  const [secret, setSecret] = useToolState("hmac:secret", "my-secret-key");
  const [algo, setAlgo] = useToolState<Algo>("hmac:algo", "SHA-256");
  const [hex, setHex] = useState("");
  const [base64, setBase64] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (message === "" || secret === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHex("");
      setBase64("");
      setError("");
      return;
    }
    computeHmac(message, secret, algo)
      .then((r) => {
        if (!cancelled) {
          setHex(r.hex);
          setBase64(r.base64);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("Could not compute the signature.", "មិនអាចគណនាហត្ថលេខាបានទេ។"));
      });
    return () => {
      cancelled = true;
    };
  }, [message, secret, algo, t]);

  return (
    <ToolShell
      title="HMAC Generator"
      khmerTitle="បង្កើត HMAC"
      description="Compute HMAC signatures with SHA-1, SHA-256, SHA-384, or SHA-512 via the Web Crypto API."
      descriptionKm="គណនាហត្ថលេខា HMAC ដោយប្រើ SHA-1, SHA-256, SHA-384 ឬ SHA-512 តាម Web Crypto API។"
    >
      <div className="space-y-4">
        <Field label={t("Algorithm", "ក្បួន")}>
          <Select value={algo} onChange={(e) => setAlgo(e.target.value as Algo)}>
            {ALGOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Message", "សារ")}>
          <TextInput value={message} onChange={(e) => setMessage(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Secret key", "សោសម្ងាត់")}>
          <TextInput value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono-ui" />
        </Field>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <Output label="HMAC (hex)" value={hex} />
        <Output label="HMAC (base64)" value={base64} />

        <p className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)]">
          <KeyRound size={13} />
          {t("Computed locally with the Web Crypto API — nothing leaves your browser.", "គណនាក្នុងឧបករណ៍ដោយ Web Crypto API — គ្មានអ្វីចេញពីកម្មវិធីរុករកទេ។")}
        </p>
      </div>
    </ToolShell>
  );
}
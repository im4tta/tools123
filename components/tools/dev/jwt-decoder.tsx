"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function b64urlDecode(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(normalized)));
}

export default function JwtDecoder() {
  const [token, setToken] = useToolState("jwt-decoder:token", "");

  const { header, payload, error } = useMemo(() => {
    if (!token.trim()) return { header: "", payload: "", error: false };
    const parts = token.trim().split(".");
    if (parts.length < 2) return { header: "", payload: "Not a JWT — expected header.payload.signature", error: true };
    try {
      const header = JSON.stringify(JSON.parse(b64urlDecode(parts[0])), null, 2);
      const payload = JSON.stringify(JSON.parse(b64urlDecode(parts[1])), null, 2);
      return { header, payload, error: false };
    } catch {
      return { header: "", payload: "Could not decode — check the token is well-formed.", error: true };
    }
  }, [token]);

  return (
    <ToolShell title="JWT Decoder" description="Decode a JSON Web Token's header and payload locally. Signature is not verified.">
      <Field label="Token">
        <TextArea rows={4} value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJhbGciOi..." />
      </Field>
      <Output label="Header" value={header} error={error && !header} />
      <Output label="Payload" value={payload} error={error} />
    </ToolShell>
  );
}

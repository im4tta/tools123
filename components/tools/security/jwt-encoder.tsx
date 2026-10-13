"use client";
import { useEffect } from "react";
import { ToolShell, TextArea, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState, useSensitiveToolState } from "@/lib/storage";

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  arr.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(header: string, payload: string, secret: string) {
  const data = `${b64url(new TextEncoder().encode(header))}.${b64url(new TextEncoder().encode(payload))}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

export default function JwtEncoder() {
  const [payload, setPayload] = useToolState("jwt-encoder:payload", '{\n  "sub": "1234567890",\n  "name": "Sophea"\n}');
  const [secret, setSecret] = useSensitiveToolState("jwt-encoder:secret", "your-256-bit-secret");
  const [token, setToken] = useSensitiveToolState("jwt-encoder:token", "");
  const [error, setError] = useToolState("jwt-encoder:error", "");

  useEffect(() => {
    try {
      JSON.parse(payload);
      setError("");
      sign('{"alg":"HS256","typ":"JWT"}', payload.replace(/\s+/g, "").length ? JSON.stringify(JSON.parse(payload)) : "{}", secret).then(setToken);
    } catch {
      setError("Payload must be valid JSON");
      setToken("");
    }
  }, [payload, secret, setError, setToken]);

  return (
    <ToolShell title="JWT Encoder (HS256)" description="Builds and signs a JWT client-side with the Web Crypto API. For testing only — never share real secrets.">
      <Field label="Payload (JSON)"><TextArea rows={5} value={payload} onChange={(e) => setPayload(e.target.value)} className="font-mono-ui" /></Field>
      <Field label="Secret" hint="Not saved" hintKm="មិនរក្សាទុក"><TextInput value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Signed JWT" value={error || token} error={!!error} />
    </ToolShell>
  );
}

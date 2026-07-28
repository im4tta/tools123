"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function PasswordStrength() {
  const [pw, setPw] = useToolState("password-strength:pw", "");

  const { score, label, entropy } = useMemo(() => {
    let poolSize = 0;
    if (/[a-z]/.test(pw)) poolSize += 26;
    if (/[A-Z]/.test(pw)) poolSize += 26;
    if (/[0-9]/.test(pw)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) poolSize += 32;
    const entropy = pw.length > 0 ? pw.length * Math.log2(poolSize || 1) : 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const label = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"][score];
    return { score, label, entropy };
  }, [pw]);

  const colors = ["var(--danger)", "var(--danger)", "var(--gold)", "var(--gold)", "var(--success)", "var(--success)"];

  return (
    <ToolShell title="Password Strength Estimator" description="Estimates strength from length, character variety, and entropy. Nothing is sent anywhere.">
      <Field label="Password"><TextInput type="text" value={pw} onChange={(e) => setPw(e.target.value)} className="font-mono-ui" /></Field>
      <div className="h-2 overflow-hidden rounded bg-[var(--ground-raised)]">
        <div className="h-full rounded transition-all" style={{ width: `${(score / 5) * 100}%`, background: colors[score] }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ink)]">{pw ? label : "—"}</span>
        <span className="font-mono-ui text-[var(--ink-faint)]">{pw ? `${entropy.toFixed(1)} bits entropy` : ""}</span>
      </div>
    </ToolShell>
  );
}

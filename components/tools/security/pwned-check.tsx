"use client";
import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text) as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** k-anonymity range query — only the first 5 hex chars of the SHA-1 leave the device. */
async function queryHibp(password: string): Promise<{ count: number; candidates: number }> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    let count = 0;
    let candidates = 0;
    for (const line of body.split("\n")) {
      if (!line) continue;
      candidates++;
      const [suf, cnt] = line.split(":");
      if (suf.trim().toUpperCase() === suffix) count = Number(cnt);
    }
    return { count, candidates };
  } finally {
    clearTimeout(timer);
  }
}

export default function PwnedCheck() {
  const { text: t } = useLanguage();
  const [password, setPassword] = useToolState("pwned:password", "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [count, setCount] = useState(0);
  const [candidates, setCandidates] = useState(0);

  async function check() {
    if (!password.trim() || status === "loading") return;
    setStatus("loading");
    try {
      const r = await queryHibp(password);
      setCount(r.count);
      setCandidates(r.candidates);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <ToolShell
      title="Password Breach Check"
      khmerTitle="ពិនិត្យពាក្យសម្ងាត់លេចធ្លាយ"
      description="Check a password against known data breaches using the Have I Been Pwned k-anonymity API — only the first 5 characters of the SHA-1 hash are ever sent."
      descriptionKm="ពិនិត្យពាក្យសម្ងាត់ទល់នឹងទិន្នន័យលេចធ្លាយដែលគេស្គាល់ តាម API k-anonymity របស់ Have I Been Pwned — បញ្ជូនតែ ៥ តួអក្សរដំបូងនៃ SHA-1 ប៉ុណ្ណោះ។"
    >
      <div className="space-y-4">
        <Field label={t("Password to check", "ពាក្យសម្ងាត់ដែលត្រូវពិនិត្យ")}>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus("idle");
            }}
            placeholder={t("Enter a password…", "បញ្ចូលពាក្យសម្ងាត់…")}
            className="font-mono-ui"
          />
        </Field>

        <Button type="button" onClick={() => void check()} disabled={!password.trim() || status === "loading"}>
          {status === "loading" ? t("Checking…", "កំពុងពិនិត្យ…") : t("Check breach status", "ពិនិត្យស្ថានភាពលេចធ្លាយ")}
        </Button>

        {status === "loading" && (
          <p className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
            <Loader2 size={16} className="animate-spin" />
            {t("Querying the Have I Been Pwned range endpoint…", "កំពុងស្នើសុំទៅកាន់ range endpoint របស់ Have I Been Pwned…")}
          </p>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            <p className="font-medium">
              {t("Could not reach the Have I Been Pwned API.", "មិនអាចទាក់ទង API របស់ Have I Been Pwned បានទេ។")}
            </p>
            <p className="mt-1 text-xs">{t("Check your internet connection and try again. The check runs directly from your browser.", "សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។ ការពិនិត្យដំណើរការផ្ទាល់ពីកម្មវិធីរុករករបស់អ្នក។")}</p>
          </div>
        )}

        {status === "done" &&
          (count > 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
              <ShieldAlert size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {t("This password has appeared", "ពាក្យសម្ងាត់នេះបានលេចឡើង")} {count.toLocaleString("en-US")} {t("times in known data breaches.", "ដងក្នុងទិន្នន័យលេចធ្លាយដែលគេស្គាល់។")}
                </p>
                <p className="mt-1 text-xs">{t("Change it immediately and do not reuse it anywhere else.", "សូមប្តូរវាភ្លាមៗ ហើយកុំប្រើវាឡើងវិញនៅកន្លែងផ្សេងទៀត។")}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-sm text-[var(--gold)]">
              <ShieldCheck size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t("No known breaches for this password.", "មិនមានការលេចធ្លាយដែលគេស្គាល់សម្រាប់ពាក្យសម្ងាត់នេះទេ។")}</p>
                <p className="mt-1 text-xs">
                  {t("Not found means the hash is absent from the current Have I Been Pwned dataset — it is not a guarantee the password is safe.", "មិនឃើញមាន មានន័យថា hash អវត្តមានពីសំណុំទិន្នន័យបច្ចុប្បន្នរបស់ Have I Been Pwned — វាមិនមែនជាការធានាថាពាក្យសម្ងាត់មានសុវត្ថិភាពទេ។")}
                </p>
              </div>
            </div>
          ))}

        {status === "done" && candidates > 0 && (
          <p className="text-xs text-[var(--ink-dim)]">
            {t("Compared locally against", "បានប្រៀបធៀបក្នុងឧបករណ៍ទល់នឹង")} {candidates.toLocaleString("en-US")} {t("candidate hashes returned by the range endpoint.", "hash បេក្ខជនដែលត្រឡប់ពី range endpoint។")}
          </p>
        )}

        <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          <p>
            {t("How it works (k-anonymity): your password is hashed with SHA-1 locally; only the first 5 hex characters of the hash are sent to api.pwnedpasswords.com. The response contains every suffix matching that prefix, and the comparison happens on your device — the full password and hash never leave your browser.", "របៀបដំណើរការ (k-anonymity)៖ ពាក្យសម្ងាត់ត្រូវបាន hash ដោយ SHA-1 ក្នុងឧបករណ៍; បញ្ជូនតែ ៥ តួអក្សរ hex ដំបូងនៃ hash ទៅ api.pwnedpasswords.com។ ការឆ្លើយតបផ្ទុករាល់ suffix ដែលត្រូវនឹងបុព្វបទនោះ ហើយការប្រៀបធៀបធ្វើនៅលើឧបករណ៍របស់អ្នក — ពាក្យសម្ងាត់ និង hash ពេញលេញ មិនដែលចេញពីកម្មវិធីរុករកទេ។")}
          </p>
          <p className="mt-2">
            {t("Rate limiting: one check at a time; the API is free but shared, so please check responsibly.", "ការកំណត់អត្រា៖ ពិនិត្យម្តងមួយៗ; API ឥតគិតថ្លៃ ប៉ុន្តែប្រើរួមគ្នា ដូច្នេះសូមពិនិត្យដោយការទទួលខុសត្រូវ។")}
          </p>
        </div>
      </div>

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Data and range API by Have I Been Pwned (Troy Hunt). This tool integrates the public Pwned Passwords k-anonymity endpoint — it does not copy its implementation.", "ទិន្នន័យ និង range API ដោយ Have I Been Pwned (Troy Hunt)។ ឧបករណ៍នេះរួមបញ្ចូល Pwned Passwords k-anonymity endpoint សាធារណៈ — មិនចម្លងការអនុវត្តរបស់វាទេ។")}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <span className="font-semibold text-[var(--ink)]">Have I Been Pwned</span> — Troy Hunt · CC BY-NC-4.0 ·{" "}
            <a href="https://api.pwnedpasswords.com/range/" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">api.pwnedpasswords.com</a> ·{" "}
            <a href="https://haveibeenpwned.com/API/v3" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">haveibeenpwned.com/API</a>
          </li>
        </ul>
      </div>
    </ToolShell>
  );
}

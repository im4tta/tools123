"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Uint8Array {
  const clean = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/0/g, "O")
    .replace(/1/g, "L")
    .replace(/=+$/, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  if (out.length === 0) throw new Error("empty secret");
  return new Uint8Array(out);
}

/** RFC 4226 HOTP dynamic truncation → 6-digit code. */
async function hotp(secret: Uint8Array, counter: number, digits = 6): Promise<string> {
  const key = await crypto.subtle.importKey("raw", secret as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg as BufferSource));
  const offset = mac[mac.length - 1] & 0x0f;
  const binary =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);
  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

const totpCounter = () => Math.floor(Date.now() / 1000 / 30);
const secondsLeft = () => 30 - (Math.floor(Date.now() / 1000) % 30);

export default function TotpAuthenticator() {
  const { text: t } = useLanguage();
  const [secret, setSecret] = useToolState("totp:secret", "");
  const [mode, setMode] = useToolState<"totp" | "hotp">("totp:mode", "totp");
  const [counter, setCounter] = useToolState("totp:counter", 0);
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [entered, setEntered] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const secretBytes = useMemo(() => {
    if (!secret.trim()) return null;
    try {
      return base32Decode(secret);
    } catch {
      return null;
    }
  }, [secret]);
  const decodeError = secret.trim() !== "" && secretBytes === null;

  useEffect(() => {
    if (!secretBytes) return;
    let alive = true;
    const tick = async () => {
      const c = mode === "totp" ? totpCounter() : counter;
      try {
        const value = await hotp(secretBytes, c);
        if (!alive) return;
        setCode(value);
        setRemaining(mode === "totp" ? secondsLeft() : -1);
      } catch {
        if (alive) setCode("");
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [secretBytes, mode, counter]);

  async function verify() {
    if (!secretBytes || !entered.trim()) return;
    setVerifyError("");
    try {
      const targets = mode === "totp" ? [totpCounter() - 1, totpCounter(), totpCounter() + 1] : [counter];
      let ok = false;
      for (const c of targets) {
        if ((await hotp(secretBytes, c)) === entered.trim()) {
          ok = true;
          break;
        }
      }
      setVerifyResult(ok);
    } catch {
      setVerifyError(t("Could not compute the code.", "មិនអាចគណនាកូដបានទេ។"));
    }
  }

  return (
    <ToolShell
      title="TOTP / 2FA Authenticator"
      khmerTitle="កម្មវិធីផ្ទៀងផ្ទាត់ TOTP"
      description="Generate rolling 6-digit TOTP codes (RFC 6238) or counter-based HOTP codes (RFC 4226) from a Base32 secret, entirely in your browser."
      descriptionKm="បង្កើតកូដ ៦ ខ្ទង់ TOTP (RFC 6238) ឬ HOTP តាមលេខរាប់ (RFC 4226) ពីសោ Base32 ក្នុងកម្មវិធីរុករករបស់អ្នកទាំងស្រុង។"
    >
      <div className="space-y-4">
        <Row>
          <Field label={t("Secret key (Base32)", "សោសម្ងាត់ (Base32)")}>
            <TextInput
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="JBSWY3DPEHPK3PXP"
              className="font-mono-ui"
            />
          </Field>
          <Field label={t("Mode", "របៀប")}>
            <Select value={mode} onChange={(e) => setMode(e.target.value as "totp" | "hotp")}>
              <option value="totp">TOTP {t("(time-based)", "(តាមពេល)")}</option>
              <option value="hotp">HOTP {t("(counter-based)", "(តាមលេខរាប់)")}</option>
            </Select>
          </Field>
        </Row>

        {decodeError && (
          <p className="text-sm text-[var(--danger)]">
            {t("That does not look like a valid Base32 secret (letters A–Z and digits 2–7).", "នោះមិនមែនជាសោ Base32 ត្រឹមត្រូវទេ (អក្សរ A–Z និងលេខ 2–7)។")}
          </p>
        )}

        {secretBytes && code && (
          <>
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {mode === "totp" ? t("Current code", "កូដបច្ចុប្បន្ន") : t("Code for counter", "កូដសម្រាប់លេខរាប់")}
              </div>
              <div className="mt-2 font-mono-ui text-4xl font-semibold tracking-[0.2em] text-[var(--ink)]">{code}</div>

              {mode === "totp" ? (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[var(--ink-dim)]">
                    <span>{t("Code refreshes in", "កូដថ្មីក្នុងរយៈពេល")}</span>
                    <span className="font-mono-ui">{remaining}s</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${remaining <= 5 ? "bg-[var(--danger)]" : "bg-[var(--gold)]"}`}
                      style={{ width: `${(remaining / 30) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button type="button" onClick={() => setCounter((c) => c - 1)} disabled={counter <= 0}>
                    −1
                  </Button>
                  <span className="font-mono-ui text-sm text-[var(--ink-dim)]">
                    {t("Counter", "លេខរាប់")}: <span className="text-[var(--ink)]">{counter}</span>
                  </span>
                  <Button type="button" onClick={() => setCounter((c) => c + 1)}>
                    +1
                  </Button>
                </div>
              )}
            </div>

            <Row>
              <Field label={t("Enter code to verify", "បញ្ចូលកូដដើម្បីផ្ទៀងផ្ទាត់")}>
                <TextInput
                  value={entered}
                  onChange={(e) => {
                    setEntered(e.target.value);
                    setVerifyResult(null);
                  }}
                  placeholder="123456"
                  inputMode="numeric"
                  className="font-mono-ui"
                />
              </Field>
              <Field label={t("Verify", "ផ្ទៀងផ្ទាត់")}>
                <Button type="button" onClick={() => void verify()} disabled={!entered.trim() || !secretBytes}>
                  {t("Verify code", "ផ្ទៀងផ្ទាត់កូដ")}
                </Button>
              </Field>
            </Row>

            {verifyError && <p className="text-sm text-[var(--danger)]">{verifyError}</p>}
            {verifyResult !== null && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                  verifyResult
                    ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
                    : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
                }`}
              >
                {verifyResult ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {verifyResult
                  ? t("Code is valid.", "កូដត្រឹមត្រូវ។")
                  : t("Code is invalid or expired.", "កូដមិនត្រឹមត្រូវ ឬផុតកំណត់។")}
              </div>
            )}
          </>
        )}

        {!secretBytes && !decodeError && (
          <p className="text-sm text-[var(--ink-dim)]">
            {t("Enter your Base32 secret (as shown by the service you enabled 2FA on) to generate codes.", "បញ្ចូលសោ Base32 របស់អ្នក (ដូចដែលសេវាដែលអ្នកបើក 2FA បង្ហាញ) ដើម្បីបង្កើតកូដ។")}
          </p>
        )}

        <p className="text-xs text-[var(--ink-dim)]">
          {t("Everything runs locally via the Web Crypto API — the secret never leaves your device.", "អ្វីៗដំណើរការក្នុងឧបករណ៍តាម Web Crypto API — សោសម្ងាត់មិនដែលចេញពីឧបករណ៍របស់អ្នកទេ។")}
        </p>
      </div>

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Independent implementation of the public one-time-password standards listed below.", "ការអនុវត្តឯករាជ្យនៃស្តង់ដារពាក្យសម្ងាត់មួយលើក ដែលបានរាយខាងក្រោម។")}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 6238
            </a>{" "}
            — {t("TOTP: Time-Based One-Time Password Algorithm", "TOTP: ក្បួនពាក្យសម្ងាត់មួយលើកតាមពេល")}
          </li>
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc4226" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 4226
            </a>{" "}
            — {t("HOTP: HMAC-Based One-Time Password Algorithm", "HOTP: ក្បួនពាក្យសម្ងាត់មួយលើកតាម HMAC")}
          </li>
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc4648" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 4648
            </a>{" "}
            — {t("Base32 encoding of the secret key", "ការអ៊ិនកូដ Base32 នៃសោសម្ងាត់")}
          </li>
        </ul>
      </div>
    </ToolShell>
  );
}

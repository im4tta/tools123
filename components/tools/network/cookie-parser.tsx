"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// RFC 6265 §4.1.1: cookie-name and cookie-value must be "token": any CHAR
// except CTLs or separators  ( ) < > @ , ; : \ " / [ ] ? = { }  space and tab.
const TOKEN_RE = /^[^\x00-\x20\x7F()<>@,;:\\"\/\[\]?={}]+$/;

interface CookiePair {
  line: number;
  name: string;
  value: string;
  quoted: boolean;
  errors: string[];
}

interface SetCookieAttr {
  expires: string;
  maxAge: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
}

interface SetCookieRow {
  line: number;
  name: string;
  value: string;
  attr: SetCookieAttr;
  errors: string[];
}

const ISSUE_LABELS: Record<string, [string, string]> = {
  noEquals: ["Missing '='", "ខ្វះសញ្ញា '='"],
  badName: ["Invalid cookie name", "ឈ្មោះ cookie មិនត្រឹមត្រូវ"],
  badValue: ["Invalid cookie value", "តម្លៃ cookie មិនត្រឹមត្រូវ"],
  badMaxAge: ["Max-Age must be a non-negative integer", "Max-Age ត្រូវតែជាចំនួនគត់មិនអវិជ្ជមាន"],
  badSameSite: ["SameSite must be Strict, Lax or None", "SameSite ត្រូវតែជា Strict, Lax ឬ None"],
};

function splitPair(part: string): { name: string; value: string; quoted: boolean } | null {
  const eq = part.indexOf("=");
  if (eq === -1) return null;
  const name = part.slice(0, eq).trim();
  let value = part.slice(eq + 1).trim();
  let quoted = false;
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    quoted = true;
    value = value.slice(1, -1);
  }
  return { name, value, quoted };
}

function parseCookieHeader(text: string): CookiePair[] {
  return text.split(";").map((part, i) => {
    const pair = splitPair(part);
    if (!pair) return { line: i + 1, name: "", value: "", quoted: false, errors: ["noEquals"] };
    const errors: string[] = [];
    if (!TOKEN_RE.test(pair.name)) errors.push("badName");
    if (!pair.quoted && !TOKEN_RE.test(pair.value)) errors.push("badValue");
    return { line: i + 1, name: pair.name, value: pair.value, quoted: pair.quoted, errors };
  });
}

function parseSetCookieHeaders(text: string): SetCookieRow[] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((raw, i) => {
      const errors: string[] = [];
      const attr: SetCookieAttr = { expires: "", maxAge: "", domain: "", path: "", secure: false, httpOnly: false, sameSite: "" };
      const parts = raw.split(";");
      const pair = splitPair(parts[0]);
      if (!pair) return { line: i + 1, name: "", value: "", attr, errors: ["noEquals"] };
      if (!TOKEN_RE.test(pair.name)) errors.push("badName");
      if (!pair.quoted && !TOKEN_RE.test(pair.value)) errors.push("badValue");
      for (let k = 1; k < parts.length; k++) {
        const seg = parts[k].trim();
        if (!seg) continue;
        const eq = seg.indexOf("=");
        const aname = (eq === -1 ? seg : seg.slice(0, eq)).toLowerCase();
        const aval = eq === -1 ? "" : seg.slice(eq + 1).trim();
        if (aname === "expires") attr.expires = aval;
        else if (aname === "max-age") {
          attr.maxAge = aval;
          if (!/^\d+$/.test(aval)) errors.push("badMaxAge");
        } else if (aname === "domain") attr.domain = aval;
        else if (aname === "path") attr.path = aval;
        else if (aname === "secure") attr.secure = true;
        else if (aname === "httponly") attr.httpOnly = true;
        else if (aname === "samesite") {
          attr.sameSite = aval;
          if (aval && !/^(strict|lax|none)$/i.test(aval)) errors.push("badSameSite");
        }
        // Unknown attributes are ignored per RFC 6265 §4.1.2.
      }
      return { line: i + 1, name: pair.name, value: pair.value, attr, errors };
    });
}

function buildHeader(text: string): { header: string; issues: { line: number; code: string }[] } {
  const issues: { line: number; code: string }[] = [];
  const pairs: string[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const eq = line.indexOf("=");
    if (eq === -1) {
      issues.push({ line: i + 1, code: "noEquals" });
      return;
    }
    const name = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!TOKEN_RE.test(name)) issues.push({ line: i + 1, code: "badName" });
    let out = name;
    if (TOKEN_RE.test(value)) out += `=${value}`;
    else if (!/[";]/.test(value)) out += `="${value}"`;
    else {
      issues.push({ line: i + 1, code: "badValue" });
      out += `=${value}`;
    }
    pairs.push(out);
  });
  return { header: pairs.join("; "), issues };
}

export default function CookieParser() {
  const { text: t } = useLanguage();
  const [cookieHeader, setCookieHeader] = useToolState("cookie:header", "session_id=abc123; theme=dark; lang=km");
  const [setCookieHeaders, setSetCookieHeaders] = useToolState(
    "cookie:set",
    "session_id=abc123; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Max-Age=3600; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Lax\ntheme=dark; Path=/"
  );
  const [pairs, setPairs] = useToolState("cookie:pairs", "session_id=abc123\ntheme=dark");

  const cookieRows = useMemo(() => parseCookieHeader(cookieHeader), [cookieHeader]);
  const setCookieRows = useMemo(() => parseSetCookieHeaders(setCookieHeaders), [setCookieHeaders]);
  const built = useMemo(() => buildHeader(pairs), [pairs]);

  const errText = (errors: string[]) =>
    errors.length ? errors.map((c) => t(...ISSUE_LABELS[c])).join("; ") : t("OK", "ល្អ");

  return (
    <ToolShell
      title="HTTP Cookie Parser"
      khmerTitle="វិភាគ Cookie HTTP"
      description="Parse Cookie request headers and Set-Cookie response headers, validate them per RFC 6265, and build Cookie headers."
      descriptionKm="ញែក Cookie header ក្នុងសំណើ និង Set-Cookie header ក្នុងចម្លើយ ផ្ទៀងផ្ទាត់តាម RFC 6265 និងបង្កើត Cookie header។"
    >
      <h2 className="text-sm font-semibold text-[var(--ink)]">{t("Parse Cookie request header", "ញែក Cookie ក្នុងសំណើ")}</h2>
      <Field label="Cookie header" labelKm="Cookie header">
        <TextArea rows={3} value={cookieHeader} onChange={(e) => setCookieHeader(e.target.value)} placeholder={t("name=value; name2=value2", "name=value; name2=value2")} />
      </Field>
      {cookieRows.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--ground-line)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{t("Name", "ឈ្មោះ")}</th>
                <th className="px-3 py-2">{t("Value", "តម្លៃ")}</th>
                <th className="px-3 py-2">{t("Quoted", "មានសម្រង់")}</th>
                <th className="px-3 py-2">{t("Issues", "បញ្ហា")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ground-line)]">
              {cookieRows.map((r) => (
                <tr key={r.line} className={r.errors.length ? "text-[var(--danger)]" : "text-[var(--ink)]"}>
                  <td className="px-3 py-2 font-mono-ui text-xs">{r.line}</td>
                  <td className="px-3 py-2 font-mono-ui">{r.name || "—"}</td>
                  <td className="max-w-[16rem] truncate px-3 py-2 font-mono-ui">{r.value || "—"}</td>
                  <td className="px-3 py-2">{r.quoted ? t("Yes", "បាទ/ចាស") : t("No", "ទេ")}</td>
                  <td className="px-3 py-2 text-xs">{errText(r.errors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-sm font-semibold text-[var(--ink)]">{t("Parse Set-Cookie response headers", "ញែក Set-Cookie ក្នុងចម្លើយ")}</h2>
      <Field label="Set-Cookie headers (one per line)" labelKm="Set-Cookie headers (មួយក្នុងមួយបន្ទាត់)">
        <TextArea rows={4} value={setCookieHeaders} onChange={(e) => setSetCookieHeaders(e.target.value)} placeholder={t("name=value; Path=/; HttpOnly", "name=value; Path=/; HttpOnly")} />
      </Field>
      {setCookieRows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--ground-line)] uppercase tracking-wide text-[var(--ink-dim)]">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{t("Name", "ឈ្មោះ")}</th>
                <th className="px-3 py-2">{t("Value", "តម្លៃ")}</th>
                <th className="px-3 py-2">{t("Expires", "ផុតកំណត់")}</th>
                <th className="px-3 py-2">{t("Max-Age", "Max-Age")}</th>
                <th className="px-3 py-2">{t("Domain", "ដែន")}</th>
                <th className="px-3 py-2">{t("Path", "ផ្លូវ")}</th>
                <th className="px-3 py-2">{t("Secure", "Secure")}</th>
                <th className="px-3 py-2">{t("HttpOnly", "HttpOnly")}</th>
                <th className="px-3 py-2">{t("SameSite", "SameSite")}</th>
                <th className="px-3 py-2">{t("Issues", "បញ្ហា")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ground-line)]">
              {setCookieRows.map((r) => (
                <tr key={r.line} className={r.errors.length ? "text-[var(--danger)]" : "text-[var(--ink)]"}>
                  <td className="px-3 py-2 font-mono-ui">{r.line}</td>
                  <td className="px-3 py-2 font-mono-ui">{r.name || "—"}</td>
                  <td className="max-w-[12rem] truncate px-3 py-2 font-mono-ui">{r.value || "—"}</td>
                  <td className="px-3 py-2">{r.attr.expires || "—"}</td>
                  <td className="px-3 py-2 font-mono-ui">{r.attr.maxAge || "—"}</td>
                  <td className="px-3 py-2 font-mono-ui">{r.attr.domain || "—"}</td>
                  <td className="px-3 py-2 font-mono-ui">{r.attr.path || "—"}</td>
                  <td className="px-3 py-2">{r.attr.secure ? t("Yes", "បាទ/ចាស") : t("No", "ទេ")}</td>
                  <td className="px-3 py-2">{r.attr.httpOnly ? t("Yes", "បាទ/ចាស") : t("No", "ទេ")}</td>
                  <td className="px-3 py-2">{r.attr.sameSite || "—"}</td>
                  <td className="px-3 py-2">{errText(r.errors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-dim)]">{t("No cookies found.", "រកមិនឃើញ cookie ទេ។")}</p>
      )}

      <h2 className="text-sm font-semibold text-[var(--ink)]">{t("Build a Cookie header", "បង្កើត Cookie header")}</h2>
      <Field label="Name=value pairs (one per line)" labelKm="គូ name=value (មួយក្នុងមួយបន្ទាត់)">
        <TextArea rows={3} value={pairs} onChange={(e) => setPairs(e.target.value)} placeholder={t("name=value", "name=value")} />
      </Field>
      {built.issues.length > 0 && (
        <p className="text-sm text-[var(--danger)]">
          {built.issues.map((i) => `${t("Line", "បន្ទាត់")} ${i.line}: ${t(...ISSUE_LABELS[i.code])}`).join(" · ")}
        </p>
      )}
      <Output label={t("Built header", "header ដែលបានបង្កើត")} value={built.header} error={built.issues.length > 0} />

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        {t("Parsing and validation follow the HTTP State Management Mechanism —", "ការញែក និងផ្ទៀងផ្ទាត់ អនុវត្តតាមយន្តការគ្រប់គ្រងស្ថានភាព HTTP —")}{" "}
        <a className="underline" href="https://www.rfc-editor.org/rfc/rfc6265.html" target="_blank" rel="noreferrer">RFC 6265</a>
        {t(" — original Tools123 implementation.", " — ការសរសេរដើមរបស់ Tools123។")}
      </div>
    </ToolShell>
  );
}

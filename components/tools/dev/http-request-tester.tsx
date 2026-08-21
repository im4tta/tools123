"use client";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { ToolShell, TextInput, TextArea, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;
type Method = (typeof METHODS)[number];

interface Result {
  status: number;
  statusText: string;
  ms: number;
  body: string;
  ok: boolean;
}

export default function HttpRequestTester() {
  const { text: t } = useLanguage();
  const [method, setMethod] = useToolState<Method>("http-tester:method", "GET");
  const [url, setUrl] = useToolState("http-tester:url", "https://api.github.com/zen");
  const [headers, setHeaders] = useToolState("http-tester:headers", "Accept: application/json");
  const [body, setBody] = useToolState("http-tester:body", "");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function parseHeaders(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of headers.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return out;
  }

  async function send() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    const started = performance.now();
    try {
      const hasBody = !["GET", "HEAD"].includes(method) && body.trim() !== "";
      const res = await fetch(url.trim(), {
        method,
        headers: parseHeaders(),
        body: hasBody ? body : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* not JSON */
      }
      setResult({
        status: res.status,
        statusText: res.statusText,
        ms: Math.round(performance.now() - started),
        body: pretty.slice(0, 20000),
        ok: res.ok,
      });
    } catch {
      setError(t("Request failed. This is often browser CORS blocking the response — the server may still have received it.", "សំណើបរាជ័យ។ ញឹកញាប់នេះដោយសារ CORS របស់កម្មវិធីរុករកទប់ស្កាត់ចម្លើយ — ម៉ាស៊ីនមេអាចទទួលបានរួចហើយ។"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      title="HTTP Request Tester"
      khmerTitle="ឧបករណ៍សាកល្បងសំណើ HTTP"
      description="Send an HTTP request and inspect the status, timing, and response body — right from your browser."
      descriptionKm="ផ្ញើសំណើ HTTP ហើយពិនិត្យស្ថានភាព ពេលវេលា និងខ្លឹមសារចម្លើយ — ផ្ទាល់ពីកម្មវិធីរុករក។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <Field label={t("Method", "វិធីសាស្ត្រ")}>
            <Select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="URL">
            <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/v1/items" className="font-mono-ui" />
          </Field>
        </div>

        <Field label={t("Headers (one per line)", "ក្បាល (មួយក្នុងមួយបន្ទាត់)")} hint="Key: Value">
          <TextArea rows={3} value={headers} onChange={(e) => setHeaders(e.target.value)} className="font-mono-ui" />
        </Field>

        {!["GET", "HEAD"].includes(method) && (
          <Field label={t("Body", "ខ្លឹមសារ")}>
            <TextArea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}' className="font-mono-ui" />
          </Field>
        )}

        <button type="button" onClick={send} disabled={loading || !url.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {t("Send request", "ផ្ញើសំណើ")}
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm">
              <span className={`rounded-md px-2 py-1 font-mono-ui font-bold ${result.ok ? "bg-[var(--teal)]/15 text-[var(--teal)]" : "bg-[var(--danger)]/15 text-[var(--danger)]"}`}>
                {result.status} {result.statusText}
              </span>
              <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{result.ms} ms</span>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-mono-ui text-xs text-[var(--ink)]">{result.body || "—"}</pre>
          </div>
        )}

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Requests run from your browser, so servers must allow CORS or the response will be blocked. Only call APIs you are authorized to use.", "សំណើដំណើរការពីកម្មវិធីរុករក ដូច្នេះម៉ាស៊ីនមេត្រូវអនុញ្ញាត CORS បើមិនដូច្នេះចម្លើយនឹងត្រូវបានទប់ស្កាត់។ សូមហៅតែ API ដែលអ្នកមានសិទ្ធិប្រើ។")}
        </p>
      </div>
    </ToolShell>
  );
}
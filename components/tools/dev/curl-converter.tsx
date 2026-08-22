"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Target = "fetch" | "axios" | "python" | "go";

interface Parsed {
  method: string;
  url: string;
  headers: [string, string][];
  body: string | null;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === " " || ch === "\n") {
      if (cur) tokens.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function parseCurl(raw: string): Parsed | null {
  const cleaned = raw.replace(/^\s*\$\s*/, "").trim();
  if (!cleaned.toLowerCase().startsWith("curl")) return null;
  const tokens = tokenize(cleaned);
  let method = "";
  const headers: [string, string][] = [];
  const dataParts: string[] = [];
  let url = "";

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    const next = tokens[i + 1];
    if (tok === "-X" || tok === "--request") {
      method = (next ?? "").toUpperCase();
      i++;
    } else if (tok === "-H" || tok === "--header") {
      const idx = (next ?? "").indexOf(":");
      if (idx > 0) headers.push([next.slice(0, idx).trim(), next.slice(idx + 1).trim()]);
      i++;
    } else if (tok === "-d" || tok === "--data" || tok === "--data-raw" || tok === "--data-binary" || tok === "--data-ascii") {
      dataParts.push(next ?? "");
      i++;
    } else if (tok === "-u" || tok === "--user") {
      if (next) headers.push(["Authorization", `Basic ${btoa(next)}`]);
      i++;
    } else if (tok === "-F" || tok === "--form") {
      i++;
    } else if (!tok.startsWith("-") && !url) {
      url = tok.replace(/^["']|["']$/g, "");
    }
  }
  if (!url) return null;
  if (dataParts.length && !method) method = "POST";
  return { method: method || "GET", url, headers, body: dataParts.length ? dataParts.join("&") : null };
}

function generate(p: Parsed, target: Target): string {
  const headerLines = p.headers.map(([k, v]) => `    "${k}": ${JSON.stringify(v)},`).join("\n");
  const pyHeaders = p.headers.map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}",`).join(",\n");

  if (target === "fetch") {
    return `const res = await fetch(${JSON.stringify(p.url)}, {
  method: "${p.method}",
${p.headers.length ? `  headers: {\n${headerLines}\n  },\n` : ""}${p.body ? `  body: JSON.stringify(${p.body}),\n` : ""}});
const data = await res.text();
console.log(data);`;
  }
  if (target === "axios") {
    return `const res = await axios({
  method: "${p.method.toLowerCase()}",
  url: ${JSON.stringify(p.url)},
${p.headers.length ? `  headers: {\n${headerLines}\n  },\n` : ""}${p.body ? `  data: ${p.body},\n` : ""}});
console.log(res.data);`;
  }
  if (target === "python") {
    return `import requests

res = requests.${p.method.toLowerCase()}(
    "${p.url.replace(/"/g, '\\"')}",${p.headers.length ? `\n    headers={\n${pyHeaders}\n    },` : ""}${p.body ? `\n    data="${p.body.replace(/"/g, '\\"')}",` : ""}
)
print(res.text)`;
  }
  const goHeaders = p.headers.map(([k, v]) => `\treq.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`).join("\n");
  return `req, _ := http.NewRequest("${p.method}", ${JSON.stringify(p.url)}, ${p.body ? `strings.NewReader(${JSON.stringify(p.body)})` : "nil"})
${goHeaders}
res, err := http.DefaultClient.Do(req)
if err != nil {
    panic(err)
}
defer res.Body.Close()
body, _ := io.ReadAll(res.Body)
fmt.Println(string(body))`;
}

export default function CurlConverter() {
  const { text: t } = useLanguage();
  const [raw, setRaw] = useToolState("curl-converter:input", `curl -X POST https://api.example.com/v1/items \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer TOKEN" \\\n  -d '{"name": "Widget"}'`);
  const [target, setTarget] = useState<Target>("fetch");

  const parsed = useMemo(() => parseCurl(raw), [raw]);
  const code = parsed ? generate(parsed, target) : "";

  return (
    <ToolShell
      title="cURL → Code Converter"
      khmerTitle="បម្លែង cURL ទៅជាកូដ"
      description="Paste a curl command and get the equivalent fetch, axios, Python requests, or Go code."
      descriptionKm="បិទភ្ជាប់ពាក្យបញ្ជា curl ហើយទទួលបានកូដ fetch, axios, Python requests ឬ Go សមមូល។"
    >
      <div className="space-y-4">
        <Field label={t("cURL command", "ពាក្យបញ្ជា cURL")}>
          <TextArea rows={6} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono-ui" />
        </Field>

        <Field label={t("Target", "គោលដៅ")}>
          <Select value={target} onChange={(e) => setTarget(e.target.value as Target)}>
            <option value="fetch">JavaScript — fetch</option>
            <option value="axios">JavaScript — axios</option>
            <option value="python">Python — requests</option>
            <option value="go">Go — net/http</option>
          </Select>
        </Field>

        {!parsed && raw.trim() && (
          <p className="text-sm text-[var(--danger)]">{t("This does not look like a curl command.", "នេះមិនមែនជាពាក្យបញ្ជា curl ទេ។")}</p>
        )}

        {code && (
          <div className="relative">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Generated code", "កូដដែលបានបង្កើត")}</span>
              <CopyButton text={code} compact />
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-mono-ui text-xs text-[var(--ink)]">{code}</pre>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
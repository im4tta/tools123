"use client";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { Download, Plus, X } from "lucide-react";

type Rule = { type: "allow" | "disallow"; path: string; note: string };

export default function RobotsTxtGenerator() {
  const { text: t } = useLanguage();
  const [agents, setAgents] = useToolState("robots:agents", "*\nGooglebot");
  const [rules, setRules] = useToolState<Rule[]>("robots:rules", [
    { type: "allow", path: "/public", note: "" },
    { type: "disallow", path: "/admin", note: "Private admin area" },
  ]);
  const [sitemaps, setSitemaps] = useToolState("robots:sitemaps", "https://example.com/sitemap.xml");
  const [delay, setDelay] = useToolState("robots:delay", "");
  const [host, setHost] = useToolState("robots:host", "");

  const agentList = agents.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const sitemapList = sitemaps.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  const errors: string[] = [];
  if (agentList.length === 0) errors.push(t("Add at least one user-agent.", "សូមបន្ថែម user-agent យ៉ាងតិចមួយ។"));
  rules.forEach((r, i) => {
    if (!r.path.trim().startsWith("/")) {
      errors.push(t(`Rule ${i + 1}: path must start with "/".`, `វិធានទី ${i + 1}៖ ផ្លូវត្រូវតែចាប់ផ្ដើមដោយ "/"។`));
    }
  });

  let robots = "";
  if (agentList.length > 0) {
    const lines: string[] = ["# robots.txt"];
    for (const a of agentList) lines.push(`User-agent: ${a}`);
    for (const r of rules) {
      const path = r.path.trim() || "/";
      if (r.note.trim()) lines.push(`# ${r.note.trim()}`);
      lines.push(`${r.type === "allow" ? "Allow" : "Disallow"}: ${path}`);
    }
    if (delay.trim()) lines.push(`Crawl-delay: ${delay.trim()}`);
    if (host.trim()) lines.push(`Host: ${host.trim()}`);
    for (const s of sitemapList) lines.push(`Sitemap: ${s}`);
    robots = lines.join("\n");
  }

  const patchRule = (i: number, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  function download() {
    const blob = new Blob([robots], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="Robots.txt Generator"
      khmerTitle="បង្កើត robots.txt"
      description="Build a robots.txt file with user-agents, allow/disallow rules, crawl-delay, host, and sitemap URLs, then copy or download it."
      descriptionKm="បង្កើតឯកសារ robots.txt ជាមួយ user-agent, វិធាន allow/disallow, crawl-delay, host និងតំណភ្ជាប់ sitemap រួចចម្លង ឬទាញយក។"
    >
      <Row>
        <Field label="User-agent(s)" labelKm="User-agent (ច្រើនអាចធ្វើបាន)" hint="One per line" hintKm="មួយជួរមួយ">
          <TextArea rows={3} value={agents} onChange={(e) => setAgents(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Sitemap URL(s)" labelKm="តំណភ្ជាប់ Sitemap" hint="One per line" hintKm="មួយជួរមួយ">
          <TextArea rows={3} value={sitemaps} onChange={(e) => setSitemaps(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <Field label="Allow / Disallow rules" labelKm="វិធាន Allow / Disallow">
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr_1fr_auto]">
              <Select value={r.type} onChange={(e) => patchRule(i, { type: e.target.value as Rule["type"] })}>
                <option value="allow">Allow</option>
                <option value="disallow">Disallow</option>
              </Select>
              <TextInput
                value={r.path}
                onChange={(e) => patchRule(i, { path: e.target.value })}
                placeholder="/path"
                className="font-mono-ui"
              />
              <TextInput
                value={r.note}
                onChange={(e) => patchRule(i, { note: e.target.value })}
                placeholder={t("Note (optional comment)", "កំណត់សម្គាល់ (ជម្រើស)")}
              />
              <button
                type="button"
                onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))}
                aria-label={t("Remove rule", "លុបវិធាន")}
                className="flex items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-[var(--ink-dim)] transition hover:text-[var(--danger)]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Button type="button" onClick={() => setRules((prev) => [...prev, { type: "disallow", path: "", note: "" }])}>
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} />
              {t("Add rule", "បន្ថែមវិធាន")}
            </span>
          </Button>
        </div>
      </Field>

      <Row>
        <Field label="Crawl-delay" labelKm="ការពន្យាពេលវារ (Crawl-delay)">
          <TextInput inputMode="decimal" value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="5" className="font-mono-ui" />
        </Field>
        <Field label="Host" labelKm="ម៉ាស៊ីនមេ (Host)">
          <TextInput value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com" className="font-mono-ui" />
        </Field>
      </Row>

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-[var(--danger)]">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <Output label="robots.txt" value={robots} />
      <Button type="button" onClick={download} disabled={!robots}>
        <span className="inline-flex items-center gap-1.5">
          <Download size={14} />
          {t("Download robots.txt", "ទាញយក robots.txt")}
        </span>
      </Button>
    </ToolShell>
  );
}

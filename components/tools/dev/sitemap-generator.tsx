"use client";
import { ToolShell, Field, TextInput, TextArea } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { Download } from "lucide-react";

const CHANGEFREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isValidDate(s: string): boolean {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

type UrlEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: string };

export default function SitemapGenerator() {
  const { text: t } = useLanguage();
  const [base, setBase] = useToolState("sitemap:base", "https://example.com");
  const [paths, setPaths] = useToolState(
    "sitemap:paths",
    "/\n/about\n/blog 2026-01-01 weekly 0.8\n/contact 2026-02-01 monthly 0.5"
  );

  const baseUrl = base.trim().replace(/\/+$/, "");
  const baseOk = /^https?:\/\/\S+$/i.test(baseUrl);
  const errors: string[] = [];
  const urls: UrlEntry[] = [];

  paths.split(/\r?\n/).forEach((line, i) => {
    const raw = line.trim();
    if (!raw) return;
    const p = raw.split(/[|\s]+/).filter(Boolean);
    if (!p[0]) {
      errors.push(t(`Line ${i + 1}: path is empty.`, `ជួរទី ${i + 1}៖ ផ្លូវទទេ។`));
      return;
    }
    const entry: UrlEntry = { loc: p[0].startsWith("/") ? p[0] : "/" + p[0] };
    if (p[1]) {
      if (isValidDate(p[1])) entry.lastmod = p[1];
      else errors.push(t(`Line ${i + 1}: lastmod must be YYYY-MM-DD.`, `ជួរទី ${i + 1}៖ lastmod ត្រូវតែជា YYYY-MM-DD។`));
    }
    if (p[2]) {
      if (CHANGEFREQS.includes(p[2])) entry.changefreq = p[2];
      else errors.push(t(`Line ${i + 1}: unknown changefreq "${p[2]}".`, `ជួរទី ${i + 1}៖ changefreq "${p[2]}" មិនស្គាល់។`));
    }
    if (p[3]) {
      const pr = Number(p[3]);
      if (!Number.isNaN(pr) && pr >= 0 && pr <= 1) entry.priority = String(pr);
      else errors.push(t(`Line ${i + 1}: priority must be between 0.0 and 1.0.`, `ជួរទី ${i + 1}៖ priority ត្រូវតែស្ថិតនៅចន្លោះ 0.0 និង 1.0។`));
    }
    urls.push(entry);
  });

  if (!baseOk) {
    errors.unshift(t("Base URL must start with http:// or https://.", "URL មូលដ្ឋានត្រូវតែចាប់ផ្ដើមដោយ http:// ឬ https://។"));
  }

  let xml = "";
  if (baseOk) {
    const rows = urls.map((u) => {
      const bits = [`    <loc>${esc(baseUrl + u.loc)}</loc>`];
      if (u.lastmod) bits.push(`    <lastmod>${esc(u.lastmod)}</lastmod>`);
      if (u.changefreq) bits.push(`    <changefreq>${esc(u.changefreq)}</changefreq>`);
      if (u.priority) bits.push(`    <priority>${esc(u.priority)}</priority>`);
      return `  <url>\n${bits.join("\n")}\n  </url>`;
    });
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>`;
  }

  function download() {
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="Sitemap Generator"
      khmerTitle="បង្កើត Sitemap"
      description="Generate a sitemap.xml from a base URL and a list of paths. Each path line can add lastmod, changefreq, and priority separated by spaces, tabs, or |."
      descriptionKm="បង្កើត sitemap.xml ពី URL មូលដ្ឋាន និងបញ្ជីផ្លូវ។ ជួរនីមួយៗអាចបន្ថែម lastmod, changefreq និង priority ដោយបំបែកដោយដកឃ្លា, tab ឬ |។"
    >
      <Field label="Base URL" labelKm="URL មូលដ្ឋាន">
        <TextInput value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://example.com" className="font-mono-ui" />
      </Field>
      <Field
        label="Paths"
        labelKm="ផ្លូវ (Paths)"
        hint="Format: /path lastmod changefreq priority (space, tab, or | separated) — one per line"
        hintKm="ទម្រង់៖ /path lastmod changefreq priority (បំបែកដោយដកឃ្លា, tab ឬ |) — មួយជួរមួយ"
      >
        <TextArea rows={8} value={paths} onChange={(e) => setPaths(e.target.value)} className="font-mono-ui" />
      </Field>

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-[var(--danger)]">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <Output label="sitemap.xml" value={xml} />
      <Button type="button" onClick={download} disabled={!xml}>
        <span className="inline-flex items-center gap-1.5">
          <Download size={14} />
          {t("Download sitemap.xml", "ទាញយក sitemap.xml")}
        </span>
      </Button>
    </ToolShell>
  );
}

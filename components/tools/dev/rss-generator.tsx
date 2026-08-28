"use client";
import { ToolShell, Field, TextInput, TextArea, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { Download, Plus, X } from "lucide-react";

type Item = { title: string; link: string; description: string; pubDate: string };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Converts YYYY-MM-DD to RFC 822 (e.g. "Wed, 01 Jan 2026 00:00:00 +0000"); returns "" when invalid. */
function toRfc822(dateStr: string): string {
  const m = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return "";
  return date.toUTCString().replace("GMT", "+0000");
}

export default function RssGenerator() {
  const { text: t } = useLanguage();
  const [title, setTitle] = useToolState("rss:title", "Khmer Studio Blog");
  const [link, setLink] = useToolState("rss:link", "https://example.com/blog");
  const [description, setDescription] = useToolState("rss:description", "Latest articles and tutorials.");
  const [language, setLanguage] = useToolState("rss:language", "en");
  const [image, setImage] = useToolState("rss:image", "");
  const [items, setItems] = useToolState<Item[]>("rss:items", [
    { title: "Hello World", link: "https://example.com/blog/hello", description: "First post", pubDate: "2026-08-01" },
  ]);

  const linkOk = /^https?:\/\/\S+$/i.test(link.trim());
  const languageOk = /^[a-z]{2,3}(-[a-z0-9]+)*$/i.test(language.trim());

  const errors: string[] = [];
  if (!title.trim()) errors.push(t("Feed title is required.", "ត្រូវការចំណងជើង feed។"));
  if (!linkOk) errors.push(t("Feed link must be a valid http(s) URL.", "តំណភ្ជាប់ feed ត្រូវតែជា URL http(s) ត្រឹមត្រូវ។"));
  if (language.trim() && !languageOk) errors.push(t("Language must be a code like \"en\" or \"km\".", "ភាសាត្រូវតែជាកូដដូចជា \"en\" ឬ \"km\"។"));
  if (image.trim() && !/^https?:\/\/\S+$/i.test(image.trim())) {
    errors.push(t("Image URL must be a valid http(s) URL.", "URL រូបភាពត្រូវតែជា URL http(s) ត្រឹមត្រូវ។"));
  }
  items.forEach((it, i) => {
    if (!it.title.trim()) errors.push(t(`Item ${i + 1}: title is required.`, `ធាតុទី ${i + 1}៖ ត្រូវការចំណងជើង។`));
    if (it.link.trim() && !/^https?:\/\/\S+$/i.test(it.link.trim())) {
      errors.push(t(`Item ${i + 1}: link must be a valid http(s) URL.`, `ធាតុទី ${i + 1}៖ តំណភ្ជាប់ត្រូវតែជា URL http(s) ត្រឹមត្រូវ។`));
    }
    if (it.pubDate.trim() && !toRfc822(it.pubDate)) {
      errors.push(t(`Item ${i + 1}: pubDate must be YYYY-MM-DD.`, `ធាតុទី ${i + 1}៖ pubDate ត្រូវតែជា YYYY-MM-DD។`));
    }
  });

  let xml = "";
  if (title.trim() && linkOk) {
    const cleanLink = link.trim().replace(/\/+$/, "");
    const bits: string[] = [
      `    <title>${esc(title.trim())}</title>`,
      `    <link>${esc(cleanLink)}</link>`,
      `    <description>${esc(description.trim())}</description>`,
      `    <language>${esc(language.trim() || "en")}</language>`,
    ];
    if (image.trim()) {
      bits.push(
        "    <image>",
        `      <url>${esc(image.trim())}</url>`,
        `      <title>${esc(title.trim())}</title>`,
        `      <link>${esc(cleanLink)}</link>`,
        "    </image>"
      );
    }
    items.forEach((it, i) => {
      if (!it.title.trim()) return;
      const itemLink = it.link.trim() ? it.link.trim() : `${cleanLink}#item-${i + 1}`;
      const itemBits = [`      <title>${esc(it.title.trim())}</title>`, `      <link>${esc(itemLink)}</link>`];
      if (it.description.trim()) itemBits.push(`      <description>${esc(it.description.trim())}</description>`);
      itemBits.push(`      <guid isPermaLink="${it.link.trim() ? "true" : "false"}">${esc(itemLink)}</guid>`);
      if (it.pubDate.trim() && toRfc822(it.pubDate)) itemBits.push(`      <pubDate>${toRfc822(it.pubDate)}</pubDate>`);
      bits.push("    <item>", ...itemBits, "    </item>");
    });
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n${bits.join("\n")}\n  </channel>\n</rss>`;
  }

  const patchItem = (i: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  };

  function download() {
    const blob = new Blob([xml], { type: "application/rss+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feed.xml";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="RSS Feed Generator"
      khmerTitle="បង្កើត RSS Feed"
      description="Build an RSS 2.0 feed from channel metadata and an item list (title, link, description, optional pubDate), then copy or download it."
      descriptionKm="បង្កើត RSS 2.0 feed ពីព័ត៌មាន channel និងបញ្ជីធាតុ (ចំណងជើង, តំណភ្ជាប់, ការពិពណ៌នា, pubDate ស្រេចចិត្ត) រួចចម្លង ឬទាញយក។"
    >
      <Row>
        <Field label="Feed title" labelKm="ចំណងជើង Feed">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Feed link" labelKm="តំណភ្ជាប់ Feed">
          <TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/blog" className="font-mono-ui" />
        </Field>
        <Field label="Description" labelKm="ការពិពណ៌នា">
          <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Language" labelKm="ភាសា" hint="e.g. en, km, en-US" hintKm="ឧ. en, km, en-US">
          <TextInput value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" className="font-mono-ui" />
        </Field>
        <Field label="Image URL (optional)" labelKm="URL រូបភាព (ជម្រើស)">
          <TextInput value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/logo.png" className="font-mono-ui" />
        </Field>
      </Row>

      <Field label="Items" labelKm="ធាតុ">
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_1.5fr_7.5rem_2rem] gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)] sm:grid">
            <span>{t("Title", "ចំណងជើង")}</span>
            <span>{t("Link", "តំណភ្ជាប់")}</span>
            <span>{t("Description", "ការពិពណ៌នា")}</span>
            <span>{t("Pub date", "កាលបរិច្ឆេទចេញផ្សាយ")}</span>
            <span />
          </div>
          {items.map((it, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 sm:grid-cols-[1fr_1fr_1.5fr_7.5rem_2rem] sm:border-0 sm:bg-transparent sm:p-0"
            >
              <TextInput value={it.title} onChange={(e) => patchItem(i, { title: e.target.value })} placeholder={t("Post title", "ចំណងជើងអត្ថបទ")} />
              <TextInput value={it.link} onChange={(e) => patchItem(i, { link: e.target.value })} placeholder="https://…" className="font-mono-ui" />
              <TextInput value={it.description} onChange={(e) => patchItem(i, { description: e.target.value })} />
              <TextInput value={it.pubDate} onChange={(e) => patchItem(i, { pubDate: e.target.value })} placeholder="YYYY-MM-DD" className="font-mono-ui" />
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                aria-label={t("Remove item", "លុបធាតុ")}
                className="flex items-center justify-center justify-self-start rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-[var(--ink-dim)] transition hover:text-[var(--danger)] sm:justify-self-stretch"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Button type="button" onClick={() => setItems((prev) => [...prev, { title: "", link: "", description: "", pubDate: "" }])}>
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} />
              {t("Add item", "បន្ថែមធាតុ")}
            </span>
          </Button>
        </div>
      </Field>

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-[var(--danger)]">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <Output label="feed.xml" value={xml} />
      <Button type="button" onClick={download} disabled={!xml}>
        <span className="inline-flex items-center gap-1.5">
          <Download size={14} />
          {t("Download feed.xml", "ទាញយក feed.xml")}
        </span>
      </Button>
    </ToolShell>
  );
}

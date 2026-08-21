"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function MetaTagGenerator() {
  const { text: t } = useLanguage();
  const [title, setTitle] = useToolState("meta-tag:title", "123 Toolbox — Free online tools");
  const [description, setDescription] = useToolState("meta-tag:description", "Free browser-based tools for office, developers, and Khmer language.");
  const [canonical, setCanonical] = useToolState("meta-tag:canonical", "https://123tool.app/");
  const [siteName, setSiteName] = useToolState("meta-tag:site", "123 Toolbox");
  const [image, setImage] = useToolState("meta-tag:image", "https://123tool.app/og.png");
  const [handle, setHandle] = useToolState("meta-tag:handle", "@123toolbox");
  const [themeColor, setThemeColor] = useToolState("meta-tag:theme", "#0f9e8e");

  const snippet = useMemo(() => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(description)}" />`,
      `<link rel="canonical" href="${esc(canonical)}" />`,
      ``,
      `<!-- Open Graph -->`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${esc(siteName)}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      image ? `<meta property="og:image" content="${esc(image)}" />` : null,
      ``,
      `<!-- Twitter / X -->`,
      `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
      image ? `<meta name="twitter:image" content="${esc(image)}" />` : null,
      handle ? `<meta name="twitter:site" content="${esc(handle)}" />` : null,
      ``,
      `<!-- Misc -->`,
      themeColor ? `<meta name="theme-color" content="${esc(themeColor)}" />` : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  }, [title, description, canonical, siteName, image, handle, themeColor]);

  return (
    <ToolShell
      title="Meta Tag Generator"
      khmerTitle="បង្កើតសញ្ញាសម្គាល់ Meta"
      description="Generate SEO and social-share meta tags — title, description, Open Graph, Twitter cards — ready to paste."
      descriptionKm="បង្កើតសញ្ញាសម្គាល់ SEO និងបណ្ដាញសង្គម — ចំណងជើង ការពិពណ៌នា Open Graph Twitter cards — រួចរាល់សម្រាប់បិទភ្ជាប់។"
    >
      <div className="space-y-4">
        <Field label={t("Page title", "ចំណងជើងទំព័រ")}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t("Description", "ការពិពណ៌នា")}>
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("Canonical URL", "URL គោល")}>
            <TextInput value={canonical} onChange={(e) => setCanonical(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Site name", "ឈ្មោះគេហទំព័រ")}>
            <TextInput value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </Field>
          <Field label={t("Social image URL", "តំណរូបភាពសង្គម")} hint="1200×630">
            <TextInput value={image} onChange={(e) => setImage(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Twitter / X handle", "ឈ្មោះ Twitter / X")} hint="@optional">
            <TextInput value={handle} onChange={(e) => setHandle(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Theme color", "ពណ៌ធីម")}>
            <TextInput value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="font-mono-ui" />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Generated tags", "សញ្ញាសម្គាល់ដែលបានបង្កើត")}</span>
            <CopyButton text={snippet} compact />
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-mono-ui text-xs text-[var(--ink)]">{snippet}</pre>
        </div>

        <p className="text-xs text-[var(--ink-faint)]">{t("Paste inside the <head> element of your page.", "បិទភ្ជាប់ក្នុងធាតុ <head> របស់ទំព័រអ្នក។")}</p>
      </div>
    </ToolShell>
  );
}
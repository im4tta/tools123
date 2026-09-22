"use client";
import { useMemo } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Dir = "md2wiki" | "wiki2md";

const isExternal = (url: string) => /^(https?:|mailto:|tel:|ftp:|#|\/\/)/i.test(url) || url.includes("://");

function mdToWiki(text: string, stripMd: boolean): string {
  return text.replace(/(!?)\[([^\]]*)\]\(\s*([^)]+?)\s*(?:\s+"[^"]*")?\)/g, (m, bang, label, url) => {
    if (isExternal(url)) return m; // keep real links
    let target = decodeURIComponent(url.trim());
    if (stripMd) target = target.replace(/\.md($|#)/i, "$1");
    const base = target.split("/").pop()?.replace(/#.*$/, "") ?? target;
    const alias = label && label !== base && label !== target ? `|${label}` : "";
    return `${bang}[[${target}${alias}]]`;
  });
}

function wikiToMd(text: string, addMd: boolean, encode: boolean): string {
  return text.replace(/(!?)\[\[([^\]]+)\]\]/g, (_m, bang, inner) => {
    const [rawTarget, alias] = inner.split("|");
    const target = rawTarget.trim();
    const label = (alias ?? target).trim();
    let url = target;
    if (addMd && !/\.[a-z0-9]+($|#|\^)/i.test(target) && !target.startsWith("#")) {
      const [pathPart, frag] = target.split(/(#.*)/);
      url = `${pathPart}.md${frag ?? ""}`;
    }
    if (encode) url = url.replace(/ /g, "%20");
    return `${bang}[${label}](${url})`;
  });
}

export default function WikilinkConverter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("wikilink-conv:input", "");
  const [dir, setDir] = useToolState<Dir>("wikilink-conv:dir", "md2wiki");
  const [stripMd, setStripMd] = useToolState("wikilink-conv:stripMd", true);
  const [addMd, setAddMd] = useToolState("wikilink-conv:addMd", true);
  const [encode, setEncode] = useToolState("wikilink-conv:encode", true);

  const output = useMemo(() => (dir === "md2wiki" ? mdToWiki(input, stripMd) : wikiToMd(input, addMd, encode)), [input, dir, stripMd, addMd, encode]);

  return (
    <ToolShell
      title="Wikilink & Markdown Link Converter"
      khmerTitle="ឧបករណ៍បម្លែងតំណ Wikilink និង Markdown"
      description="Convert between Obsidian-style wikilinks [[note|alias]] and standard Markdown links [alias](note.md), in both directions. Internal note links are converted while real external URLs (http, mailto…) are left untouched. Handy when moving notes between Obsidian and other Markdown apps. Runs in your browser."
      descriptionKm="បម្លែងរវាង wikilink បែប Obsidian [[note|alias]] និងតំណ Markdown ស្តង់ដារ [alias](note.md) ទាំងសងខាង។ តំណកំណត់ត្រាខាងក្នុងត្រូវបម្លែង ចំណែក URL ខាងក្រៅពិត (http, mailto…) ត្រូវទុកដដែល។ មានប្រយោជន៍ពេលផ្លាស់កំណត់ត្រារវាង Obsidian និងកម្មវិធី Markdown ផ្សេង។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDir((d) => (d === "md2wiki" ? "wiki2md" : "md2wiki"))} className="flex items-center gap-2 rounded-md border border-[var(--gold)] bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-medium text-[var(--gold)]">
          <ArrowLeftRight size={13} />
          {dir === "md2wiki" ? t("Markdown → Wikilink", "Markdown → Wikilink") : t("Wikilink → Markdown", "Wikilink → Markdown")}
        </button>
        {dir === "md2wiki" ? (
          <button type="button" onClick={() => setStripMd((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${stripMd ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
            {t("Strip .md extension", "ដក .md")}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => setAddMd((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${addMd ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
              {t("Add .md extension", "បន្ថែម .md")}
            </button>
            <button type="button" onClick={() => setEncode((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${encode ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
              {t("Encode spaces (%20)", "អ៊ិនកូដចន្លោះ (%20)")}
            </button>
          </>
        )}
      </div>

      <Field label="Input" labelKm="ទិន្នន័យបញ្ចូល">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder={dir === "md2wiki" ? "See [my note](notes/My Note.md) and [Obsidian](https://obsidian.md)" : "See [[notes/My Note|my note]] and [[Ideas]]"} />
      </Field>

      <Output label="Output" value={output || " "} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Conversion uses pattern matching in your browser. Embeds (![[…]] / ![](…)), aliases, and heading/block anchors (#, ^) are preserved; links that are clearly external URLs are left as-is. Obsidian is a trademark of Dynalith Systems, Inc.; this tool is not affiliated with it.",
          "ការបម្លែងប្រើការផ្គូផ្គងលំនាំក្នុងកម្មវិធីរុករក។ Embed (![[…]] / ![](…)) ឈ្មោះក្លែង និងយុថ្កាចំណងជើង/ប្លុក (#, ^) ត្រូវរក្សាទុក ចំណែកតំណដែលច្បាស់ជា URL ខាងក្រៅ ត្រូវទុកដដែល។ Obsidian ជាពាណិជ្ជសញ្ញារបស់ Dynalith Systems, Inc.; ឧបករណ៍នេះមិនពាក់ព័ន្ធនឹងវាទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}

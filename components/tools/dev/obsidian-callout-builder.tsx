"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextInput, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Obsidian's built-in callout types and their accent colours (from the docs).
const TYPES: { id: string; color: string; icon: string }[] = [
  { id: "note", color: "#086ddd", icon: "✏️" },
  { id: "abstract", color: "#00bfa0", icon: "📋" },
  { id: "info", color: "#086ddd", icon: "ℹ️" },
  { id: "todo", color: "#086ddd", icon: "☑️" },
  { id: "tip", color: "#00bfa0", icon: "🔥" },
  { id: "success", color: "#0ca678", icon: "✅" },
  { id: "question", color: "#e0ac00", icon: "❓" },
  { id: "warning", color: "#e0812c", icon: "⚠️" },
  { id: "failure", color: "#e93147", icon: "✖️" },
  { id: "danger", color: "#e93147", icon: "⚡" },
  { id: "bug", color: "#e93147", icon: "🐛" },
  { id: "example", color: "#7852ee", icon: "📑" },
  { id: "quote", color: "#9e9e9e", icon: "💬" },
];

type Fold = "none" | "open" | "closed";

export default function ObsidianCalloutBuilder() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState("obsidian-callout:type", "note");
  const [title, setTitle] = useToolState("obsidian-callout:title", "");
  const [body, setBody] = useToolState("obsidian-callout:body", "");
  const [fold, setFold] = useToolState<Fold>("obsidian-callout:fold", "none");

  const meta = TYPES.find((x) => x.id === type) ?? TYPES[0];

  const markdown = useMemo(() => {
    const foldMark = fold === "open" ? "+" : fold === "closed" ? "-" : "";
    const head = `> [!${type}]${foldMark}${title.trim() ? " " + title.trim() : ""}`;
    const lines = body.length ? body.split("\n").map((l) => `> ${l}`.trimEnd()) : [];
    return [head, ...lines].join("\n");
  }, [type, title, body, fold]);

  return (
    <ToolShell
      title="Obsidian Callout Builder"
      khmerTitle="ឧបករណ៍បង្កើត Callout សម្រាប់ Obsidian"
      description="Build Obsidian callouts (admonitions) visually and copy the Markdown. Pick a type — note, tip, warning, danger, quote, and more — add a title and body, choose whether it's foldable, and see a live preview. Paste the result into any Obsidian note. Everything runs in your browser."
      descriptionKm="បង្កើត Callout (admonition) សម្រាប់ Obsidian ដោយមើលឃើញ ហើយចម្លង Markdown។ ជ្រើសប្រភេទ — note, tip, warning, danger, quote និងច្រើនទៀត — បន្ថែមចំណងជើង និងខ្លឹមសារ ជ្រើសថាតើអាចបត់បាន និងមើលការបង្ហាញផ្ទាល់។ បិទភ្ជាប់លទ្ធផលទៅក្នុងកំណត់ត្រា Obsidian ណាមួយ។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Type", "ប្រភេទ")}</span>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((x) => (
            <button key={x.id} type="button" onClick={() => setType(x.id)} className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${type === x.id ? "text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`} style={type === x.id ? { borderColor: x.color, background: `${x.color}1a` } : undefined}>
              {x.icon} {x.id}
            </button>
          ))}
        </div>
      </div>

      <Field label="Title (optional)" labelKm="ចំណងជើង (ស្រេចចិត្ត)">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Defaults to the type name", "លំនាំដើមជាឈ្មោះប្រភេទ")} />
      </Field>
      <Field label="Body" labelKm="ខ្លឹមសារ">
        <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder={t("Callout content (Markdown allowed)…", "ខ្លឹមសារ callout (អនុញ្ញាត Markdown)…")} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--ink-faint)]">{t("Foldable", "អាចបត់")}:</span>
        {([["none", "No", "ទេ"], ["open", "Open", "បើក"], ["closed", "Collapsed", "បិទ"]] as const).map(([id, en, km]) => (
          <button key={id} type="button" onClick={() => setFold(id)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${fold === id ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>{t(en, km)}</button>
        ))}
      </div>

      {/* Preview approximating Obsidian's callout styling */}
      <div className="rounded-md border-l-4 bg-[var(--ground-raised)] p-3" style={{ borderColor: meta.color, background: `${meta.color}14` }}>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: meta.color }}>
          <span>{meta.icon}</span><span>{title.trim() || type.charAt(0).toUpperCase() + type.slice(1)}</span>
          {fold !== "none" && <span className="ml-auto text-xs">{fold === "closed" ? "▸" : "▾"}</span>}
        </div>
        {body.trim() && fold !== "closed" && <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ink-dim)]">{body}</p>}
      </div>

      <div className="flex items-center gap-2"><span className="text-xs text-[var(--ink-faint)]">{t("Copy Markdown", "ចម្លង Markdown")}</span><CopyButton text={markdown} compact /></div>
      <Output label="Markdown" value={markdown} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Callout syntax and the built-in type names follow the Obsidian documentation (a callout is a blockquote whose first line is [!type]). Obsidian is a trademark of Dynalith Systems, Inc.; this tool is not affiliated with or endorsed by Obsidian — it just generates compatible Markdown, in your browser.",
          "វាក្យសម្ព័ន្ធ callout និងឈ្មោះប្រភេទដែលមានស្រាប់ អនុវត្តតាមឯកសារ Obsidian (callout ជា blockquote ដែលបន្ទាត់ដំបូងជា [!type])។ Obsidian ជាពាណិជ្ជសញ្ញារបស់ Dynalith Systems, Inc.; ឧបករណ៍នេះមិនពាក់ព័ន្ធ ឬទទួលការគាំទ្រពី Obsidian ទេ — វាគ្រាន់តែបង្កើត Markdown ដែលឆបគ្នា ក្នុងកម្មវិធីរុករក។",
        )}</p>
      </section>
    </ToolShell>
  );
}

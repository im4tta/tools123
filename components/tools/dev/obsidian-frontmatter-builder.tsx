"use client";
import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type PropType = "text" | "number" | "checkbox" | "list" | "date";
type Prop = { key: string; value: string; type: PropType };

function yamlString(s: string): string {
  if (s === "") return '""';
  return /[:#\[\]{}",&*!|>'%@`]|^\s|\s$|^(true|false|null|yes|no)$/i.test(s) ? JSON.stringify(s) : s;
}

function serialize(props: Prop[]): string {
  const lines: string[] = [];
  for (const p of props) {
    const key = p.key.trim();
    if (!key) continue;
    if (p.type === "list") {
      const items = p.value.split(",").map((x) => x.trim()).filter(Boolean);
      lines.push(`${key}:`);
      for (const it of items) lines.push(`  - ${yamlString(it)}`);
      if (items.length === 0) lines[lines.length - 1] = `${key}: []`;
    } else if (p.type === "number") {
      const n = p.value.trim();
      lines.push(`${key}: ${n === "" ? 0 : n}`);
    } else if (p.type === "checkbox") {
      lines.push(`${key}: ${/^(true|yes|1|on)$/i.test(p.value.trim()) ? "true" : "false"}`);
    } else if (p.type === "date") {
      lines.push(`${key}: ${p.value.trim() || new Date().toISOString().slice(0, 10)}`);
    } else {
      lines.push(`${key}: ${yamlString(p.value)}`);
    }
  }
  return `---\n${lines.join("\n")}\n---`;
}

const DEFAULT: Prop[] = [
  { key: "title", value: "", type: "text" },
  { key: "tags", value: "", type: "list" },
  { key: "aliases", value: "", type: "list" },
  { key: "created", value: "", type: "date" },
  { key: "publish", value: "false", type: "checkbox" },
];

export default function ObsidianFrontmatterBuilder() {
  const { text: t } = useLanguage();
  const [props, setProps] = useToolState<Prop[]>("obsidian-frontmatter:props", DEFAULT);

  const yaml = useMemo(() => serialize(props), [props]);

  const update = (i: number, patch: Partial<Prop>) => setProps((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => setProps((prev) => prev.filter((_, j) => j !== i));
  const add = () => setProps((prev) => [...prev, { key: "", value: "", type: "text" }]);

  return (
    <ToolShell
      title="Obsidian Properties Builder"
      khmerTitle="ឧបករណ៍បង្កើត Properties សម្រាប់ Obsidian"
      description="Build the YAML frontmatter (properties) block for an Obsidian note without hand-writing YAML. Add title, tags, aliases, dates, checkboxes, and any custom properties with the right type, and copy a clean, correctly-quoted --- block to paste at the top of your note. Runs in your browser."
      descriptionKm="បង្កើតប្លុក YAML frontmatter (properties) សម្រាប់កំណត់ត្រា Obsidian ដោយមិនចាំបាច់សរសេរ YAML ដោយដៃ។ បន្ថែមចំណងជើង ស្លាក ឈ្មោះក្លែង កាលបរិច្ឆេទ ប្រអប់ធីក និង property ផ្ទាល់ខ្លួនណាមួយជាមួយប្រភេទត្រឹមត្រូវ ហើយចម្លងប្លុក --- ស្អាតត្រឹមត្រូវ ដើម្បីបិទភ្ជាប់នៅផ្នែកខាងលើកំណត់ត្រា។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <div className="space-y-2">
        {props.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.4fr_auto_auto] items-end gap-2">
            <Field label={i === 0 ? "Property" : ""} labelKm={i === 0 ? "លក្ខណៈ" : ""}>
              <TextInput value={p.key} onChange={(e) => update(i, { key: e.target.value })} placeholder="key" autoComplete="off" />
            </Field>
            <Field label={i === 0 ? "Value" : ""} labelKm={i === 0 ? "តម្លៃ" : ""}>
              {p.type === "checkbox" ? (
                <Select value={/^(true|yes|1|on)$/i.test(p.value) ? "true" : "false"} onChange={(e) => update(i, { value: e.target.value })}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </Select>
              ) : (
                <TextInput type={p.type === "date" ? "date" : p.type === "number" ? "number" : "text"} value={p.value} onChange={(e) => update(i, { value: e.target.value })} placeholder={p.type === "list" ? t("comma, separated", "បំបែកដោយ,") : ""} autoComplete="off" />
              )}
            </Field>
            <Field label={i === 0 ? "Type" : ""} labelKm={i === 0 ? "ប្រភេទ" : ""}>
              <Select value={p.type} onChange={(e) => update(i, { type: e.target.value as PropType })}>
                <option value="text">Text</option>
                <option value="list">List</option>
                <option value="number">Number</option>
                <option value="checkbox">Checkbox</option>
                <option value="date">Date</option>
              </Select>
            </Field>
            <button type="button" onClick={() => remove(i)} aria-label={t("Remove", "លុប")} className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-faint)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)]">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="flex w-fit items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
        <Plus size={13} />{t("Add property", "បន្ថែម property")}
      </button>

      <div className="flex items-center gap-2"><span className="text-xs text-[var(--ink-faint)]">{t("Copy frontmatter", "ចម្លង frontmatter")}</span><CopyButton text={yaml} compact /></div>
      <Output label="YAML frontmatter" value={yaml} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "The output is a standard YAML frontmatter block — the --- fenced properties Obsidian and most static-site generators read. Values that need it are quoted automatically, and list types become YAML block lists. Everything is generated in your browser. Obsidian is a trademark of Dynalith Systems, Inc.; this tool is not affiliated with it.",
          "លទ្ធផលជាប្លុក YAML frontmatter ស្តង់ដារ — properties ក្នុងរបង --- ដែល Obsidian និងកម្មវិធីបង្កើតគេហទំព័រភាគច្រើនអាន។ តម្លៃដែលត្រូវការ ត្រូវដាក់សញ្ញាសម្រង់ដោយស្វ័យប្រវត្តិ ហើយប្រភេទ list ក្លាយជា YAML block list។ អ្វីៗបង្កើតក្នុងកម្មវិធីរុករក។ Obsidian ជាពាណិជ្ជសញ្ញារបស់ Dynalith Systems, Inc.; ឧបករណ៍នេះមិនពាក់ព័ន្ធនឹងវាទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}

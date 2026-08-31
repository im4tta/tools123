"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const TYPES = [
  { value: "feat", en: "feat — new feature", km: "feat — មុខងារថ្មី" },
  { value: "fix", en: "fix — bug fix", km: "fix — កែកំហុស" },
  { value: "docs", en: "docs — documentation", km: "docs — ឯកសារ" },
  { value: "style", en: "style — formatting", km: "style — ទម្រង់" },
  { value: "refactor", en: "refactor — code change", km: "refactor — កែលម្អកូដ" },
  { value: "perf", en: "perf — performance", km: "perf — ប្រសិទ្ធភាព" },
  { value: "test", en: "test — tests", km: "test — ការសាកល្បង" },
  { value: "build", en: "build — build system", km: "build — ប្រព័ន្ធកសាង" },
  { value: "chore", en: "chore — maintenance", km: "chore — ការថែទាំ" },
  { value: "revert", en: "revert — revert commit", km: "revert — ដកការផ្លាស់ប្តូរ" },
];

const EXAMPLE = `feat(parser): add ability to parse arrays

Add parsing support for array literals to the parser.

Closes #123`;

export default function ConventionalCommitGenerator() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState("cc:type", "feat");
  const [scope, setScope] = useToolState("cc:scope", "");
  const [breaking, setBreaking] = useToolState("cc:breaking", false);
  const [description, setDescription] = useToolState("cc:description", "");
  const [body, setBody] = useToolState("cc:body", "");
  const [footer, setFooter] = useToolState("cc:footer", "");

  const commit = useMemo(() => {
    if (!description.trim()) return "";
    const header = `${type}${scope.trim() ? `(${scope.trim()})` : ""}${breaking ? "!" : ""}: ${description.trim()}`;
    const parts = [header];
    if (body.trim()) parts.push("", body.trim());
    if (footer.trim()) parts.push("", footer.trim());
    return parts.join("\n");
  }, [type, scope, breaking, description, body, footer]);

  return (
    <ToolShell
      title="Conventional Commit Generator"
      khmerTitle="បង្កើត Conventional Commit"
      description="Write commit messages in the conventional commits format with optional scope, breaking change, body and footer."
      descriptionKm="សរសេរសារ commit តាមទម្រង់ conventional commits ជាមួយ scope, breaking change, តួសារ និងបាតកថា ស្រេចចិត្ត។"
    >
      <Row>
        <Field label="Commit type" labelKm="ប្រភេទ commit">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.en, o.km)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Scope (optional)" labelKm="Scope (ស្រេចចិត្ត)">
          <TextInput value={scope} onChange={(e) => setScope(e.target.value)} placeholder={t("e.g. parser", "ឧ. parser")} />
        </Field>
      </Row>
      <Field label="Description" labelKm="ការពណ៌នា">
        <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("e.g. add ability to parse arrays", "ឧ. add ability to parse arrays")} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
        <input type="checkbox" checked={breaking} onChange={(e) => setBreaking(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
        {t("Breaking change (adds !)", "Breaking change (បន្ថែម !)")}
      </label>
      <Field label="Body (optional)" labelKm="តួសារ (ស្រេចចិត្ត)">
        <TextArea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <Field label="Footer (optional)" labelKm="បាតកថា (ស្រេចចិត្ត)">
        <TextArea rows={2} value={footer} onChange={(e) => setFooter(e.target.value)} placeholder={t("e.g. Closes #123", "ឧ. Closes #123")} />
      </Field>

      {!description.trim() && (
        <p className="text-sm text-[var(--danger)]">{t("Enter a description to generate the commit.", "សូមបញ្ចូលការពណ៌នាដើម្បីបង្កើត commit។")}</p>
      )}
      <Output label={t("Commit message", "សារ commit")} value={commit} error={!description.trim()} />
      <Output label={t("Example", "ឧទាហរណ៍")} value={EXAMPLE} />

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        {t("Format follows the Conventional Commits specification —", "ទម្រង់អនុវត្តតាមលក្ខណៈបច្ចេកទេស Conventional Commits —")}{" "}
        <a className="underline" href="https://www.conventionalcommits.org/en/v1.0.0/" target="_blank" rel="noreferrer">conventionalcommits.org</a>
        {t(" — original Tools123 implementation.", " — ការសរសេរដើមរបស់ Tools123។")}
      </div>
    </ToolShell>
  );
}

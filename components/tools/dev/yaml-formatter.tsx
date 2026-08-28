"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import * as yaml from "js-yaml";

type Mode = "format" | "validate" | "minify";

const SAMPLE = `name: Tools123
version: 1.0
features:
  - yaml
  - json
`;

const MODES: { id: Mode; en: string; km: string }[] = [
  { id: "format", en: "Format", km: "រៀបទម្រង់" },
  { id: "validate", en: "Validate only", km: "ផ្ទៀងផ្ទាត់តែប៉ុណ្ណោះ" },
  { id: "minify", en: "Minify", km: "បង្រួម" },
];

export default function YamlFormatter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("yaml-formatter:input", SAMPLE);
  const [mode, setMode] = useToolState<Mode>("yaml-formatter:mode", "format");

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "", error: "" };
    try {
      const doc = yaml.load(input);
      if (mode === "validate") return { ok: true, output: t("Valid YAML", "YAML ត្រឹមត្រូវ"), error: "" };
      if (mode === "minify") return { ok: true, output: JSON.stringify(doc), error: "" };
      return { ok: true, output: yaml.dump(doc, { indent: 2, lineWidth: 100 }), error: "" };
    } catch (err) {
      if (err instanceof yaml.YAMLException) {
        const where = err.mark
          ? ` (${t("line", "បន្ទាត់")} ${err.mark.line + 1}, ${t("column", "ជួរឈរ")} ${err.mark.column + 1})`
          : "";
        return { ok: false, output: "", error: `${t("Parse error", "កំហុសក្នុងការញែក")}: ${err.reason}${where}` };
      }
      return { ok: false, output: "", error: String(err) };
    }
  }, [input, mode, t]);

  return (
    <ToolShell
      title="YAML Formatter"
      khmerTitle="រៀបចំទម្រង់ YAML"
      description="Validate, pretty-print, or minify YAML documents with clear line-level errors."
      descriptionKm="ផ្ទៀងផ្ទាត់ រៀបទម្រង់ ឬបង្រួមឯកសារ YAML ជាមួយកំហុសដែលបង្ហាញបន្ទាត់ច្បាស់លាស់។"
    >
      <Field label={t("Mode", "របៀប")}>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === m.id
                  ? "bg-[var(--gold)] text-[#0a0c0d]"
                  : "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {t(m.en, m.km)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t("YAML input", "បញ្ចូល YAML")}>
        <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} placeholder={SAMPLE} />
      </Field>
      {result.error ? (
        <Output label={t("Error", "កំហុស")} value={result.error} error />
      ) : (
        <Output label={t("Result", "លទ្ធផល")} value={result.output} />
      )}
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "This tool uses js-yaml (v4), the YAML parser and dumper for JavaScript by the nodeca team, licensed under the MIT License.",
            "ឧបករណ៍នេះប្រើ js-yaml (v4) ដែលជាអ្នកញែក និងបំប្លែង YAML របស់ក្រុម nodeca ក្រោមអាជ្ញាបណ្ណ MIT។"
          )}{" "}
          <a href="https://github.com/nodeca/js-yaml" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
            github.com/nodeca/js-yaml
          </a>
        </p>
      </div>
    </ToolShell>
  );
}

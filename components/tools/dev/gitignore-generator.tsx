"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const PRESETS: Record<string, string> = {
  Node: `node_modules/\ndist/\n.env\n.env.local\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.DS_Store\ncoverage/\n*.tsbuildinfo`,
  Python: `__pycache__/\n*.py[cod]\n*.so\n.Python\nvenv/\n.venv/\nenv/\n.pytest_cache/\n.mypy_cache/\n.coverage\nhtmlcov/\n.tox/\n*.egg-info/\n.DS_Store\n.idea/\n.vscode/\n.ipynb_checkpoints/`,
  "React / Vite": `node_modules/\ndist/\n.env\n.env.local\n.env.production.local\nnpm-debug.log*\nyarn-debug.log*\npnpm-debug.log*\ncoverage/\n*.tsbuildinfo\n.DS_Store\n.vscode/\n.idea/`,
  "Java / Gradle": `build/\n.gradle/\n*.class\n*.jar\n*.war\n.idea/\n*.iml\n.classpath\n.project\n.settings/\ntarget/\ndependency-reduced-pom.xml\n.DS_Store`,
  "Go": `bin/\n*.exe\n*.exe~\n*.test\n*.out\nvendor/\ncoverage.txt\n.DS_Store\n.env`,
  Rust: `target/\n**/*.rs.bk\nCargo.lock\n.DS_Store\n.env\n.idea/\n.vscode/`,
  "Ruby / Rails": `*.rbc\n.bundle/\nlog/*.log\npublic/assets/\ndb/*.sqlite3\nvendor/bundle/\nconfig/master.key\n.env\n.DS_Store`,
  "PHP / Laravel": `vendor/\nnode_modules/\n.env\n.phpunit.result.cache\nstorage/*.key\n.DS_Store\npublic/storage\nstorage/logs/*`,
  Docker: `node_modules/\n.env\n*.log\n.DS_Store\n.idea/\n.vscode/\ncoverage/`,
};

export default function GitignoreGenerator() {
  const { text: t } = useLanguage();
  const [stack, setStack] = useState<string>("Node");

  const content = useMemo(() => PRESETS[stack] ?? "", [stack]);
  const combos = Object.keys(PRESETS);

  return (
    <ToolShell
      title=".gitignore Generator"
      khmerTitle="បង្កើត .gitignore"
      description="Generate a ready-made .gitignore file for your stack."
      descriptionKm="បង្កើតឯកសារ .gitignore ត្រៀមរួចសម្រាប់គម្រោងរបស់អ្នក។"
    >
      <Field label={t("Language / stack", "ភាសា / ស្ដេក")}>
        <select value={stack} onChange={(e) => setStack(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]">
          {combos.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Output label=".gitignore" value={content} />
    </ToolShell>
  );
}
"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function score(selector: string) {
  let a = 0, b = 0, c = 0;
  const clean = selector.replace(/::[a-z-]+/g, "");
  const ids = clean.match(/#[\w-]+/g) ?? [];
  const classes = clean.match(/\.[\w-]+/g) ?? [];
  const attrs = clean.match(/\[[^\]]+\]/g) ?? [];
  const pseudo = clean.match(/:(?!:)[a-z-]+/g) ?? [];
  const elems = clean.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:(?!:)[a-z-]+/g, "").match(/[a-zA-Z][a-zA-Z0-9-]*/g) ?? [];
  a = ids.length;
  b = classes.length + attrs.length + pseudo.length;
  c = elems.length;
  const universal = (clean.match(/\*/g) ?? []).length;
  c = Math.max(0, c - universal);
  return { a, b, c, score: a * 100 + b * 10 + c };
}

export default function CssSpecificity() {
  const { text: t } = useLanguage();
  const [selector, setSelector] = useToolState("css-specificity:input", "#header .nav-item:hover a");

  const result = useMemo(() => {
    if (!selector.trim()) return null;
    try {
      return score(selector);
    } catch {
      return null;
    }
  }, [selector]);

  return (
    <ToolShell
      title="CSS Specificity Calculator"
      khmerTitle="គណនាអាទិភាព CSS"
      description="Calculate the specificity score (a,b,c) of any CSS selector."
      descriptionKm="គណនាពិន្ទុអាទិភាព (a,b,c) នៃ selector របស់ CSS ណាមួយ។"
    >
      <Field label={t("Selector", "Selector")}>
        <TextInput value={selector} onChange={(e) => setSelector(e.target.value)} className="font-mono-ui" placeholder=".btn:hover" />
      </Field>
      {result ? (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
          <div className="font-mono-ui text-4xl font-semibold text-[var(--ink)]">({result.a}, {result.b}, {result.c})</div>
          <div className="mt-2 text-sm text-[var(--ink-dim)]">{t("Specificity score", "ពិន្ទុអាទិភាព")}: {result.score}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded bg-[var(--gold)]/10 px-2 py-1.5 text-[var(--gold)]">
              {t("IDs", "ID")}: {result.a}
            </div>
            <div className="rounded bg-[var(--gold)]/10 px-2 py-1.5 text-[var(--gold)]">
              {t("Classes", "Class")}: {result.b}
            </div>
            <div className="rounded bg-[var(--gold)]/10 px-2 py-1.5 text-[var(--gold)]">
              {t("Elements", "ធាតុ")}: {result.c}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-faint)]">{t("Enter a selector.", "សូមបញ្ចូល selector។")}</p>
      )}
    </ToolShell>
  );
}
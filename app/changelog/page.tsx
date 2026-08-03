import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BASE_URL } from "@/lib/site";
import { toolHref } from "@/lib/toolRoutes";
import { CATEGORY_META, TOOLS, type ToolDef } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Changelog — 123 Toolbox",
  description: "A chronological archive of new tools and updates in 123 Toolbox. បញ្ជីឧបករណ៍ថ្មី និងការអាប់ដេត។",
  alternates: { canonical: `${BASE_URL}/changelog` },
};

function formatDate(date: string) {
  const d = date.includes("T") ? new Date(date) : new Date(`${date}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(d);
}

const toolsByDate = new Map<string, ToolDef[]>();
for (const tool of TOOLS) {
  if (!tool.addedOn) continue;
  // Group by date only, regardless of timestamp precision
  const dateKey = tool.addedOn.slice(0, 10);
  toolsByDate.set(dateKey, [...(toolsByDate.get(dateKey) ?? []), tool]);
}
const changelogGroups = [...toolsByDate.entries()].sort(([a], [b]) => b.localeCompare(a));

export default function ChangelogPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
      >
        <ArrowLeft size={15} /> Back to tools / ត្រឡប់ទៅឧបករណ៍
      </Link>

      <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
        Changelog <span className="font-khmer text-2xl">/ កំណត់ហេតុនៃការអាប់ដេត</span>
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">
        New tools and notable updates to 123 Toolbox. / ឧបករណ៍ថ្មី និងការអាប់ដេតសំខាន់ៗរបស់ 123 Toolbox។
      </p>

      <div className="mt-10 space-y-10">
        {changelogGroups.map(([date, tools]) => (
          <section key={date}>
            <h2 className="border-b border-[var(--ground-line)] pb-2 font-display text-lg font-medium text-[var(--ink)]">
              <time dateTime={date}>{formatDate(date)}</time>
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {tools.map((tool) => {
                const category = CATEGORY_META[tool.category];
                return (
                  <Link
                    key={tool.id}
                    href={toolHref(tool.id)}
                    className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
                  >
                    <p className="font-medium text-[var(--ink)]">{tool.title}</p>
                    {tool.khmerTitle && <p className="mt-0.5 text-sm text-[var(--ink-dim)]">{tool.khmerTitle}</p>}
                    <p className="mt-2 text-xs text-[var(--ink-faint)]">{category.label} / {category.khmer}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

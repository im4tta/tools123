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

const parseTs = (s: string) =>
  new Date(s.includes("T") ? s : `${s}T00:00:00+07:00`).getTime();

const toolsByDate = new Map<string, ToolDef[]>();
for (const tool of TOOLS) {
  if (!tool.addedOn) continue;
  // Group by date only, regardless of timestamp precision
  const dateKey = tool.addedOn.slice(0, 10);
  toolsByDate.set(dateKey, [...(toolsByDate.get(dateKey) ?? []), tool]);
}
// Newest first within each date, independent of the TOOLS array order.
const changelogGroups = [...toolsByDate.entries()]
  .map(([date, tools]) => [date, [...tools].sort((a, b) => parseTs(b.addedOn as string) - parseTs(a.addedOn as string))] as const)
  .sort(([a], [b]) => b.localeCompare(a));

/** Changes to the app itself (not new tools), newest first. Bilingual, statically rendered. */
const SITE_UPDATES: { date: string; en: string; km: string }[] = [
  {
    date: "2026-11-11",
    en: "Header controls moved: accent colour, home page design, About & shortcuts, and \"Clear all app data\" (now with an in-page confirmation and an \"Export my data\" backup) are in the new Settings sheet (gear button).",
    km: "ការផ្លាស់ប្ដូរប៊ូតុងខាងលើ៖ ពណ៌ប្រធានបទ ការរចនាទំព័រដើម អំពី និងគ្រាប់ចុចផ្លូវកាត់ និង \"លុបទិន្នន័យកម្មវិធីទាំងអស់\" (ឥឡូវមានការបញ្ជាក់នៅលើទំព័រ និងការ \"នាំចេញទិន្នន័យរបស់ខ្ញុំ\" ជាបម្រុងទុក) ស្ថិតនៅក្នុងផ្ទាំងការកំណត់ថ្មី (ប៊ូតុងស្ពឺ)។",
  },
  {
    date: "2026-11-11",
    en: "Easier to read and to use by keyboard: stronger text and border contrast, a visible focus ring, file pickers that open from the keyboard, and a light theme by default for first-time visitors.",
    km: "អានងាយ និងប្រើដោយក្ដារចុចបានងាយជាងមុន៖ ពណ៌អក្សរ និងស៊ុមកាន់តែច្បាស់ ស៊ុមបង្ហាញការផ្ដោតច្បាស់ ប្រអប់ជ្រើសឯកសារបើកបានពីក្ដារចុច និងផ្ទៃភ្លឺជាលំនាំដើមសម្រាប់អ្នកចូលលើកដំបូង។",
  },
];

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

      <section className="mt-10">
        <h2 className="border-b border-[var(--ground-line)] pb-2 font-display text-lg font-medium text-[var(--ink)]">
          Site updates <span className="font-khmer text-base">/ ការអាប់ដេតគេហទំព័រ</span>
        </h2>
        <ul className="mt-4 space-y-3">
          {SITE_UPDATES.map((update) => (
            <li key={update.en} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm">
              <time dateTime={update.date} className="text-xs text-[var(--ink-faint)]">{formatDate(update.date)}</time>
              <p className="mt-1 text-[var(--ink)]">{update.en}</p>
              <p lang="km" className="mt-1 font-khmer leading-relaxed text-[var(--ink-dim)]">{update.km}</p>
            </li>
          ))}
        </ul>
      </section>

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

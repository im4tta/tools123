import type { Category, ToolDef } from "@/lib/tools";

export interface ToolPlugin<Result = unknown> {
  id: string;
  metadata: { title: string; khmerTitle?: string; category: Category; keywords: string[] };
  aliases?: string[];
  calculate?: (input: unknown) => Result;
  resultCards?: (result: Result) => unknown[];
  seo?: { description?: string; descriptionKm?: string };
  docs?: string;
  tests?: string;
}

export function defineToolPlugin<Result>(plugin: ToolPlugin<Result>): ToolPlugin<Result> {
  return plugin;
}

/** Adapt plugin metadata to the existing registry without changing URL rules. */
export function pluginToToolDef(plugin: ToolPlugin): Pick<ToolDef, "id" | "title" | "khmerTitle" | "category" | "keywords"> {
  return { id: plugin.id, title: plugin.metadata.title, khmerTitle: plugin.metadata.khmerTitle, category: plugin.metadata.category, keywords: plugin.metadata.keywords };
}

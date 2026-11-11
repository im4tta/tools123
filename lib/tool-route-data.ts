import { recommendationsFor } from "@/lib/recommendations";
import { TOOL_RESIDENCY, type ResidencyKind } from "@/lib/tool-residency";
import { CATEGORY_META, TOOLS, type ToolDef } from "@/lib/tools";

/**
 * What a tool page's client component needs from the registry, computed on the server (at build
 * time — tool pages are statically generated) so the 906-entry registry stays out of the page's
 * JavaScript. See app/[toolId]/page.tsx and components/ToolRouteClient.tsx.
 */
export type ToolRouteTool = Pick<ToolDef, "id" | "title" | "khmerTitle" | "category" | "module" | "props"> & {
  /** Category name for the breadcrumb (English, Khmer). */
  categoryLabel: string;
  categoryKhmer: string;
  /** From the generated network audit (lib/tool-residency.ts); absent when the tool is not listed. */
  residency?: ResidencyKind;
};

export type RelatedTool = { id: string; title: string; khmerTitle?: string; reason: string; reasonKm?: string };

export function toToolRouteTool(tool: ToolDef): ToolRouteTool {
  const meta = CATEGORY_META[tool.category];
  const residency = TOOL_RESIDENCY[tool.id]?.kind;
  return {
    id: tool.id,
    title: tool.title,
    khmerTitle: tool.khmerTitle,
    category: tool.category,
    module: tool.module,
    categoryLabel: meta.label,
    categoryKhmer: meta.khmer,
    ...(residency ? { residency } : {}),
    ...(tool.props ? { props: tool.props } : {}),
  };
}

/** Configured recommendations, else up to six tools sharing the category or keywords. */
export function relatedToolsFor(tool: ToolDef): RelatedTool[] {
  const configured = recommendationsFor(tool.id).flatMap((rec) => {
    const target = TOOLS.find((candidate) => candidate.id === rec.id);
    return target ? [{ id: target.id, title: target.title, khmerTitle: target.khmerTitle, reason: rec.reason, reasonKm: rec.reasonKm }] : [];
  });
  if (configured.length > 0) return configured;
  return TOOLS
    .filter((candidate) => candidate.id !== tool.id)
    .map((candidate) => {
      const sharedKeywords = candidate.keywords.filter((keyword) => tool.keywords.includes(keyword)).length;
      return { tool: candidate, score: (candidate.category === tool.category ? 3 : 0) + sharedKeywords * 2 };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title))
    .slice(0, 6)
    .map(({ tool: related }) => ({ id: related.id, title: related.title, khmerTitle: related.khmerTitle, reason: "Shares a category or workflow", reasonKm: "មានប្រភេទ ឬលំហូរការងារដូចគ្នា" }));
}

export const TOOL_COUNT = TOOLS.length;

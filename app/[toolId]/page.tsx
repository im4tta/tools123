import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolRouteClient } from "@/components/ToolRouteClient";
import { TOOLS } from "@/lib/tools";
import { resolveToolId } from "@/lib/toolRoutes";

function findTool(slug: string) {
  const id = resolveToolId(slug);
  return TOOLS.find((tool) => tool.id === id);
}

export async function generateMetadata({ params }: { params: Promise<{ toolId: string }> }): Promise<Metadata> {
  const { toolId } = await params;
  const tool = findTool(toolId);
  return tool
    ? { title: `${tool.title}${tool.khmerTitle ? ` — ${tool.khmerTitle}` : ""} — 123 Toolbox`, description: `Free browser-based ${tool.title} tool. ឧបករណ៍អនឡាញឥតគិតថ្លៃ។` }
    : { title: "Tool not found / រកមិនឃើញឧបករណ៍ — 123 Toolbox" };
}

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = findTool(toolId);
  if (!tool) notFound();
  return <ToolRouteClient toolId={tool.id} />;
}

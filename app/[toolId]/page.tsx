import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolRouteClient } from "@/components/ToolRouteClient";
import { toolDescription, toolJsonLd, toolBreadcrumbLd, toolFaqLd, toolHowToLd } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { resolveToolId, toolHref } from "@/lib/toolRoutes";
import { BASE_URL, toolUrl } from "@/lib/site";

function findTool(slug: string) {
  const id = resolveToolId(slug);
  return TOOLS.find((tool) => tool.id === id);
}

export async function generateMetadata({ params }: { params: Promise<{ toolId: string }> }): Promise<Metadata> {
  const { toolId } = await params;
  const tool = findTool(toolId);
  if (!tool) return { title: "Tool not found / រកមិនឃើញឧបករណ៍ — 123 Toolbox" };

  const title = `${tool.title}${tool.khmerTitle ? ` — ${tool.khmerTitle}` : ""} — 123 Toolbox`;
  const description = toolDescription(tool);
  const url = toolUrl(tool.id);
  const href = toolHref(tool.id);
  return {
    title,
    description,
    keywords: [tool.title, ...(tool.khmerTitle ? [tool.khmerTitle] : []), ...tool.keywords],
    alternates: {
      canonical: url,
      languages: {
        "x-default": url,
        en: `${BASE_URL}/en${href}`,
        km: `${BASE_URL}/km${href}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "123 Toolbox",
      locale: "en_US",
      alternateLocale: "km_KH",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = findTool(toolId);
  if (!tool) notFound();
  const jsonLd = toolJsonLd(tool);
  const breadcrumbLd = toolBreadcrumbLd(tool);
  const faqLd = toolFaqLd(tool);
  const howToLd = toolHowToLd(tool);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }}
      />
      {howToLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd).replace(/</g, "\\u003c") }}
        />
      )}
      <ToolRouteClient toolId={tool.id} />
    </>
  );
}

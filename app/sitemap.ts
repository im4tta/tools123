import type { MetadataRoute } from "next";
import { BASE_URL, toolUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/changelog`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/acknowledgement`, changeFrequency: "yearly", priority: 0.2 },
    ...TOOLS.map((tool) => ({
      url: toolUrl(tool.id),
      ...(tool.addedOn ? { lastModified: new Date(tool.addedOn.includes("T") ? tool.addedOn : `${tool.addedOn}T00:00:00.000Z`) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

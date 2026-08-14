import { BASE_URL, toolUrl } from "@/lib/site";
import { CATEGORY_META, TOOLS } from "@/lib/tools";

export function GET() {
  const lines: string[] = [];
  lines.push("# 123 Toolbox");
  lines.push("");
  lines.push(
    "> Free browser-based tools for PDF, images, developers, designers, Khmer language, and everyday work. Everything runs locally in the browser."
  );
  lines.push("");
  lines.push(`Primary site: ${BASE_URL}`);
  lines.push("Languages: English (en), Khmer (km)");
  lines.push("");
  lines.push("## Tools");
  lines.push("");
  for (const tool of TOOLS) {
    const cat = CATEGORY_META[tool.category];
    lines.push(`- [${tool.title}](${toolUrl(tool.id)}): Free ${tool.title.toLowerCase()} tool (${cat.label})${tool.khmerTitle ? ` — ${tool.khmerTitle}` : ""}`);
  }
  lines.push("");
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

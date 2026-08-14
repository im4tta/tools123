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
  lines.push(
    "## MCP server (machine-callable tools)"
  );
  lines.push("");
  lines.push(
    "A standalone stdio MCP server (run `npm run mcp`) exposes these deterministic tools:"
  );
  lines.push(
    "- base64 — encode/decode text as Base64 (input: string, operation: encode|decode)"
  );
  lines.push(
    "- hash — md5/sha1/sha256/sha384/sha512 hash of text (input: string, algorithm)"
  );
  lines.push("- uuid — generate random UUID v4 (count: number)");
  lines.push("- url_encode — URL encode/decode (input: string, operation)");
  lines.push("- json_format — pretty-print/minify JSON (input: string, indent, minify)");
  lines.push("- case_convert — upper/lower/title/sentence case (input: string, mode)");
  lines.push("- word_count — count words/characters/lines (input: string)");
  lines.push("- khmer_digits — Arabic<->Khmer numerals (input: string, to: khmer|arabic)");
  lines.push("- slugify — URL slug, Khmer-safe (input: string, separator)");
  lines.push("- riel_usd — KHR<->USD at a supplied rate (amount, rate, direction)");
  lines.push("- unix_time — timestamp to ISO/unix/relative (value, format)");
  lines.push("");
  lines.push("## Tools");
  lines.push("");
  for (const tool of TOOLS) {
    const cat = CATEGORY_META[tool.category];
    const keywords = tool.keywords.slice(0, 6).join(", ");
    lines.push(`- [${tool.title}](${toolUrl(tool.id)}): Free ${tool.title.toLowerCase()} tool (${cat.label})${tool.khmerTitle ? ` — ${tool.khmerTitle}` : ""}. Inputs/outputs: ${keywords || "text"}.`);
  }
  lines.push("");
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

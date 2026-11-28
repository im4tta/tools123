// Pure helpers for the 123 Toolbox Telegram bot: command parsing, tool search and HTML-safe text.
// Kept free of path aliases and data imports so tests can load it with plain Node.

export interface BotTool {
  id: string;
  title: string;
  khmerTitle?: string;
  keywords: string[];
  category: string;
  addedOn?: string;
}

/** Telegram's HTML parse mode only needs these three escaped. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** "/find@MyBot merge pdf" -> { command: "find", args: "merge pdf" }; plain text -> command null. */
export function parseCommand(text: string): { command: string | null; args: string } {
  const m = text.trim().match(/^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if (!m) return { command: null, args: text.trim() };
  return { command: m[1].toLowerCase(), args: (m[2] ?? "").trim() };
}

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Tools ranked for a query: exact title, title start, word start in the title, then keyword and Khmer-title matches.
 * Every query word must appear somewhere in the tool's title, Khmer title or keywords.
 */
export function findTools<T extends BotTool>(tools: readonly T[], query: string, limit = 8): T[] {
  const q = fold(query);
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const scored: { tool: T; score: number }[] = [];
  for (const tool of tools) {
    const title = fold(tool.title);
    const km = fold(tool.khmerTitle ?? "");
    const keys = tool.keywords.map(fold);
    const hay = [title, km, ...keys].join(" | ");
    // Short words (qr, pdf, km) must start a word, so "qr" does not match "iqr".
    if (!words.every((w) => (w.length <= 3 ? ` ${hay.replace(/[^\p{L}\p{N}]+/gu, " ")}`.includes(` ${w}`) : hay.includes(w)))) continue;
    let score = 6;
    if (title === q || km === q) score = 0;
    else if (title.startsWith(q) || km.startsWith(q)) score = 1;
    else if (` ${title}`.includes(` ${q}`)) score = 2;
    else if (keys.some((k) => k === q)) score = 3;
    else if (keys.some((k) => k.startsWith(q)) || km.includes(q)) score = 4;
    else if (title.includes(q)) score = 5;
    scored.push({ tool, score });
  }
  scored.sort((a, b) => a.score - b.score || a.tool.title.length - b.tool.title.length || a.tool.title.localeCompare(b.tool.title));
  return scored.slice(0, limit).map((s) => s.tool);
}

/** Tools whose addedOn falls within the last `days` days before `now`, newest first. */
export function recentTools<T extends BotTool>(tools: readonly T[], now: Date, days: number): T[] {
  const since = now.getTime() - days * 86_400_000;
  return tools
    .filter((t) => t.addedOn && Date.parse(t.addedOn) >= since && Date.parse(t.addedOn) <= now.getTime())
    .sort((a, b) => Date.parse(b.addedOn as string) - Date.parse(a.addedOn as string));
}

/** A whole number written with digits, spaces or commas, up to 15 digits ("1,250,000" -> "1250000"). */
export function parseWholeNumber(text: string): string | null {
  const clean = text.replace(/[\s,]/g, "").replace(/[០-៩]/g, (d) => String(d.charCodeAt(0) - 0x17e0));
  return /^\d{1,15}$/.test(clean) ? clean : null;
}

/** Day of the year-long cycle used to pick "of the day" items: the same for everyone on a UTC+7 calendar day. */
export function cambodiaDay(now: Date): number {
  return Math.floor((now.getTime() + 7 * 3_600_000) / 86_400_000);
}

/* ------------------------------------------------------------------ rich text (Telegram HTML) */

/**
 * A two-column table in a monospace block (Telegram has no real tables). Put only Latin text and digits in the left
 * column: Khmer combining marks have no width in monospace, so they would break the alignment.
 */
export function table(rows: [string, string][]): string {
  const width = Math.max(...rows.map(([k]) => [...k].length));
  return `<pre>${rows.map(([k, v]) => `${escapeHtml(k.padEnd(width))}  ${escapeHtml(v)}`).join("\n")}</pre>`;
}

/** A quote block; `collapsed` shows the first lines with a tap-to-expand control. Inner text must already be HTML. */
export function quote(html: string, collapsed = false): string {
  return `<blockquote${collapsed ? " expandable" : ""}>${html}</blockquote>`;
}

/** A divider line that renders the same width on phones. */
export const RULE = "┈┈┈┈┈┈┈┈┈┈┈┈┈┈";

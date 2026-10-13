/**
 * Safe-HTML helpers for tools that build HTML strings and render them with dangerouslySetInnerHTML.
 * Every piece of user text that ends up inside such a string must pass through escapeHtml,
 * and every user-provided link target through safeUrl.
 */

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for use in HTML element content and quoted attribute values. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

const SAFE_SCHEMES = ["http:", "https:", "mailto:"];

/**
 * Returns the URL if it is relative or uses http(s)/mailto, otherwise "#". Blocks
 * javascript:, data:, vbscript: and similar, including variants hidden with whitespace or
 * control characters (which browsers strip before reading the scheme).
 */
export function safeUrl(url: string): string {
  // Browsers ignore ASCII whitespace and control characters anywhere in the scheme.
  const compact = url.replace(/[\u0000- \u007f]/g, "");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1];
  if (!scheme) return url.trim();
  return SAFE_SCHEMES.includes(`${scheme.toLowerCase()}:`) ? url.trim() : "#";
}

/**
 * Lightweight Markdown → HTML for the Markdown Previewer: headings, bold, italic, inline code,
 * lists and links. The source is escaped first and link targets go through safeUrl, so the
 * result is safe to render with dangerouslySetInnerHTML.
 */
export function markdownToSafeHtml(md: string): string {
  return escapeHtml(md)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text: string, url: string) => `<a href="${safeUrl(url)}" rel="noopener noreferrer">${text}</a>`)
    .split(/\n{2,}/)
    .map((block) => (/^<h[1-3]>|^<ul>/.test(block) ? block : `<p>${block}</p>`))
    .join("\n");
}

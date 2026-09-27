/**
 * After a deploy, a tab opened on the previous build can ask for JS chunks that no longer exist.
 * Those failures are recoverable with one full reload (the new HTML points at the new chunks);
 * the timestamp guard stops a genuinely broken chunk from causing a reload loop.
 */
const RELOAD_KEY = "toolbox123:chunk-reload-at";
const MIN_RELOAD_GAP_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  const text = `${typeof name === "string" ? name : ""} ${typeof message === "string" ? message : ""}`;
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text);
}

/** Reloads the page unless it was already reloaded for a chunk error moments ago. Returns whether it reloads. */
export function reloadOnceForChunkError(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < MIN_RELOAD_GAP_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode quirks) — still try one reload.
  }
  window.location.reload();
  return true;
}

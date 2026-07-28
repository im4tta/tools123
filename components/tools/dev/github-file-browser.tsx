"use client";
import { useState } from "react";
import { Folder, File as FileIcon, Download, ArrowUp, Loader2 } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Entry {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  download_url: string | null;
}

export default function GithubFileBrowser() {
  const [repo, setRepo] = useToolState("github-file-browser:repo", "im4tta/gitget");
  const [branch, setBranch] = useToolState("github-file-browser:branch", "");
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load(nextPath: string) {
    const cleaned = repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!cleaned.includes("/")) {
      setError("Enter a repo as owner/name (e.g. im4tta/gitget)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const url = `https://api.github.com/repos/${cleaned}/contents/${nextPath}${branch.trim() ? `?ref=${encodeURIComponent(branch.trim())}` : ""}`;
      const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `GitHub API error (${res.status})`);
      }
      const data = await res.json();
      const list: Entry[] = (Array.isArray(data) ? data : [data]).map((d) => ({
        name: d.name,
        path: d.path,
        type: d.type === "dir" ? "dir" : "file",
        size: d.size ?? 0,
        download_url: d.download_url ?? null,
      }));
      list.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
      setEntries(list);
      setPath(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repo contents");
      setEntries(null);
    } finally {
      setBusy(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <ToolShell
      title="GitHub Repo File Browser"
      description="Browse any public GitHub repo's file tree and grab individual files without cloning the whole thing — calls the public GitHub API directly from your browser."
    >
      <Row>
        <Field label="Repository" hint="owner/name"><TextInput value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/name" /></Field>
        <Field label="Branch (optional)"><TextInput value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" /></Field>
      </Row>
      <Button onClick={() => load("")} disabled={busy}>
        {busy ? <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Loading…</span> : "Browse"}
      </Button>

      {error && (
        <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-3 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {entries && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            <span>/{path}</span>
            {path && (
              <button
                type="button"
                onClick={() => load(path.split("/").slice(0, -1).join("/"))}
                className="inline-flex items-center gap-1 normal-case text-[var(--ink-dim)] hover:text-[var(--ink)]"
              >
                <ArrowUp size={12} /> up
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
            {entries.map((e) => (
              <div
                key={e.path}
                className="flex items-center justify-between gap-3 border-t border-[var(--ground-line)] px-3 py-2 text-sm first:border-t-0"
              >
                <button
                  type="button"
                  disabled={e.type === "file"}
                  onClick={() => e.type === "dir" && load(e.path)}
                  className={`flex min-w-0 flex-1 items-center gap-2 text-left ${e.type === "dir" ? "text-[var(--ink)] hover:text-[var(--gold)]" : "text-[var(--ink-dim)]"}`}
                >
                  {e.type === "dir" ? <Folder size={14} className="shrink-0" /> : <FileIcon size={14} className="shrink-0" />}
                  <span className="truncate">{e.name}</span>
                </button>
                {e.type === "file" && (
                  <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--ink-faint)]">
                    <span>{formatSize(e.size)}</span>
                    {e.download_url && (
                      <a href={e.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--ink-dim)] hover:text-[var(--gold)]">
                        <Download size={13} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
            {entries.length === 0 && <div className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">Empty directory</div>}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

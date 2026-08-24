"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

// Live source: im4tta/khlyrics — Khmer song lyrics database (github.com/im4tta/khlyrics).
// The index is fetched from the GitHub API and each lyric file from raw.githubusercontent;
// nothing is bundled into this repo and no data is invented here.
const REPO = "im4tta/khlyrics";
const INDEX_URL = `https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/`;

type LyricFile = { path: string; name: string; artist: string; title: string };

function parseName(path: string): { artist: string; title: string } {
  const file = path.split("/").pop() ?? path;
  const base = file.replace(/\.(txt|srt)$/i, "");
  // Typical naming: "Artist - Title" or "Artist" alone.
  const dash = base.indexOf(" - ");
  if (dash > 0) {
    const artist = base.slice(0, dash).trim();
    const title = base.slice(dash + 3).trim();
    return { artist, title: title || artist };
  }
  return { artist: base, title: base };
}

function cleanLyrics(text: string): string {
  // Strip leading timestamps [mm:ss.xx] and empty leader lines.
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*/, "").replace(/\r$/, ""))
    .filter((l) => l.trim().length > 0)
    .join("\n")
    .trim();
}

export default function KhmerLyricsBrowser() {
  const { text: t } = useLanguage();
  const [files, setFiles] = useState<LyricFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>("");
  const [lyricLoading, setLyricLoading] = useState(false);
  const [lyricError, setLyricError] = useState("");

  // Load the index of .txt/.srt lyric files from the khlyrics repo (GitHub API).
  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(INDEX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ tree?: { path: string }[] }>;
      })
      .then((json) => {
        if (!alive) return;
        const list = (json.tree ?? [])
          .filter((x) => x.path.startsWith("txt/") && x.path.endsWith(".txt"))
          .map((x) => {
            const { artist, title } = parseName(x.path);
            return { path: x.path, name: title, artist, title };
          })
          .filter((f) => f.title.length > 0)
          .sort((a, b) => a.artist.localeCompare(b.artist));
        setFiles(list);
        if (list.length > 0) setSelected(list[0].path);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the lyrics index.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Fetch the selected lyric file's content.
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLyricLoading(true);
    setLyricError("");
    setLyrics("");
    fetch(RAW_BASE + selected.split("/").map((p) => encodeURIComponent(p)).join("/"))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((raw) => {
        if (alive) setLyrics(cleanLyrics(raw));
      })
      .catch((e) => {
        if (alive) setLyricError(e instanceof Error ? e.message : "Could not load this lyric.");
      })
      .finally(() => {
        if (alive) setLyricLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return files;
    return files.filter(
      (f) => f.title.toLocaleLowerCase().includes(needle) || f.artist.toLocaleLowerCase().includes(needle),
    );
  }, [files, query]);

  const active = selected ? files.find((f) => f.path === selected) : null;

  return (
    <ToolShell
      title="Khmer Song Lyrics Browser"
      khmerTitle="អ្នកអានខ្លឹមសារបទចម្រៀងខ្មែរ"
      description="Browse and read real Khmer song lyrics from the khlyrics database — title and artist index, bilingual search, and a copy-ready view."
      descriptionKm="ស្វែងរក និងអានខ្លឹមសារបទចម្រៀងខ្មែរពិតប្រាកដពីមូលដ្ឋានទិន្នន័យ khlyrics — លិបិក្រមតាមចំណងជើង និងអ្នកចម្រៀង ការស្វែងរកទ្វេភាសា និងទិដ្ឋភាពអាន។"
    >
      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Live data: the song index and each lyric are fetched from the public khlyrics repository (github.com/im4tta/khlyrics). Nothing is stored or invented here.", "ទិន្នន័យផ្ទាល់៖ លិបិក្រមបទចម្រៀង និងខ្លឹមសារនីមួយៗ ត្រូវបានទាញយកពីឃ្លាំង khlyrics សាធារណៈ (github.com/im4tta/khlyrics)។ មិនមានអ្វីរក្សាទុក ឬបង្កើតនៅទីនេះទេ។")}{" "}
        <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
          {t("khlyrics", "khlyrics")} <ExternalLink size={10} className="inline" />
        </a>
      </p>

      <Field label={t("Search", "ស្វែងរក")}>
        <TextInput type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search title or artist…", "ស្វែងរកចំណងជើង ឬអ្នកចម្រៀង…")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Songs", "បទចម្រៀង")}>
          <div className="flow-root max-h-80 overflow-y-auto rounded-md border border-[var(--ground-line)]">
            {loading && <p className="px-3 py-6 text-center text-sm text-[var(--ink-faint)]"><Loader2 size={14} className="mr-1 inline animate-spin" />{t("Loading index…", "កំពុងផ្ទុកលិបិក្រម…")}</p>}
            {error && <p className="px-3 py-6 text-center text-sm text-[var(--danger)]">{error}</p>}
            {!loading && !error && filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-[var(--ink-faint)]">{t("No songs match.", "គ្មានបទចម្រៀងដែលត្រូវគ្នា។")}</p>}
            {filtered.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setSelected(f.path)}
                lang="km"
                className={`flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--ground-line)] ${selected === f.path ? "bg-[var(--ground-line)]" : ""}`}
              >
                <span className="truncate text-[var(--ink)]">{f.title}</span>
                <span className="shrink-0 text-xs text-[var(--ink-faint)]">{f.artist}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={t("Lyrics", "ខ្លឹមសារ")}>
          <div className="rounded-md border border-[var(--ground-line)]">
            {lyricLoading && <p className="flex items-center justify-center gap-2 px-3 py-10 text-sm text-[var(--ink-faint)]"><Loader2 size={14} className="animate-spin" />{t("Loading…", "កំពុងផ្ទុក…")}</p>}
            {!lyricLoading && lyricError && <p className="px-3 py-8 text-center text-sm text-[var(--danger)]">{lyricError}</p>}
            {!lyricLoading && !lyricError && active && (
              <div className="p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {active.title} — {active.artist}
                </div>
                <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words font-khmer leading-relaxed text-[var(--ink)]">{lyrics}</pre>
              </div>
            )}
          </div>
        </Field>
      </div>

      <p className="text-[11px] text-[var(--ink-faint)]">
        {t("Dataset credit: im4tta/khlyrics. Lyrics are the property of their respective artists and are shown here only as a reference to the public database.", "ក្រេឌីតទិន្នន័យ៖ im4tta/khlyrics។ ខ្លឹមសារបទចម្រៀងគឺជាកម្មសិទ្ធិរបស់សិល្បកររៀងៗខ្លួន ហើយត្រូវបានបង្ហាញនៅទីនេះគ្រាន់តែជាការយោងទៅមូលដ្ឋានទិន្នន័យសាធារណៈប៉ុណ្ណោះ។")}
      </p>
    </ToolShell>
  );
}

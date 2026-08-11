"use client";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface ProjectEntry {
  name: string;
  category: "Data & Scraping" | "Civic & Public Data" | "Infrastructure" | "Payments" | "Design & Assets" | "Web & Community";
  desc: string;
  url: string;
  author: string;
}

const PROJECTS: ProjectEntry[] = [
  { name: "khmerfox", category: "Data & Scraping", desc: "Compact Cambodia-focused Google Maps scraper powered by Camoufox, built for Khmer/English business listings.", url: "https://pypi.org/project/khmerfox/", author: "im4tta" },
  { name: "latlng", category: "Civic & Public Data", desc: "Utilities for working with latitude/longitude data, useful for Cambodia geodata pipelines.", url: "https://github.com/seanghay/latlng", author: "seanghay" },
  { name: "network-operators", category: "Civic & Public Data", desc: "Reference data on Cambodian telecom network operators and number prefixes.", url: "https://github.com/seanghay/network-operators", author: "seanghay" },
  { name: "mefapibot", category: "Civic & Public Data", desc: "A Telegram bot providing real-time public data from Cambodia.", url: "https://github.com/im4tta/mefapibot", author: "im4tta" },
  { name: "mapkh", category: "Civic & Public Data", desc: "Cambodia geodata and mapping infrastructure project.", url: "https://github.com/im4tta/mapkh", author: "im4tta" },
  { name: "pp3d", category: "Civic & Public Data", desc: "3D mapping/visualization project centered on Phnom Penh.", url: "https://github.com/im4tta/pp3d", author: "im4tta" },
  { name: "payway-js", category: "Payments", desc: "JavaScript SDK/wrapper for integrating with the PayWay payment gateway used in Cambodia.", url: "https://github.com/seanghay/payway-js", author: "seanghay" },
  { name: "CSB (Cambodia Sovereign Blockchain)", category: "Infrastructure", desc: "An exploration of a sovereign hybrid blockchain concept — public within a country, private to the world — using Cambodia as the design case.", url: "https://github.com/sengtha/CSB", author: "sengtha" },
  { name: "Normsar-Silo", category: "Infrastructure", desc: "Self-hosted, decentralized data node for Normsar Sovereign Messaging; deploy your own Silo for data sovereignty.", url: "https://github.com/sengtha/Normsar-Silo", author: "sengtha" },
  { name: "Normsar-DO", category: "Infrastructure", desc: "Cloudflare Durable Object powering real-time chat for the Normsar Hub & Silo, with Supabase auth.", url: "https://github.com/sengtha/Normsar-DO", author: "sengtha" },
  { name: "Tinaney-Silo", category: "Infrastructure", desc: "A Silo node variant within the Normsar sovereign-data ecosystem.", url: "https://github.com/sengtha/Tinaney-Silo", author: "sengtha" },
  { name: "Kareya-Silo", category: "Infrastructure", desc: "Another Silo node variant within the Normsar sovereign-data ecosystem.", url: "https://github.com/sengtha/Kareya-Silo", author: "sengtha" },
  { name: "zk-vault-react", category: "Infrastructure", desc: "Zero-knowledge dual-envelope end-to-end encryption for React; unlock with a passcode or hardware passkey.", url: "https://github.com/sengtha/zk-vault-react", author: "sengtha" },
  { name: "iAny", category: "Infrastructure", desc: "Feed AI from anything, entirely offline and on-device — grows smarter the more you feed it.", url: "https://github.com/sengtha/iAny", author: "sengtha" },
  { name: "gitget", category: "Web & Community", desc: "Tool for browsing and downloading individual files from GitHub repos without cloning.", url: "https://github.com/im4tta/gitget", author: "im4tta" },
  { name: "getfont", category: "Design & Assets", desc: "Utility for fetching and managing web fonts, including Khmer typefaces.", url: "https://github.com/im4tta/getfont", author: "im4tta" },
  { name: "vector-drawable-svg", category: "Design & Assets", desc: "Converts Android vector drawables to SVG format.", url: "https://github.com/seanghay/vector-drawable-svg", author: "seanghay" },
  { name: "Sralify", category: "Web & Community", desc: "A Khmer-focused web project from the Rues developer community.", url: "https://github.com/im4tta/Sralify", author: "im4tta" },
  { name: "whovswho", category: "Web & Community", desc: "A comparison/lookup tool project.", url: "https://github.com/im4tta/whovswho", author: "im4tta" },
  { name: "khmercoders-web", category: "Web & Community", desc: "Web presence for the Khmer Coders developer community.", url: "https://github.com/seanghay/khmercoders-web", author: "seanghay" },
  { name: "sone", category: "Web & Community", desc: "A general-purpose project from the Khmer Coders ecosystem.", url: "https://github.com/seanghay/sone", author: "seanghay" },
  { name: "sosap", category: "Web & Community", desc: "A utility project by an active Cambodian open-source developer.", url: "https://github.com/seanghay/sosap", author: "seanghay" },
  { name: "Share2SSH", category: "Infrastructure", desc: "Tool for sharing terminal/SSH sessions.", url: "https://github.com/seanghay/Share2SSH", author: "seanghay" },
  { name: "editate", category: "Data & Scraping", desc: "Editing/annotation utility project.", url: "https://github.com/seanghay/editate", author: "seanghay" },
  { name: "uvr", category: "Data & Scraping", desc: "Utility related to audio source/vocal separation (UVR-style tooling).", url: "https://github.com/seanghay/uvr", author: "seanghay" },
  { name: "bookmebus-sentiment-analysis", category: "Data & Scraping", desc: "Sentiment analysis applied to BookMeBus (Cambodia bus booking) customer reviews.", url: "https://github.com/seanghay/bookmebus-sentiment-analysis", author: "seanghay" },
  { name: "Komsan-Page", category: "Web & Community", desc: "A personal/portfolio-style web page project.", url: "https://github.com/sengtha/Komsan-Page", author: "sengtha" },
  { name: "Rues (ឫស)", category: "Web & Community", desc: "A developer/repository tracker for the Cambodian open-source ecosystem — this directory is built from its exports.", url: "https://github.com/im4tta/rues", author: "im4tta" },
];

const CATEGORIES = ["All", "Data & Scraping", "Civic & Public Data", "Infrastructure", "Payments", "Design & Assets", "Web & Community"] as const;

export default function DevProjectDirectory() {
  const [cat, setCat] = useToolState<(typeof CATEGORIES)[number]>("dev-project-directory:cat", "All");
  const [query, setQuery] = useToolState("dev-project-directory:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      const matchesCat = cat === "All" || p.category === cat;
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [cat, query]);

  return (
    <ToolShell
      title="Cambodia Open-Source Project Directory"
      khmerTitle="ថតគម្រោងបើកចំហកម្ពុជា"
      description="A browsable directory of open-source tools and libraries built by Cambodian developers — scraping, civic/public data, payments, and infrastructure. Not exhaustive; a starting map of the local ecosystem."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category">
          <Select value={cat} onChange={(e) => setCat(e.target.value as (typeof CATEGORIES)[number])}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Search">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Project name, author, keyword…" />
        </Field>
      </div>
      <div className="space-y-2">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-faint)]">No projects match that filter.</div>
        )}
        {results.map((p) => (
          <div key={p.name} className="flex items-start gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm transition hover:border-[var(--gold-dim)]">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <div className="font-medium text-[var(--ink)]">{p.name}</div>
              <div className="mt-0.5 text-xs text-[var(--ink-dim)]">{p.desc}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{p.category} · @{p.author}</div>
            </a>
            <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
              <CopyButton compact text={`${p.name}\n${p.desc}\n${p.url}`}
                fields={[
                  { id: "name", label: "Name", getValue: p.name },
                  { id: "desc", label: "Description", getValue: p.desc },
                  { id: "url", label: "URL", getValue: p.url },
                  { id: "category", label: "Category", getValue: p.category },
                  { id: "author", label: "Author", getValue: p.author },
                ]}
              />
              <ExternalLink size={14} className="text-[var(--ink-faint)]" />
            </div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

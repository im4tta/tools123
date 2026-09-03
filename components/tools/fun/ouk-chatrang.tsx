"use client";

/**
 * Ouk Chatrang — Cambodian Chess
 *
 * Source & Credits
 * ────────────────
 * Rules engine, AI (alpha-beta minimax), 3D rendering, and UI are an
 * original AI-assisted implementation of Ouk Chatrang (អុកចត្រង្គ), the
 * traditional Cambodian variant of chess recognised by the World Chess
 * Federation (FIDE).
 *
 * Provenance status : ai-assisted
 * Rules reference   : https://www.worldchess.com/rules-cambodian-chess/
 *                     https://en.wikipedia.org/wiki/Ouk_Chatrang
 * Three.js          : https://threejs.org  (MIT licence)
 *
 * Adapted for 123 Toolbox by wrapping in ToolShell, using the shared
 * useLanguage / storage helpers, and dynamically importing Three.js.
 */

import dynamic from "next/dynamic";
import { Crown } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";

// ── Source & Credits panel shown inside the tool ────────────────────
function SourceCredits() {
  return (
    <details className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-xs text-[var(--ink-dim)]">
      <summary className="cursor-pointer select-none font-medium text-[var(--ink)]">
        Source &amp; Credits / ប្រភព និងកិត្តិយស
      </summary>
      <ul className="mt-2 space-y-1 leading-relaxed">
        <li>
          <b>Provenance:</b> AI-assisted original implementation of Ouk
          Chatrang rules.
        </li>
        <li>
          <b>Rules reference:</b>{" "}
          <a
            href="https://en.wikipedia.org/wiki/Ouk_Chatrang"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Wikipedia — Ouk Chatrang
          </a>
          ,{" "}
          <a
            href="https://www.worldchess.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            FIDE / World Chess
          </a>
        </li>
        <li>
          <b>3D rendering:</b>{" "}
          <a
            href="https://threejs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Three.js
          </a>{" "}
          (MIT Licence)
        </li>
      </ul>
    </details>
  );
}

// ── Dynamic import — Three.js is heavy; load only when this tool mounts ─
const OukChatrangGame = dynamic(() => import("./_ouk-chatrang-game"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]">
      <Crown className="animate-pulse text-[var(--gold)]" size={32} />
      <p className="text-sm text-[var(--ink-faint)]">Loading Ouk Chatrang… / កំពុងផ្ទុក…</p>
    </div>
  ),
});

export default function OukChatrang() {
  return (
    <ToolShell
      title="Ouk Chatrang"
      khmerTitle="អុកចត្រង្គ"
      description="Play Cambodia's traditional chess — Ouk Chatrang — against the computer or a friend. Full Cambodian rules including the Fish promotion, Queen leap, and King's first-move jump."
      descriptionKm="លេងអុកចត្រង្គ — ហ្គេមអុកប្រពៃណីខ្មែរ — ទល់នឹងកុំព្យូទ័រ ឬមិត្ត។ ក្បួនខ្មែរពេញលេញ រួមមានការបក្សត្រី ការលោតនាង និងការលោតស្តេចលើកទី១។"
    >
      <OukChatrangGame />
      <SourceCredits />
    </ToolShell>
  );
}

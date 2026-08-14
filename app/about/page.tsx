import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BASE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — 123 Toolbox",
  description:
    "About 123 Toolbox: a free, browser-based collection of tools for PDFs, images, developers, and the Khmer language. Built in Cambodia, running entirely in your browser.",
  alternates: { canonical: `${BASE_URL}/about` },
};

const ABOUT_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About 123 Toolbox",
  url: `${BASE_URL}/about`,
  mainEntity: {
    "@type": "Organization",
    name: "123 Toolbox",
    url: BASE_URL,
    description:
      "A free, browser-based collection of tools for PDFs, images, developers, designers, and the Khmer language.",
    foundingLocation: "Cambodia",
    sameAs: ["https://github.com/im4tta/tools123"],
  },
}).replace(/</g, "\\u003c");

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ABOUT_JSON_LD }} />
      <Link href="/" className="mb-8 flex items-center gap-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
        <ArrowLeft size={15} /> Back to tools
      </Link>

      <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">About 123 Toolbox</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-[var(--ink-dim)]">
        <p>
          123 Toolbox is a free collection of hundreds of browser-based tools for PDFs, images,
          developers, designers, and the Khmer language. Everything runs in your browser — files
          and text are processed locally on your device and are not uploaded to a server.
        </p>
        <p>
          The project was started in Cambodia to give Khmer-speaking users practical, offline-friendly
          utilities — PDF editing, QR codes, Khmer digit conversion, address formatting, government
          reference data, and much more — without signing up, installing software, or paying.
        </p>
        <p>
          The interface supports English, Khmer, and a bilingual mode. Much of the code was written
          with AI assistance, so tools are verified against their documented formulas and sources
          before they are trusted for important work.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Principles</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink-dim)]">
          <li><strong className="text-[var(--ink)]">Private by design</strong> — your files never leave your browser.</li>
          <li><strong className="text-[var(--ink)]">Free</strong> — no accounts, no paywalls, no hidden costs.</li>
          <li><strong className="text-[var(--ink)]">Honest</strong> — estimates, fallback data, and AI-assisted work are clearly labeled.</li>
          <li><strong className="text-[var(--ink)]">Open source</strong> — the full code is public on GitHub.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Links</h2>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a href="https://github.com/im4tta/tools123" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline hover:text-[var(--gold-dim)]">
            Source on GitHub
          </a>
          <a href="https://buymeacoffee.com/thebmeta" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline hover:text-[var(--gold-dim)]">
            Support the project
          </a>
          <Link href="/acknowledgement" className="text-[var(--gold)] underline hover:text-[var(--gold-dim)]">
            Acknowledgements
          </Link>
        </div>
      </section>
    </main>
  );
}

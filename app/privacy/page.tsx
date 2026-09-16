import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BASE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy & Cookies — 123 Toolbox",
  description:
    "How 123 Toolbox handles your data: tools run in your browser, one functional language cookie, cookieless analytics, and local storage for your settings. No accounts, no tracking, no selling of data.",
  alternates: { canonical: `${BASE_URL}/privacy` },
};

const PRIVACY_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy & Cookies — 123 Toolbox",
  url: `${BASE_URL}/privacy`,
  description:
    "Privacy and cookies information for 123 Toolbox: local-only processing, one functional language cookie, cookieless analytics, and browser local storage.",
}).replace(/</g, "\\u003c");

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PRIVACY_JSON_LD }} />
      <Link href="/" className="mb-8 flex items-center gap-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
        <ArrowLeft size={15} /> Back to tools
      </Link>

      <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">Privacy &amp; Cookies</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-[var(--ink-dim)]">
        <p>
          123 Toolbox is built to be private by default. The tools run entirely in your browser —
          the files, text, and images you work with are processed on your device and are{" "}
          <strong className="text-[var(--ink)]">not uploaded to our servers</strong>. There are no
          accounts, no logins, and we do not sell or share your data.
        </p>
        <p>
          This page describes what the site stores and the few third parties it contacts. It is
          general information, not legal advice.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Cookies</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          The site uses a single, strictly functional cookie:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink-dim)]">
          <li>
            <strong className="text-[var(--ink)]">tb-locale</strong> — remembers your language
            (English or Khmer) so the right version of a page can be served on your next visit. It
            stores only <code>en</code> or <code>km</code>, lasts up to one year, and contains no
            personal data or tracking identifier.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          We do not use advertising cookies or cross-site tracking cookies.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Analytics</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          We use <strong className="text-[var(--ink)]">Vercel Web Analytics</strong> to understand
          which tools are used, in aggregate. By its design it is{" "}
          <strong className="text-[var(--ink)]">cookieless</strong> and does not store persistent
          personal identifiers about you.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Local storage on your device</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          To make the tools convenient, the site keeps some settings in your browser&apos;s local
          storage. This stays on your device, is never sent to a server, and you can clear it any
          time from your browser settings. It includes things like:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink-dim)]">
          <li>your language / bilingual mode preference;</li>
          <li>per-tool settings and recently used values so a tool reopens where you left off;</li>
          <li>favourites, recently opened tools, and a local usage count used to suggest tools;</li>
          <li>the watermark on/off preference for exported files.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Third-party resources</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          A few tools load resources from third parties, so using those specific tools sends a
          request to the provider (for example, your IP address, as with any web request):
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink-dim)]">
          <li>map tools load map tiles from providers such as OpenStreetMap, OpenFreeMap, CARTO, or Esri;</li>
          <li>some tools fetch web fonts or on-device AI models from a public CDN the first time they run;</li>
          <li>the site is hosted on Vercel, which processes standard request logs.</li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          The content you put into a tool is still processed locally — only the resource (a map
          tile, a font, a model file) is fetched.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Questions</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          The project is open source. You can review exactly what the code does, or raise a question,
          on{" "}
          <a href="https://github.com/im4tta/tools123" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline hover:text-[var(--gold-dim)]">
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}

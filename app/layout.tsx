import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { JetBrains_Mono, Kantumruy_Pro, Moul, Siemreap, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./mobile.css";
import "./mobile-carousel.css";
import { AppProviders } from "@/components/AppProviders";
import { themeInitScript } from "@/components/ThemeProvider";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ScrollToBottomButton } from "@/components/ScrollToBottomButton";
import { SponsorButton } from "@/components/SponsorButton";
import { WatermarkToggle } from "@/components/WatermarkToggle";
import { ShareToast } from "@/components/ShareToast";
import { BASE_URL } from "@/lib/site";
import { siteJsonLd } from "@/lib/seo";

const SITE_JSON_LD = JSON.stringify(siteJsonLd()).replace(/</g, "\\u003c");

const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  variable: "--font-kantumruy-pro",
  display: "swap",
});
const moul = Moul({ weight: "400", subsets: ["khmer", "latin"], variable: "--font-moul", display: "swap" });
const siemreap = Siemreap({ weight: "400", subsets: ["khmer"], variable: "--font-siemreap", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "123 Toolbox — ប្រអប់ឧបករណ៍ ១២៣",
  description:
    "430+ free browser-based tools for PDF, images, developers, designers, Khmer language, and everyday work. ឧបករណ៍អនឡាញឥតគិតថ្លៃជាង ៤០០ មុខ។",
  alternates: {
    canonical: BASE_URL,
    languages: {
      "x-default": BASE_URL,
      en: `${BASE_URL}/en`,
      km: `${BASE_URL}/km`,
    },
  },
  openGraph: {
    type: "website",
    title: "123 Toolbox — ប្រអប់ឧបករណ៍ ១២៣",
    description:
      "430+ free browser-based tools for PDF, images, developers, designers, Khmer language, and everyday work.",
    url: BASE_URL,
    siteName: "123 Toolbox",
    locale: "en_US",
    alternateLocale: "km_KH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${kantumruyPro.variable} ${moul.variable} ${siemreap.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
      </head>
      <body className="antialiased">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-[var(--ground-line)] px-5 py-6 text-center text-xs text-[var(--ink-faint)] sm:px-10">
              <div className="mx-auto flex max-w-[77rem] flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <span>{new Date().getFullYear()} — 123 Toolbox</span>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <SponsorButton />
                  <WatermarkToggle />
                  <Link href="/about" className="transition hover:text-[var(--gold)]">
                    About
                  </Link>
                  <Link href="/acknowledgement" className="transition hover:text-[var(--gold)]">
                    Acknowledgements
                  </Link>
                  <Link href="/changelog" className="transition hover:text-[var(--gold)]">
                    Changelog
                  </Link>
                  <Link href="/llms.txt" className="transition hover:text-[var(--gold)]">
                    llms.txt
                  </Link>
                  <a
                    href="https://github.com/im4tta/tools123"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[var(--gold)]"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </footer>
          </div>
          <ScrollToBottomButton />
          <ScrollToTopButton />
          <ShareToast />
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}

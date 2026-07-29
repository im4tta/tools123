import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Kantumruy_Pro, Moul, Siemreap, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import { AppProviders } from "@/components/AppProviders";
import { themeInitScript } from "@/components/ThemeProvider";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

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
  title: "123 Toolbox — ប្រអប់ឧបករណ៍ ១២៣",
  description:
    "400+ free browser-based tools for PDF, images, developers, designers, Khmer language, and everyday work. ឧបករណ៍អនឡាញឥតគិតថ្លៃជាង ៤០០ មុខ។",
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
      </head>
      <body className="antialiased">
        <AppProviders>
          {children}
          <ScrollToTopButton />
        </AppProviders>
      </body>
    </html>
  );
}

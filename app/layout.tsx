import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { themeInitScript } from "@/components/ThemeProvider";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

export const metadata: Metadata = {
  title: "123 Toolbox — ប្រអប់ឧបករណ៍ ១២៣",
  description:
    "380+ free browser-based tools for PDF, images, developers, designers, Khmer language, and everyday work. ឧបករណ៍អនឡាញឥតគិតថ្លៃជាង ៣៨០ មុខ។",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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

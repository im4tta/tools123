import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "១២៣ Toolbox — Free online PDF, image, and Khmer language tools",
  description:
    "168 free browser-based tools: merge & compress PDFs, remove image backgrounds, convert Khmer digits, generate QR codes, and more — for developers, designers, and everyday office work.",
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { ReactNode } from "react";
import { ClipboardProvider } from "@/components/ClipboardProvider";
import { FileDropEnhancer } from "@/components/FileDropEnhancer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ClipboardProvider>
          {children}
          <FileDropEnhancer />
        </ClipboardProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

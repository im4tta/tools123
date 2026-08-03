"use client";

import { ReactNode } from "react";
import { ClipboardProvider } from "@/components/ClipboardProvider";
import { FileDropEnhancer } from "@/components/FileDropEnhancer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BeamProvider } from "@/contexts/BeamContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BeamProvider>
          <ClipboardProvider>
            {children}
            <FileDropEnhancer />
          </ClipboardProvider>
        </BeamProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

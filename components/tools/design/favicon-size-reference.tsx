"use client";
import { ToolShell } from "@/components/ui/Shell";

const SIZES: [string, string][] = [
  ["16×16", "Classic browser tab favicon"],
  ["32×32", "Windows taskbar / retina tab"],
  ["48×48", "Windows site icon"],
  ["57×57", "iOS home screen (older)"],
  ["76×76", "iPad home screen"],
  ["120×120", "iPhone retina home screen"],
  ["152×152", "iPad retina home screen"],
  ["167×167", "iPad Pro home screen"],
  ["180×180", "Apple touch icon (recommended)"],
  ["192×192", "Android home screen / Chrome"],
  ["512×512", "PWA splash / app icon"],
];

export default function FaviconSizeReference() {
  return (
    <ToolShell title="Favicon & App Icon Size Reference" description="Standard icon sizes to export for browsers, iOS, Android, and PWAs.">
      <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">
        {SIZES.map(([size, desc]) => (
          <div key={size} className="flex gap-4 px-3 py-2.5 text-sm">
            <span className="w-24 shrink-0 font-mono-ui text-[var(--gold)]">{size}</span>
            <span className="text-[var(--ink-dim)]">{desc}</span>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}

// Shared PDF text extraction, used by the PDF Text Extractor and PDF Compare
// tools so the line-reconstruction rules live in exactly one place.
//
// pdf.js hands back text runs in content-stream order, which is not reading
// order: a run's position lives in its transform matrix (index 4 = x, 5 = y).
// Runs are bucketed by baseline, ordered left to right, and a space is inserted
// where the horizontal gap exceeds the previous run's advance — that is what
// stops adjacent runs collapsing into one word.

import { loadPdfJs } from "@/lib/pdfjs";

/** A pdf.js text run; only the fields used here are modelled. */
interface Run {
  str: string;
  transform: number[];
  width?: number;
}

/** Reassemble pdf.js text runs for a single page into reading-order lines. */
export function runsToText(items: unknown[]): string {
  const lines = new Map<number, Run[]>();
  for (const raw of items) {
    if (!raw || typeof raw !== "object" || !("str" in raw)) continue;
    const run = raw as Run;
    if (!run.str || !Array.isArray(run.transform)) continue;
    // Bucket baselines 2pt apart together so sub-pixel drift doesn't split a line.
    const key = Math.round(run.transform[5] / 2);
    const bucket = lines.get(key);
    if (bucket) bucket.push(run);
    else lines.set(key, [run]);
  }
  return [...lines.entries()]
    .sort((a, b) => b[0] - a[0]) // top of the page downwards
    .map(([, bucket]) => {
      const sorted = bucket.sort((a, b) => a.transform[4] - b.transform[4]);
      let line = "";
      let prevEnd: number | null = null;
      for (const run of sorted) {
        const x = run.transform[4];
        if (prevEnd != null && x - prevEnd > 1 && !line.endsWith(" ") && !run.str.startsWith(" ")) line += " ";
        line += run.str;
        prevEnd = x + (typeof run.width === "number" ? run.width : 0);
      }
      return line.trimEnd();
    })
    .join("\n");
}

/** Extract the text of every page of a PDF, one string per page. */
export async function extractPdfPages(file: File): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(runsToText(content.items));
  }
  return pages;
}

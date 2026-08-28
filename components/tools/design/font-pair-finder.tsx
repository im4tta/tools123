"use client";
import { useEffect } from "react";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Pair = {
  name: string;
  heading: { family: string; weights: string; stack: string };
  body: { family: string; weights: string; stack: string };
};

const FAMILIES: Record<string, { weights: string; stack: string }> = {
  "Playfair Display": { weights: "700", stack: `"Playfair Display", Georgia, "Times New Roman", serif` },
  "Source Sans 3": { weights: "400;600", stack: `"Source Sans 3", "Segoe UI", system-ui, sans-serif` },
  Inter: { weights: "400;600", stack: `"Inter", "Segoe UI", system-ui, sans-serif` },
  "Space Grotesk": { weights: "400;600", stack: `"Space Grotesk", system-ui, sans-serif` },
  Lora: { weights: "700", stack: `"Lora", Georgia, serif` },
  Merriweather: { weights: "400;700", stack: `"Merriweather", Georgia, serif` },
  Montserrat: { weights: "700", stack: `"Montserrat", "Segoe UI", system-ui, sans-serif` },
  "Open Sans": { weights: "400;600", stack: `"Open Sans", system-ui, sans-serif` },
  Poppins: { weights: "700", stack: `"Poppins", system-ui, sans-serif` },
  Lato: { weights: "400;600", stack: `"Lato", system-ui, sans-serif` },
  Roboto: { weights: "400;600", stack: `"Roboto", system-ui, sans-serif` },
  Oswald: { weights: "600", stack: `"Oswald", system-ui, sans-serif` },
  "DM Serif Display": { weights: "400", stack: `"DM Serif Display", Georgia, serif` },
  "DM Sans": { weights: "400;600", stack: `"DM Sans", system-ui, sans-serif` },
  Raleway: { weights: "700", stack: `"Raleway", system-ui, sans-serif` },
  "Bebas Neue": { weights: "400", stack: `"Bebas Neue", Impact, sans-serif` },
  "Cormorant Garamond": { weights: "700", stack: `"Cormorant Garamond", Georgia, serif` },
  Anton: { weights: "400", stack: `"Anton", Impact, sans-serif` },
  "Archivo Black": { weights: "400", stack: `"Archivo Black", Impact, sans-serif` },
  "Fjalla One": { weights: "400", stack: `"Fjalla One", Impact, sans-serif` },
  "Libre Baskerville": { weights: "700", stack: `"Libre Baskerville", Georgia, serif` },
  Karla: { weights: "400;600", stack: `"Karla", system-ui, sans-serif` },
  Spectral: { weights: "700", stack: `"Spectral", Georgia, serif` },
  "Work Sans": { weights: "400;600", stack: `"Work Sans", system-ui, sans-serif` },
  "EB Garamond": { weights: "700", stack: `"EB Garamond", Georgia, serif` },
  Nunito: { weights: "400;600", stack: `"Nunito", system-ui, sans-serif` },
  Caveat: { weights: "400;600", stack: `"Caveat", "Segoe Script", cursive` },
};

function pair(heading: string, body: string): Pair {
  return { name: `${heading} + ${body}`, heading: { family: heading, ...FAMILIES[heading] }, body: { family: body, ...FAMILIES[body] } };
}

const PAIRS: Pair[] = [
  pair("Playfair Display", "Source Sans 3"),
  pair("Inter", "Space Grotesk"),
  pair("Lora", "Merriweather"),
  pair("Montserrat", "Open Sans"),
  pair("Poppins", "Lato"),
  pair("Merriweather", "Roboto"),
  pair("Oswald", "Inter"),
  pair("DM Serif Display", "DM Sans"),
  pair("Raleway", "Source Sans 3"),
  pair("Bebas Neue", "Roboto"),
  pair("Cormorant Garamond", "Lato"),
  pair("Anton", "Open Sans"),
  pair("Archivo Black", "Inter"),
  pair("Fjalla One", "Lora"),
  pair("Libre Baskerville", "Karla"),
  pair("Spectral", "Work Sans"),
  pair("EB Garamond", "Nunito"),
  pair("Caveat", "Nunito"),
];

function googleHref(p: Pair): string {
  const fams = [p.heading, p.body].map(
    (f) => `family=${f.family.replace(/ /g, "+")}:wght@${f.weights}`
  );
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap`;
}

const LINK_ID = "font-pair-finder-link";

export default function FontPairFinder() {
  const { text: t } = useLanguage();
  const [selected, setSelected] = useToolState("font-pair-finder:selected", "0");
  const [headingText, setHeadingText] = useToolState("font-pair-finder:heading-text", "The quick brown fox jumps");
  const [bodyText, setBodyText] = useToolState(
    "font-pair-finder:body-text",
    "A well-chosen font pair keeps headings confident and body text comfortable to read for long stretches."
  );
  const [headingSize, setHeadingSize] = useToolState("font-pair-finder:heading-size", "36");
  const [bodySize, setBodySize] = useToolState("font-pair-finder:body-size", "16");

  const pair = PAIRS[Number(selected)] ?? PAIRS[0];

  useEffect(() => {
    document.getElementById(LINK_ID)?.remove();
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = googleHref(pair);
    document.head.appendChild(link);
    return () => {
      document.getElementById(LINK_ID)?.remove();
    };
  }, [pair]);

  return (
    <ToolShell
      title="Font Pair Finder"
      khmerTitle="ស្វែងរក Font ផ្គូផ្គង"
      description="Browse curated Google Font pairings with a live heading + body preview, then adjust the sample text."
      descriptionKm="រកមើលគូ Font របស់ Google Fonts ជាមួយការមើលជាមុន (ចំណងជើង + អត្ថបទ) រួចកែសម្រួលអត្ថបទគំរូ។"
    >
      <Row>
        <Field label="Font pair" labelKm="គូ Font">
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {PAIRS.map((p, i) => (
              <option key={p.name} value={String(i)}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Heading size (px)" labelKm="ទំហំចំណងជើង (px)">
          <TextInput inputMode="numeric" value={headingSize} onChange={(e) => setHeadingSize(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Row>
        <Field label="Heading sample" labelKm="អត្ថបទគំរូចំណងជើង">
          <TextInput value={headingText} onChange={(e) => setHeadingText(e.target.value)} />
        </Field>
        <Field label="Body size (px)" labelKm="ទំហំអត្ថបទ (px)">
          <TextInput inputMode="numeric" value={bodySize} onChange={(e) => setBodySize(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Field label="Body sample" labelKm="អត្ថបទគំរូ">
        <TextArea rows={2} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
      </Field>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3
          className="font-bold text-[var(--ink)]"
          style={{ fontFamily: pair.heading.stack, fontSize: `${Number(headingSize) || 16}px` }}
        >
          {headingText || " "}
        </h3>
        <p
          className="mt-3 leading-relaxed text-[var(--ink-dim)]"
          style={{ fontFamily: pair.body.stack, fontSize: `${Number(bodySize) || 12}px` }}
        >
          {bodyText || " "}
        </p>
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Curated suggestions only — not an official ranking. Fonts are loaded live from Google Fonts, so an internet connection is needed to show the real typefaces; offline, the browser falls back to system fonts.",
          "គ្រាន់តែជាការផ្ដល់យោបល់ប្រមូលផ្ដុំ — មិនមែនជាចំណាត់ថ្នាក់ផ្លូវការទេ។ Font ត្រូវបានផ្ទុកផ្ទាល់ពី Google Fonts ដូច្នេះត្រូវការអ៊ីនធឺណិតដើម្បីបង្ហាញពុម្ពអក្សរពិតៗ។ បើគ្មានអ៊ីនធឺណិត កម្មវិធីរុករកនឹងប្រើ font របស់ប្រព័ន្ធ។"
        )}
      </p>
    </ToolShell>
  );
}

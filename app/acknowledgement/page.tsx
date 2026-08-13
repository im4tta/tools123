import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LIBRARIES = [
  { name: "Next.js", url: "https://nextjs.org/", by: "Vercel Inc.", use: "React framework for server-rendered applications" },
  { name: "React", url: "https://react.dev/", by: "Meta Platforms, Inc.", use: "UI component library" },
  { name: "Tailwind CSS", url: "https://tailwindcss.com/", by: "Tailwind Labs", use: "Utility-first CSS framework" },
  { name: "TypeScript", url: "https://www.typescriptlang.org/", by: "Microsoft Corporation", use: "Type-safe JavaScript superset" },
  { name: "pdf-lib", url: "https://pdf-lib.js.org/", by: "Andrew Dillon", use: "PDF creation and manipulation" },
  { name: "pdfjs-dist", url: "https://mozilla.github.io/pdf.js/", by: "Mozilla Foundation", use: "PDF rendering in the browser" },
  { name: "KaTeX", url: "https://katex.org/", by: "Khan Academy", use: "Fast math typesetting" },
  { name: "lucide-react", url: "https://lucide.dev/", by: "Lucide Contributors", use: "Open-source icon library" },
  { name: "cmdk", url: "https://cmdk.paco.me/", by: "Paco Coursey", use: "Command palette UI" },
  { name: "clsx", url: "https://github.com/lukeed/clsx", by: "Luke Edwards", use: "Conditional class name utility" },
  { name: "JSZip", url: "https://stuk.github.io/jszip/", by: "Stuart Knightley", use: "ZIP file creation and reading" },
  { name: "jsQR", url: "https://github.com/cozmo/jsQR", by: "Cosmo Wolfe", use: "QR code detection and decoding" },
  { name: "gif.js", url: "https://github.com/jnordberg/gif.js", by: "Johan Nordberg", use: "GIF encoding in the browser" },
  { name: "qrcode.react", url: "https://github.com/zpao/qrcode.react", by: "Paul O'Shannessy", use: "QR code rendering for React" },
  { name: "qrcode-generator", url: "https://github.com/kazuhikoarase/qrcode-generator", by: "Kazuhiko Arase", use: "QR code matrix encoding in the browser" },
  { name: "@imgly/background-removal", url: "https://github.com/imgly/background-removal-js", by: "IMG.LY GmbH", use: "AI-powered background removal" },
  { name: "@thyrith/momentkh", url: "https://www.npmjs.com/package/@thyrith/momentkh", by: "ThyRith", use: "Khmer calendar and date utilities" },
  { name: "ESLint", url: "https://eslint.org/", by: "OpenJS Foundation", use: "JavaScript linting" },
  { name: "eslint-config-next", url: "https://nextjs.org/", by: "Vercel Inc.", use: "Next.js ESLint configuration" },
];

const FONTS = [
  { name: "Kantumruy Pro", url: "https://fonts.google.com/specimen/Kantumruy+Pro", by: "Tep Sovichet, Sina Navy" },
  { name: "Moul", url: "https://fonts.google.com/specimen/Moul", by: "Danh Hong" },
  { name: "Siemreap", url: "https://fonts.google.com/specimen/Siemreap", by: "Danh Hong" },
  { name: "Space Grotesk", url: "https://fonts.google.com/specimen/Space+Grotesk", by: "Florian Karsten" },
  { name: "JetBrains Mono", url: "https://www.jetbrains.com/lp/mono/", by: "JetBrains s.r.o." },
];

const INFRA = [
  { name: "Vercel", url: "https://vercel.com/", use: "Hosting and deployment" },
  { name: "GitHub", url: "https://github.com/", use: "Source code management and collaboration" },
];

export default function AcknowledgementPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
      >
        <ArrowLeft size={15} /> Back to tools
      </Link>

      <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">Acknowledgements</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">
        This project is built on the shoulders of many incredible open-source libraries, tools, and fonts.
        We are deeply grateful to every maintainer and contributor who makes this possible.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Libraries &amp; Frameworks</h2>
        <div className="mt-4 space-y-3">
          {LIBRARIES.map((lib) => (
            <div key={lib.name} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
              <a
                href={lib.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--gold)] transition hover:text-[var(--gold-dim)]"
              >
                {lib.name}
              </a>
              <span className="ml-2 text-xs text-[var(--ink-faint)]">by {lib.by}</span>
              <p className="mt-0.5 text-xs text-[var(--ink-dim)]">{lib.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Khmer Coeng Ta/Da Corrector</h2>
        <div className="mt-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          <p>
            Special thanks to <strong className="text-[var(--ink)]">Mr. Seanghay Yath</strong> for the original
            <a href="https://github.com/seanghay/khmer-coeng-tada-corrector" target="_blank" rel="noopener noreferrer" className="mx-1 text-[var(--gold)] hover:text-[var(--gold-dim)]">Khmer Coeng Ta/Da Corrector</a>
            project, including its trained model, C++ engine, and browser WASM implementation.
          </p>
          <p className="mt-2">
            123 Toolbox uses the original browser WASM artifacts with attribution under the MIT License. The
            <a href="https://khmer-coeng-tada-corrector.vercel.app/" target="_blank" rel="noopener noreferrer" className="mx-1 text-[var(--gold)] hover:text-[var(--gold-dim)]">original deployed demo</a>
            remains available from the author.
          </p>
          <p className="mt-2 text-xs text-[var(--ink-faint)]">Copyright © 2026 Seanghay Yath · MIT License</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Khmer Word Segmentation</h2>
        <div className="mt-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          <p>
            Special thanks to <strong className="text-[var(--ink)]">Mr. Seanghay Yath</strong> for the original
            <a href="https://github.com/seanghay/split-khmer" target="_blank" rel="noopener noreferrer" className="mx-1 text-[var(--gold)] hover:text-[var(--gold-dim)]">split-khmer</a>
            package, which powers the Khmer sentence-to-word-array segmentation in the Word Segmentation Tester.
          </p>
          <p className="mt-2">The package is used under the MIT License and remains credited to its original author.</p>
          <p className="mt-2 text-xs text-[var(--ink-faint)]">Copyright © Seanghay Yath · MIT License</p>
          <p className="mt-3 border-t border-[var(--ground-line)] pt-3">The comparison references the <a href="https://github.com/vengmony/khmer-nlp-toolkit" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">vengmony/khmer-nlp-toolkit</a> JavaScript toolkit under the MIT License and the <a href="https://github.com/vvearr/khmer-word-segmentation" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">vvearr/khmer-word-segmentation</a> KCC and annotation project under Apache-2.0.</p>
          <p className="mt-3 border-t border-[var(--ground-line)] pt-3">Sovichea’s <a href="https://github.com/Sovichea/khmer_segmenter" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">Khmer Viterbi Segmenter</a> is provided as an external reference. Its project code is MIT licensed, while bundled linguistic data has separate noncommercial terms. We link to its <a href="https://sovichea.github.io/khmer_segment_webui_demo/" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">live demo</a> and do not redistribute its restricted data.</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Khmer Punctuation Restoration</h2>
        <div className="mt-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-4 text-sm leading-relaxed text-[var(--ink-dim)]">
          <p>
            The punctuation-restoration tool references <a href="https://github.com/seanghay/khmerpunctuate" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">khmerpunctuate</a> by Seanghay Yath and its Khmer punctuation model on <a href="https://huggingface.co/seanghay/khmer-punctuation-restore" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">Hugging Face</a>.
          </p>
          <p className="mt-2">The current browser fallback is independently implemented and does not bundle the original ONNX model. The original project is credited for the reference workflow and model approach under the MIT License.</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Fonts</h2>
        <div className="mt-4 space-y-3">
          {FONTS.map((font) => (
            <div key={font.name} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
              <a
                href={font.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--gold)] transition hover:text-[var(--gold-dim)]"
              >
                {font.name}
              </a>
              <span className="ml-2 text-xs text-[var(--ink-faint)]">by {font.by}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Infrastructure</h2>
        <div className="mt-4 space-y-3">
          {INFRA.map((item) => (
            <div key={item.name} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--gold)] transition hover:text-[var(--gold-dim)]"
              >
                {item.name}
              </a>
              <p className="mt-0.5 text-xs text-[var(--ink-dim)]">{item.use}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-12 border-t border-[var(--ground-line)] pt-6 text-center text-xs text-[var(--ink-faint)]">
        Built with care by <a href="https://github.com/im4tta" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">im4tta</a> and contributors.
      </p>
    </main>
  );
}

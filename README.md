<a id="top"></a>

<div align="center">
  <img src="./app/icon.svg" width="88" height="88" alt="123 Toolbox logo" />
  <h1>១២៣ Toolbox</h1>
  <p><strong>Free browser-based PDF, image, developer, Cambodia, and Khmer-language utilities.</strong></p>
  <p><strong>ឧបករណ៍អនឡាញឥតគិតថ្លៃសម្រាប់ PDF រូបភាព អ្នកអភិវឌ្ឍន៍ កម្ពុជា និងភាសាខ្មែរ។</strong></p>
  <p>
    <a href="https://github.com/im4tta/tools123"><img alt="GitHub repository" src="https://img.shields.io/badge/GitHub-im4tta%2Ftools123-181717?logo=github" /></a>
    <a href="https://imeta.asia"><img alt="Website" src="https://img.shields.io/badge/Website-imeta.asia-c9a24b" /></a>
    <a href="https://t.me/tmeta9"><img alt="Telegram contact" src="https://img.shields.io/badge/Telegram-Report_or_request-26A5E4?logo=telegram&logoColor=white" /></a>
    <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
    <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react" />
  </p>
</div>

---

## Overview

១២៣ Toolbox is a responsive collection of **hundreds registered tools** across **14+ categories**. Tools are accessible from the searchable list, an interactive graph, the command palette, or direct URLs.

The Khmer numerology calculator provides local-only plate, name, birth-date, daily-aura, and four-digit-number calculations with saved number favorites. Numerology interpretations are for entertainment only, have no scientific or predictive validity, and should never guide consequential decisions; personal inputs are not saved by the tool.

The interface supports three persistent language modes:

- **KH** — Khmer interface
- **EN** — English interface
- **BI** — bilingual English and Khmer interface

Most processing happens directly in the browser. Files and text generally remain on the user's device unless a tool clearly depends on an external resource or link.

> [!CAUTION]
> **AI-generated code and accuracy notice:** A significant portion of this project was created or assisted by AI-generated code. Some tools may be incomplete, inaccurate, outdated, incompatible with certain browsers or files, or not fully functional. Always verify important results independently before using them for production, official records, legal, financial, medical, engineering, surveying, security, or other critical purposes.
>
> Found a problem or need a new tool? Contact **[t.me/tmeta9](https://t.me/tmeta9)**.

## Recent updates

> [!NOTE]
> The in-app changelog at `/changelog` lists every registered tool by its addition date. The entries below highlight notable additions and improvements from recent sessions.

### 2026-07-31

- Added **Iconsmith**, a complete favicon pack generator: create browser favicons, Apple touch icons, Android/PWA icons, maskable variants, an adaptive `favicon.svg`, a Windows tile, and a 1200×630 Open Graph card from a logo or initials — all rendered locally in the browser, with a ZIP download of the full pack.
- Added **EDC Electricity Calculator**, a bilingual Cambodia utility estimator in the Office category: appliance presets, live daily/monthly kWh and cost figures in KHR and USD, a step-by-step calculation breakdown, the official EDC residential tier schedule (click a tier to apply its rate), a multi-appliance household bill estimator with an SVG usage chart, and energy-saving tips for Cambodian households.
- Added **Auth Architecture Lab**, an interactive Khmer-language guide in the Security category comparing 13 authentication and identity mechanisms — passkeys, biometrics, AI selfie liveness (Meta/Google), API keys, JWT, OAuth 2.0, OIDC, SAML, HMAC, and mTLS — with a trust-boundary topology map, live request inspector, comparison matrix, and an architecture decision wizard.
- Added user collections: a bookmark button on every tool page opens a picker to place the tool into the built-in Favorites collection or into named collections, with inline creation of new collections. Collections appear as collapsible, renameable, deletable cards on the home grid.
- Added three Khmer-language tools: **SafetyCodePro Cambodia**, **Khmer Word Segmentation Tester**, and **Khmer Font Encoding Inspector**.
- Added two construction-tender office tools: **Bid Timeline Calculator** and **Retention & Liquidated Damages Tracker**.
- Upgraded the Khmer Unicode normalizer into a **Khmer Typing Sequence Normalizer** that reorders misplaced coeng/subscript characters, moves displaced subscripts, and fixes typing-sequence issues for more consistent Khmer text.

### 2026-07-30

- Added new 3D model miniatures to the Model Gallery and improved the gallery UI. Newly-registered models include Angkor Wat and Bayon (earlier), plus six additional Khmer temple miniatures: Wat Phnom, Ta Prohm, Banteay Srei, Preah Vihear, Koh Ker, and Sambor Prei Kuk. Models are provided as dynamic model-factory modules and appear in the viewer's preview list.
- Materials tool UI fixes — the materials page header background and borders were adjusted to align with the main content width and an extra underline under the header menu was removed for a cleaner appearance.
- 3D Model Gallery — replaced the model dropdown with a horizontal preview gallery and added a short note on pages that several model factory files were generated by an AI assistant; some meshes or shapes may need manual refinement.
- Synthesizer / Crafting Lab improvements — the element picker now shows all elements (not just the first 20), and in-context hints are shown when the first ingredient is selected (suggested second ingredients and known 3-input recipes). This reduces the number of "Unknown Reaction" fallbacks caused by unavailable inputs. The UI still shows two input slots; adding a third slot is available on request.
- Khmer translations in the Materials fun-facts were corrected for clarity.

These changes were implemented to improve discoverability, usability, and to help surface known recipes and model previews. Please run the app locally (npm run dev) to visually verify model previews and 3D viewer behavior; report any runtime issues or rendering errors via the project Telegram contact.


## UI at a glance

The home screen is designed for quickly finding and opening a tool:

1. **Header controls** — switch list/graph view, choose KH/EN/BI, change theme, and open search.
2. **Category navigation** — filter tools by category while keeping search and view controls available.
3. **Search and command palette** — find tools by title, Khmer title, category, or keywords.
4. **Favorites and collections** — star a tool as a favorite or place it into named collections; both are managed from the tool header and grouped on the home grid.
5. **Recent tools** — revisit recently opened tools.
6. **List view** — browse compact tool cards grouped by category.
7. **Graph view** — explore category-to-tool relationships visually; selected tools receive an animated highlight.
8. **Direct tool pages** — every tool has a shareable URL with a fixed header and scroll-to-top control.

### Language behavior

Shared UI primitives localize tool titles, descriptions, field labels, hints, placeholders, dropdown options, output labels, and common actions. A tool may retain technical terms such as JSON, PDF, CSS, JWT, UUID, GPS, or Unicode when those terms are clearer than a forced translation.

The selected language, theme, favorites, recents, collections, and supported tool settings persist in browser storage. In **BI** mode, English and Khmer are shown together where translations are available.

### Tool-page controls

Tool pages use a consistent layout:

- Tool name and explanatory description
- Labeled settings, inputs, dropdowns, and sliders
- Localized result/output sections
- Copy buttons with localized **Copied**, **Already copied**, and **Failed to copy** feedback
- Drag-and-drop on supported file inputs, including multiple-file inputs and accepted-file filtering
- Download/export actions where applicable
- Before/after comparison sliders in supported image tools
- Fixed navigation with language, theme, favorites, and tool-search controls

### Example tool interaction

The **Sample Paragraph Generator** illustrates the common UI pattern: choose a **Category** and **Tone**, enter a **Topic / Subject**, adjust the **Sentences** slider, and select **Generate**. In KH or BI mode, the shared field labels, hint text, common options, description, and action text use their Khmer forms where available. Tool-specific dynamic values may retain English when they are names, technical identifiers, or have not yet received a reviewed Khmer translation.

## Tool categories

| Category | Khmer | Examples |
|---|---|---|
| Office | ការិយាល័យ | PDF merge, page organizer, watermarking, QR codes, expense tracking |
| Images | រូបភាព | Resize/compress, edit, upscale, background removal, metadata, watermarking |
| Khmer Language | ភាសាខ្មែរ | Khmer digits, Unicode, dates, lunar calendar, text segmentation, terminology |
| Design | រចនា | Color, contrast, gradients, shadows, spacing, favicons, social preview images |
| Text | អត្ថបទ | Sorting, counting, cleanup, find/replace, Morse code, title case |
| Time & Date | ពេលវេលា | Age, countdown, date difference, timezone, ISO week, workdays |
| Math | គណិតវិទ្យា | Percentages, equations, matrices, statistics, unit conversion |
| Geospatial | ភូមិសាស្ត្រ | Coordinates, distance, bearing, GeoJSON, KML, UTM, polygon area, EV stations |
| Science | វិទ្យាសាស្ត្រ | Materials reference, periodic table, 3D atoms, phone-number cleaning |
| Development | អភិវឌ្ឍន៍ | JSON, Base64, URL encoding, UUID, hashing, regex, Markdown |
| Network | បណ្តាញ | CIDR, IP/MAC parsing, DNS, HTTP codes, MIME types, ports |
| Security | សុវត្ថិភាព | Passwords, PINs, Base32, JWT, ciphers, random keys |
| Audio | សំឡេង | Audio editing and file inspection |
| Video | វីដេអូ | Trimming, thumbnails, GIF conversion, file inspection |

### Cambodia-focused tools

The project includes locally bundled reference data and utilities for Cambodian users, including:

- Postal-code lookup
- Administrative hierarchy browser
- Administrative-code decoder and validator
- Khmer/English address formatter with CSV export
- Government institution directory
- Government plate-prefix lookup and parser
- Cambodia EV charging-station finder with province, connector, rating, and distance filters
- Province lookup and nearest-province approximation
- Khmer Unicode normalization and punctuation-based sentence segmentation
- Riel formatting and official MEF multi-currency conversion with a manual-rate fallback
- Direct-browser MEF weather, UV-index, and air-quality views for Cambodian locations

Some Cambodia datasets may become outdated as administrative boundaries, institutions, assignments, postal codes, charging stations, or public records change. Verify formal use against current official sources.

### Friendly direct routes

| Route | Tool |
|---|---|
| `/ntw` | Khmer number spell-out |
| `/postal-codes` | Cambodia postal-code finder |
| `/address` | Administrative hierarchy |
| `/format-address` | Bilingual address formatter |
| `/admin-code` | Administrative-code decoder |
| `/ministries` | Government institution directory |
| `/plates` | Government plate lookup |
| `/parse-plate` | Government plate parser |
| `/evskh` | Cambodia EV charging-station finder |
| `/khmer-unicode` | Khmer Typing Sequence Normalizer |
| `/khmer-sentences` | Khmer sentence segmenter |

All other tools use their registered tool ID as the route slug.

## Privacy and network behavior

The project is built with a browser-first approach:

- Image, audio, video, PDF, text, and conversion operations generally run locally.
- Clipboard operations use the browser Clipboard API with a compatibility fallback.
- Persistent preferences and selected tool state use local browser storage.
- File-drop enhancement does not upload files by itself.
- EV-station geolocation is requested only after the user selects **Use my location** and is used locally for straight-line distance calculations; coordinates are not stored by the tool.
- The EV finder omits remote station thumbnails, but its Google Maps and review links navigate to third-party services when selected.
- The background-removal tool downloads its AI model on first use and then uses the browser cache where available.
- The GitHub file browser calls the public GitHub API from the browser.
- Directory/reference tools may open external websites, maps, repositories, images, or contact links.

Review browser developer tools and the relevant tool implementation if your workflow has strict privacy, confidentiality, or compliance requirements. Never paste secrets, private keys, production credentials, personal records, or confidential documents into a tool unless you have independently confirmed its behavior is appropriate for your use case.

## Important limitations

This is an experimental community toolbox, not an authoritative professional service.

- Tools may contain errors or edge cases, especially because much of the code is AI-generated or AI-assisted.
- Browser capabilities, memory limits, codecs, WebAssembly support, and file formats vary by device.
- Large files may be slow or may fail on low-memory devices.
- Format checkers validate shape or syntax; they usually do not verify data against an official registry.
- Geographic calculations may be approximations and must not replace survey-grade software.
- Government, postal, institutional, plate, and administrative data may not reflect the latest official changes.
- EV-station records are reference data only: they do not provide live charger availability, and connector, power, hours, fee, payment, rating, or contact details may be missing or outdated.
- Currency conversions use user-provided rates and are not financial advice.
- Security utilities are intended for learning, formatting, and testing—not for auditing production security.
- Output should be reviewed by a qualified person before critical or official use.

The software is provided **as-is**, without a guarantee that every tool is accurate, complete, secure, or fully functional.

## Acknowledgements

A sincere thank-you to **all developers, maintainers, researchers, translators, dataset contributors, and community members** who publish open-source tools, libraries, specifications, examples, fonts, and public reference data. This project would not be possible without the open-source ecosystem and the Cambodian developer community sharing knowledge and reusable work.

Key open-source projects used directly by this repository include:

| Project | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) and [React](https://react.dev/) | Application framework and UI |
| [Tailwind CSS](https://tailwindcss.com/) | Styling system |
| [Lucide](https://lucide.dev/) | Interface icons |
| [cmdk](https://github.com/pacocoursey/cmdk) | Command palette |
| [pdf-lib](https://pdf-lib.js.org/) and [PDF.js](https://mozilla.github.io/pdf.js/) | PDF creation, editing, parsing, and rendering |
| [JSZip](https://stuk.github.io/jszip/) | ZIP export |
| [jsQR](https://github.com/cozmo/jsQR) and [qrcode.react](https://github.com/zpao/qrcode.react) | QR decoding and generation |
| [KaTeX](https://katex.org/) | Mathematical formula rendering |
| [gif.js](https://jnordberg.github.io/gif.js/) | GIF encoding |
| [IMG.LY background-removal](https://github.com/imgly/background-removal-js) | In-browser image segmentation |
| [momentkh](https://www.npmjs.com/package/@thyrith/momentkh) | Khmer calendar support |
| [Kantumruy Pro](https://fonts.google.com/specimen/Kantumruy+Pro), [Moul](https://fonts.google.com/specimen/Moul), [Siemreap](https://fonts.google.com/specimen/Siemreap) | Khmer typography |

Additional thanks go to the authors of every transitive dependency and every public project referenced in the in-app resource directories. Copyright and ownership remain with their respective authors. Each dependency and referenced project is governed by its own license and terms; inclusion or acknowledgement does not imply endorsement by its maintainers.

If a credit is missing or inaccurate, please report it through **[Telegram](https://t.me/tmeta9)** so it can be corrected.

## Contact and links

- **Report a broken or inaccurate tool:** [t.me/tmeta9](https://t.me/tmeta9)
- **Request a new tool:** [t.me/tmeta9](https://t.me/tmeta9)
- **Website:** [imeta.asia](https://imeta.asia)
- **GitHub profile:** [github.com/im4tta](https://github.com/im4tta)
- **Repository:** [github.com/im4tta/tools123](https://github.com/im4tta/tools123)

A useful report should include the tool name/URL, language mode, browser/device, sample input that contains no sensitive data, expected result, actual result, and a screenshot or console error when available.

## Technology

- Next.js 16 App Router and React 19
- TypeScript
- Tailwind CSS 4
- Dynamic tool loading through the central registry
- Shared EN/KH/BI localization dictionaries and UI primitives
- Browser APIs for Canvas, Web Crypto, Clipboard, local storage, media, and file handling
- Web app manifest and service-worker registration for app-like use

## Local development

### Requirements

- Node.js 20 or newer
- npm

### Install and run

```bash
# Install exactly what is recorded in package-lock.json
npm ci

# Start the local development server
npm run dev
```

Open the local URL printed by Next.js in your browser.

### Validation and production

```bash
# Lint the project
npm run lint

# Type-check without writing output
npx tsc --noEmit

# Create an optimized production build
npm run build

# Serve the completed production build
npm run start
```

Do not run `npm run start` before a successful `npm run build`.

## Project structure

```text
app/
  [toolId]/            Dynamic tool route
  globals.css          Global theme and UI styles
  layout.tsx           Root layout, fonts, metadata, providers
  page.tsx             Home/list/graph interface
components/
  tools/                Tool implementations grouped by category
  ui/                   Shared fields, outputs, buttons, comparison UI
  LanguageProvider.tsx  Persistent KH/EN/BI mode
  ObsidianGraph.tsx     Interactive graph view
  CommandPalette.tsx    Search and quick navigation
  FileDropEnhancer.tsx  Shared file drag-and-drop behavior
data/                    Bundled Cambodia and reference datasets
lib/
  tools.tsx             Category metadata and central tool registry
  toolRoutes.ts         Friendly route aliases
  tool-title-km.ts      Khmer tool-title mappings
  i18n-ui.ts            Labels, hints, options, placeholders, actions
  i18n-descriptions.ts  Khmer description mappings
public/                  Static assets, service worker, workers
```

## Adding a tool

1. Add a client component under `components/tools/<category>/`.
2. Use shared primitives from `components/ui/Shell.tsx` and `components/ui/Output.tsx` where practical.
3. Register the tool in `lib/tools.tsx` with a unique ID, English title, category, keywords, and dynamic component loader.
4. Add an exact Khmer title in `lib/tool-title-km.ts` or directly on the registry entry.
5. Add a natural Khmer description in `lib/i18n-descriptions.ts` or pass `descriptionKm` to `ToolShell`.
6. Add shared labels, hints, options, placeholders, or actions to `lib/i18n-ui.ts` when they are reusable.
7. Add a friendly alias to `lib/toolRoutes.ts` only when the shorter route is useful and non-conflicting.
8. Keep sensitive processing local when possible, clearly disclose network behavior, and avoid overstating accuracy.
9. Run TypeScript, targeted lint, and a production build before submitting changes.

## Reporting and requesting tools

Please report tools that are incorrect, confusing, outdated, partially functional, or broken. Tool requests are also welcome, especially practical Cambodia- and Khmer-focused utilities.

**Telegram:** [t.me/tmeta9](https://t.me/tmeta9)

---

<div align="center">
  <strong>Built with appreciation for the open-source community.</strong><br />
  <span>សូមអរគុណដល់អ្នកអភិវឌ្ឍន៍ និងសហគមន៍កូដចំហទាំងអស់។</span>
</div>


<p align="right"><a href="#"><strong>↑ Back to top</strong></a></p>

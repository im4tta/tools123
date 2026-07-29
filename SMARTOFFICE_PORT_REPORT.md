# SmartOffice KH Port Audit

Audit source: `D:\PERSONAL\Claude\smartoffice-kh---ការិយាល័យឆ្លាតវៃ (1).zip`

The ZIP was inspected as data only. No archive code was executed, no files were extracted into the project, and no archive dependencies were installed.

## Summary

- 51 archive `components/tools/*.tsx` components were reviewed.
- 45 are exposed by the archive menu; several others are unwired/orphan views.
- 19 Toolbox123 routes now provide safe rewrites of the selected SmartOffice archive concepts.
- 13 archive concepts already have equivalent or stronger Toolbox123 tools.
- Two distinct KhmerScribe concepts are additionally available as a safe administrative-letter builder and a role-based honorific guide; its number-to-words and ZWSP concepts reuse existing canonical tools rather than creating duplicates.
- The latest local redesign batch shares canvas and node-editor engines, avoids archive-only export dependencies, and keeps privacy-sensitive data session-only.
- The remaining tools are deferred because of incomplete behavior, heavy dependencies, unsafe HTML/printing, AI/API concerns, or because they are app-shell views rather than tools.

## Status legend

- **PORTED**: rewritten for Toolbox123 and available now.
- **EXISTING**: equivalent or stronger functionality already exists.
- **CANDIDATE**: useful local-only concept that can be redesigned safely later.
- **DEPENDENCY / INCOMPLETE**: heavy package requirement or archive behavior is simulated/stubbed.
- **UNSAFE REDESIGN**: archive uses generated HTML, `document.write`, or unsafe export/print flows.
- **REMOTE / PRIVACY**: sends data remotely, needs client secrets, geolocation, camera, or sensitive persistence review.
- **SHELL**: settings/dashboard/help/navigation rather than an end-user tool.

## Ported tools

| Archive component | Toolbox123 route | Improvement made |
|---|---|---|
| `AssetManager.tsx` | `/asset-register` | Local temporary register, summaries, formula-safe CSV |
| `AttendanceGenerator.tsx` | `/attendance-sheet` | Editable attendance, time totals, safe CSV; no whole-window print |
| `MeetingAgenda.tsx`, `MeetingMinutes.tsx` | `/meeting-agenda-minutes` | Combined duplicate workflows, decisions/actions, safe text export |
| `SignaturePad.tsx` | `/signature-pad` | DPR-safe responsive canvas, undo, transparent/white PNG |
| `TeamGenerator.tsx` | `/team-generator` | Unbiased crypto-backed shuffle and balanced groups |
| `TaskManager.tsx` | `/task-manager` | Local CRUD/filtering, summaries, protected CSV/JSON export |
| `TimeTracker.tsx` | `/time-tracker` | Leak-safe timer, manual logs, totals, protected CSV |
| `StickyNotes.tsx` | `/sticky-notes` | Searchable local notes, color editing, JSON backup |
| `EmailSignatureGen.tsx` | `/email-signature-generator` | Safe React preview and escaped source; no raw HTML injection |
| `Holidays.tsx` | `/cambodia-public-holidays` | Replaced the archive’s 2025-only list with typed 2026/2027 workspace-supplied rows, year filtering, derived local date labels, malformed-citation cleanup, explicit unverified-data warnings, and private local custom dates |
| `Calculators.tsx` | `/business-calculators` | Loan/VAT/discount/date tools plus bracketed resident salary tax and NSSF pension/health/risk breakdowns using separately verified contribution bases |
| `Whiteboard.tsx` | `/whiteboard` | Shared DPR-safe drawing engine with Signature Pad, undo, clear, and local PNG export |
| `DailyFengShuiCalendar.tsx` | `/daily-feng-shui-calendar` | Transparent simplified rule basis with prominent accuracy and cultural-reference disclaimer |
| `BusinessCardGen.tsx` | `/business-card-generator` | Native SVG preview/export; no `html-to-image` dependency |
| `ChartMaker.tsx` | `/chart-maker` | Validated native bar/line SVG preview and export |
| `DiagramEditor.tsx`, `MindMapMaker.tsx`, `OrgChartMaker.tsx`, `WBSMaker.tsx` | `/diagram-editor` | One canonical route and stable title expose all four modes through one memory-safe node model, drag engine, layout set, and SVG export |
| `StaffDirectory.tsx` | `/staff-directory` | Session-memory-only records/photos, formula-safe CSV, explicit clear and no-upload disclosure |
| `DocumentScanner.tsx` | `/document-scanner` | Explicit camera consent, track cleanup, local processing/export, and no scan history |
## Existing Toolbox123 equivalents

| Archive component / feature | Existing Toolbox123 coverage | Why no duplicate was added |
|---|---|---|
| `ExpenseTracker.tsx` | `/expense-tracker` | Same expense-log domain already exists |
| `ImageResizer.tsx` | `/image-optimizer`, `/image-editor` | Existing tools cover resize, compression, and editing |
| `ColorTools.tsx` | Palette, shades, converter, color-name tools | Focused existing tools provide broader coverage |
| `TextTools.tsx` | Case, whitespace, statistics, find/replace tools | Avoid another overlapping all-in-one page |
| `UnicodeFixer.tsx` | `/khmer-unicode`, Unicode inspector | Existing normalizer and inspector are clearer |
| `KhmerLorem.tsx` | Khmer lorem/placeholder tool | Already available |
| `NumberToWords.tsx` | `/ntw`, `/currency-to-words` | Existing tools separate Khmer numbers and cheque wording |
| `PasswordGenerator.tsx` | Password, passphrase, strength tools | Existing security tools are broader |
| `Pomodoro.tsx` | `/pomodoro-timer` | Core workflow already exists |
| `QRGenerator.tsx` | `/qr-generator` | Existing local QR generator avoids archive-only styling package |
| `KhmerCalendar.tsx` | Lunar day/date, zodiac, Buddhist era, calendar tools | Existing focused tools cover useful calculations |
| `MarkdownConverter.tsx` preview | `/markdown-preview` | Safe preview already exists; archive export is unsafe |
| `Calculators.tsx` common calculators | Unit, age, date difference, percentage tools | Existing focused calculators avoid a duplicate bundle |
| `PDFTools.tsx` implemented operations | PDF merge, organizer, compressor, images/PDF, watermark | Existing local PDF tools cover the genuinely implemented actions |
| `PDFMetadataEditor.tsx` read view | `/pdf-info` | Archive metadata write operation is simulated |

## KhmerScribe safe ports

| Supplied concept | Toolbox123 route | Safety and scope decision |
|---|---|---|
| Khmer administrative/A4 letters | `/administrative-letter-builder` | 100 populated, searchable Khmer drafting templates; controlled React rendering; local full solar/lunar dates; coded 25-province selection; responsive A4 preview; scoped print; plain-text export; and genuine OOXML `.docx` export generated locally with JSZip. No `innerHTML`, `document.write`, popups, or fake Word extensions. |
| Khmer official honorifics | `/honorific-guide` | Nine role-based references with local search/copy; no potentially stale officeholder names and a visible protocol-currentness warning |
| Khmer number/currency wording | `/number-spellout`, `/currency-to-words` | Existing canonical tools retained; KhmerScribe search terms added instead of duplicating routes |
| Khmer ZWSP assistance | `/line-break-helper`, `/css-wrap-fix` | Existing canonical tools retained; KhmerScribe search terms added instead of duplicating routes |

## Completed safe-redesign batch

The former calculator, whiteboard, cultural calendar, native generator, structured editor, staff-directory, and scanner candidates are now shipped in the routes above. The payroll tab now applies the resident salary brackets and KHR 150,000 eligible-dependent deduction associated with Sub-Decree 196, the first pension phase's 2% employee/2% employer rates and KHR 400,000–1,200,000 base, and Prakas 449's separate assumed-wage table for 2.6% health and 0.8% occupational risk. Effective dates, assumptions, sources, and a current-rules warning remain visible. The cultural calendar discloses its simplified software-defined basis rather than claiming almanac accuracy.
## Deferred: dependencies or incomplete archive behavior

- `PDFTools.tsx`: repair, OCR, Word/PPT/Excel/HTML conversion, PDF-A, crop/edit, unlock/protect, sign, redact, compare, and generic conversion choices are stubs or require real document engines. “Protect” does not encrypt, and several actions return the original input. Its PDF.js worker is also loaded from unpkg.
- `PDFMetadataEditor.tsx`: metadata editing is simulated; a future port must actually write and verify metadata with `pdf-lib`.
- `ExcelTools.tsx`: advertised unlock/edit behavior is simulated and does not use the bundled `xlsx` dependency meaningfully.
- Archive-only packages deliberately not added wholesale: `@google/genai`, `html-to-image`, `html2pdf.js`, `qr-code-styling`, and `xlsx`. The shipped business-card, chart, and structured-diagram tools use native SVG instead.

## Deferred: unsafe generated HTML or print flows

These concepts may be useful, but the archive versions create new windows, call `document.write`, inject generated HTML, or combine sensitive form data with unsafe export paths. They require a typed React preview and scoped print/download architecture before being added:

- `CVMaker.tsx`
- `EmploymentLetter.tsx`
- `InvoiceGenerator.tsx`
- `ReceiptMaker.tsx`
- `LetterheadDesigner.tsx`
- `MemoMaker.tsx`
- `MarkdownConverter.tsx` PDF export (`dangerouslySetInnerHTML` plus `html2pdf.js`)

## Deferred: AI, remote APIs, and privacy-sensitive behavior

- `ImageOCR.tsx`: sends image content to Gemini and expects client-accessible API keys.
- `SmartTranslator.tsx`: sends text to Gemini with the same secret/data-transfer problem; it is also unwired in the archive.
- `WeatherWidget.tsx`: the archive's external weather/geolocation implementation was not copied. Toolbox123 now provides dedicated weather, UV, and air-quality tools plus a combined environment dashboard using MEF's official datasets directly from each user's browser/IP, without geolocation or a hosting proxy.
- `Calculators.tsx` live currency: the archive calls a third-party exchange-rate API, so that implementation was not copied. Toolbox123 shares one validated, unit-aware MEF client between `/riel-usd` and `/business-calculators`. Both request directly from each user’s browser/IP with abort/timeout handling and editable manual fallback. Foreign salary input is converted to KHR before applying unchanged statutory KHR thresholds and bases.
- `UsefulContacts.tsx`: shell flyout with a remote map and external contacts, not a local utility.

## Not tools / archive wiring issues

- `Settings.tsx`: app preferences already covered by Toolbox123 theme/language providers.
- `StatsView.tsx`: archive usage dashboard, not a utility.
- `SupportedFormats.tsx`: help/status panel whose claims exceed actual archive behavior.
- `Dashboard.tsx`, `CommandPalette.tsx`, `Background.tsx`, and `App.tsx`: app shell already replaced by Toolbox123 navigation, search, providers, and graph.
- `UsefulContacts.tsx`: shell flyout rather than a routed tool.
- `Holidays.tsx`, `SmartTranslator.tsx`, and `WeatherWidget.tsx` exist but are not rendered by the archive app.
- `ToolID.BANK_GUARANTEE` is orphaned; bank-guarantee calculation only appears as a tab in `Calculators.tsx`.
- Shared `ExportMenu.tsx` and `Tooltip.tsx` are UI primitives, not tools.

## Current decision

The latest redesign batch ships all requested safe local candidates without copying archive code or adding archive-only export packages. Shared drawing and one canonical structured-node route replace duplicated canvas/drag implementations; sensitive staff and scan data is temporary by default; payroll formulas expose their legal/reference basis and effective assumptions; and cultural or protocol references retain explicit currentness warnings. The distinct KhmerScribe letter and honorific tools use escaped React rendering and local-only export/copy paths.

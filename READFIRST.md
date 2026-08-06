# READFIRST.md

## Required First Step

Before changing, reviewing, or adding anything in this repository, read this file and `AGENTS.md`.

## Product Rules

- Preserve the existing app UI language, spacing, colors, typography, responsive behavior, and interaction patterns unless the user explicitly requests a redesign.
- Keep the app mobile-first and test narrow layouts when changing homepage or tool layouts.
- Preserve existing URLs, preferred slugs, SEO metadata, canonical links, and structured data.
- Reuse existing components and calculation engines before creating duplicates.
- Keep deterministic calculations separate from optional AI behavior.
- Do not add fake live data, fake official terminology, or unsupported claims. Label estimates and fallback data clearly.
- Do not remove existing functionality to make a new feature easier.

## Source Attribution And Credits

- Before adding or substantially adapting any tool, inspect the original source references, including GitHub repositories, npm packages, demos, papers, datasets, fonts, APIs, and other external projects.
- Search the repository and the tool implementation for original-source comments, URLs, package metadata, license files, and attribution requirements before assuming the work is original.
- Add proper acknowledgement and credits for every identified creator or project, including a human-readable source link and license where applicable.
- Add source attribution in the tool UI when the external work materially powers the tool, and add full credit to the Acknowledgements page for reusable libraries, models, datasets, algorithms, WASM artifacts, and adapted projects.
- Preserve third-party copyright notices and license text when redistributing code, models, binaries, fonts, or other artifacts.
- Tools123 is an aggregation and integration platform combining local and international tools; it must not present source projects or adapted work as original Tools123 creations.
- When a tool is built with AI assistance, do not omit human or project credits. Investigate likely source origins and cite them before claiming the implementation is original.
- If AI-assisted coding reveals an external algorithm, library, dataset, model, UI, or project but the exact source cannot be confirmed, mark the attribution as unresolved and do not make an unsupported ownership claim.
- Do not remove, shorten, or replace existing source credits merely to make a tool appear more original.

## TOOLS123 Provenance Policy

Before implementing or integrating any tool:

1. Search existing implementations in this repository and elsewhere.
2. Search GitHub, npm, PyPI, Hugging Face, official websites, research papers, datasets, and relevant documentation.
3. Identify the original project and creator whenever possible.
4. Locate the authoritative `LICENSE` or terms of use.
5. Never assume a public GitHub repository is freely redistributable.
6. Never remove an existing copyright or attribution notice.
7. Preserve all required license notices.
8. Identify third-party dependencies, models, datasets, APIs, fonts, and other external assets.
9. Record relevant sources in machine-readable tool metadata.
10. Generate a visible `Source & Credits` section for tools with external provenance.
11. If provenance or licensing cannot be verified, mark it `Provenance Pending`; never silently claim it is original.
12. If licensing is unclear or incompatible, do not copy the implementation. Build an independent implementation or link to the original resource instead.
13. Distinguish original work, adapted open-source work, external integrations, third-party data, third-party models, AI-assisted implementation, and inspired independent implementations.
14. Never claim third-party work as Tools123 original work.

### Provenance Statuses

- `original`: implementation written by Tools123; origin is Tools123.
- `adapted`: existing open-source implementation modified by Tools123; original project and license are recorded.
- `integrated`: external library, API, model, or service used without copying its implementation.
- `inspired`: concept influenced by another project, but implementation is independently written by Tools123.
- `ai-assisted`: AI generated or substantially assisted implementation; source resemblance must still be investigated before publication.
- `unknown`: origin or license is unresolved; display `Provenance Pending` until verified.

### Required Metadata Shape

New or audited tools should record provenance in machine-readable metadata similar to:

```ts
type ToolProvenance = {
  status: "original" | "adapted" | "integrated" | "inspired" | "ai-assisted" | "unknown";
  creator?: string;
  origin?: string;
  originalProject?: string;
  sources?: string[];
  license?: string;
  notes?: string;
};
```

The UI should expose this through a localized `Source & Credits` section whenever the status is not plainly original, or whenever third-party data, models, libraries, or APIs materially affect the tool.

## Adding Or Updating A Tool

- Register every new tool in `lib/tools.tsx`.
- Use the correct category and dynamic component path.
- Add an `addedOn` timestamp for new tools so the homepage latest-tools section and changelog can find it.
- Add English `title` and Khmer `khmerTitle`.
- Add English and Khmer descriptions when the tool has custom explanatory text.
- Add useful English and Khmer keywords so homepage search, Universal Input, and workspaces can find it.
- Verify the tool appears in the correct workspace when applicable.
- Use persisted state through the existing storage helpers when state should survive navigation.
- Keep the tool’s canonical URL stable; use `toolHref()` and `resolveToolId()` for links.

## Tool Architecture And Consistency

- Every new tool must use the shared `ToolShell`, `Field`, `TextInput`, `TextArea`, `Select`, `Row`, `Output`, `Button`, and related UI primitives whenever they fit.
- Do not create bespoke layouts or controls when a shared primitive can express the same behavior.
- If a shared primitive genuinely cannot express a recurring pattern, extend the primitive instead of adding one-off styling to a single tool.
- Before creating a tool, search existing tools and utilities for overlapping logic, including unit conversion, Khmer number formatting, FIDIC/BOQ calculations, date handling, currency rates, and data normalization.
- Extract reusable formulas and helpers instead of re-deriving the same calculation in multiple tools.
- Add unit tests for new calculation engines before wiring them into the UI. Cover zero, negative, empty, invalid, boundary, and extreme values where applicable.

## Data And Correctness

- Any numeric output used for real decisions, including price adjustment, retention, liquidated damages, canal flow, quantities, or engineering estimates, must cite its formula or source in a comment, footnote, or visible source note.
- Clearly label approximations, estimates, user-entered assumptions, and fallback values.
- Never fabricate government or ministry reference data, including fuel prices, MPTC terminology, postal codes, exchange rates, and official tables.
- Pull reference data from a verified source or label it explicitly as user-supplied and unverified.
- Validate units in both English and Khmer output. Never silently mix KHR (៛), USD, metric, imperial, or other units.

## Performance And Client-Side Load

- Dynamically import or code-split heavy libraries such as Three.js, OCR, image processing, audio processing, and video processing.
- Do not load heavy tool dependencies on the homepage or unrelated tool routes.
- Keep homepage, search, and workspace filtering index-based and responsive as the tool catalog grows beyond 400 entries.
- Avoid rebuilding the full tool index or running expensive parsing work on every keystroke when a cached or indexed approach is sufficient.
- Recheck search responsiveness when adding tools, aliases, recommendations, or workspace filters.

## State, Storage, And Offline Behavior

- Persist state through the existing storage helpers rather than direct localStorage calls in tools.
- Follow the existing versioning and migration pattern when changing persisted schemas; old saved state must not break after an update.
- Test new tools offline when they are expected to work with the PWA cache.
- Explicitly label or exclude server-dependent tools from offline expectations.
- External data tools must show a useful cached, fallback, loading, or unavailable state rather than failing silently.

## Security And Secrets

- Never commit API keys, database connection strings, bot tokens, private URLs, or credentials.
- When adding an environment variable, update `.env.example`, never `.env`.
- External API tools, including Gemini OCR, Groq, MEF, fuel-price, and similar integrations, must handle network failures, timeouts, and rate limits with a clear bilingual error state.
- Never expose raw stack traces, secret values, or internal request details to users.

## Khmer Requirements

- Translate every visible label, heading, button, status, error, empty state, tooltip, and helper message added to a tool.
- Use `useLanguage()` and `t(english, khmer)` or the established localization helpers.
- Preserve Khmer font classes and Khmer-friendly line height and wrapping.
- Use official or source-backed terminology for MPTC and government terms.
- Do not silently invent an “official” translation. Mark unknown or suggested terminology as needing review.

## Homepage And Counts

- Do not hardcode the total tool count. It must derive from `TOOLS.length`.
- Check homepage search, smart suggestions, workspace filtering, favorites, recents, and the “Added this week” section after adding a tool.
- Ensure the new tool’s `addedOn` date is correct for the current release.
- Keep the homepage compact and avoid adding duplicate large search or branding blocks.

## Changelog And Release Metadata

- The changelog is generated from `addedOn` metadata in `lib/tools.tsx`; update `addedOn` for new tools or substantial tool launches.
- Confirm the tool appears in the expected weekly “Added this week” grouping.
- Update SEO only through the existing metadata flow unless a page-specific exception is required.
- Never claim a feature is complete until its UI, registry entry, localization, metadata, and verification are complete.

## Verification Before Reporting Completion

- Run `npx tsc --noEmit`.
- Run ESLint on every changed source file.
- Run `git diff --check`.
- Test the changed tool in English and Khmer modes when UI behavior is involved.
- Test keyboard interaction, direct URL loading, mobile layout, persisted state, and empty/error states when relevant.
- Check that no unrelated user changes were reverted or modified.
- Report warnings honestly; distinguish pre-existing warnings from new failures.

## Editing Rules

- Make the smallest correct change.
- Use `apply_patch` for manual edits.
- Do not commit, amend, push, or create a PR unless explicitly requested.
- Never use destructive Git commands without explicit approval.

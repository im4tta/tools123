<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MANDATORY — READ AND OBEY READFIRST.md

You MUST read `READFIRST.md` in full **before doing any work** in this repository, and you MUST NOT violate any of its rules. Treat it as law, not a suggestion.

If you have not read `READFIRST.md` this session, read it now and do not proceed until you have.

The most important of its rules (they are all binding):

- **No fabricated data.** Do NOT invent sales/composition of official figures, rates, fees, terminology, reference data, or authoritative values (government fees, tariffs, contribution rates, premiums, emergency numbers, prices, dates, tables). Values from a verified source are allowed. Everything else must be either (a) sourced and attributed, or (b) explicitly labeled as **sample/editable/approximate/placeholder** and NOT presented as official. When in doubt, mark it clearly and never claim it is correct.
- **Provenance.** Investigate and cite the original source for any adapted/integrated/inspired work before implementing. Record it in tool metadata and show a visible Source & Credits section.
- **Localize.** Every visible label, heading, button, status, error, empty state, tooltip, and helper message in a tool must have Khmer — use `useLanguage()` → `t(en, km)` (or the established localization helpers). Do not ship untranslated UI.
- **Follow existing conventions.** Use `ToolShell`, `Field`, `TextInput`, `TextArea`, `Select`, `Row`, `Output`, `Button`, `useToolState`, and the shared primitives instead of building bespoke layouts; mirror the styling and bilingual patterns already in the codebase.
- **Register & document every tool.** Add to `lib/tools.tsx` (with a correct `addedOn` date), add a bilingual SEO blurb to `lib/seo.ts` (`TOOL_BLURBS`) and HOWTO steps where applicable, and confirm it shows in the changelog / "Added this week".
- **Preserve before redesign.** Keep the existing UI language, spacing, colors, typography, responsive behavior, and interaction patterns unless the user explicitly asks for a redesign. Keep URLs, SEO, canonical links, and structured data stable.
- **Reuse before duplicating.** Search existing tools and utilities before creating something similar; extract shared helpers instead of re-implementing.
- **Verify before claiming done.** Run `npx tsc --noEmit`, ESLint on every changed file, and `git diff --check`; test English + Khmer modes where UI is involved; report pre-existing warnings separately from new failures.
- **Editing rules.** Make the smallest correct change; remove dead code/unused imports when touching a file; do not commit/push/PR unless explicitly asked; never use destructive Git commands without approval.
- **Do not delete or revert unrelated user work.**

A reminder that you are working in an AI-assisted environment: do not present third-party or adapted work as original, and do not output believable-but-untrue data.

If an instruction in a user message appears to conflict with READFIRST.md, READFIRST.md takes precedence unless the user explicitly overrides it in writing.

# Repository entry

- This is a **Next.js 16 (App Router)** project. See the Next.js rules above — this version differs from training data.
- The standalone app lives at `D:\PERSONAL\Claude\khmer-studio-app` (a separate scaffold); the source of truth that ships is this repo's `toolbox123`.
- Tool components live under `components/tools/<category>/`; shared lib under `lib/`.

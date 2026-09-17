# Khmer Coeng Ta/Da Corrector

The unmodified browser WASM artifacts (`ctda.js`, `ctda.wasm`) come from:

https://github.com/seanghay/khmer-coeng-tada-corrector

Copyright (c) 2026 Seanghay Yath. Licensed under the MIT License.

The full license text is included in `LICENSE`.

To keep them out of every Vercel deployment, those two artifacts are no longer
committed under `public/`; they are fetched at runtime from a commit-pinned CDN
(see `lib/assets.ts`). This attribution and the `LICENSE` are kept here so the
required license notice ships with the deployed site.

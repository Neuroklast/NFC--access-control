# Lessons — Web Platform

Load for: framework/RSC/hydration/build issues. Consolidated, anonymized.

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| 2026-09 | RSC | Cache callbacks MUST use cookie-free clients — session clients inside caches force dynamic rendering and can leak user context. | high |
| 2026-09 | RSC | `React.cache()` for request-stable reads — but NEVER for auth selectors (cache leaks across tests/requests). | high |
| 2026-09 | RSC | DOM/browser libraries belong in client leaves only; server components must not import them transitively. | med |
| 2026-09 | Routing | A root `api/<name>` file can shadow `app/api/<name>/route.ts` — never dual-mount the same path in two routing systems. | high |
| 2026-09 | Metadata | Metadata goes through the framework's metadata export, never a manual `<title>`. | low |
| 2026-09 | ISR | `generateStaticParams` pairs with a `revalidate` window; async routes need a matching `loading` skeleton. | med |
| 2026-09 | Hydration | Reading `localStorage`/`navigator` on first paint causes hydration mismatch (#418) — read in an effect or via a hydrated flag. | med |
| 2026-09 | Hydration | `toLocaleDateString`/`getDate` with mismatched server/client timezone causes hydration drift — fix the locale/timezone explicitly. | med |
| 2026-09 | Errors | Report crashes from the framework's error boundary files; a reload of a chunk error must be allowed once per fingerprint. | med |
| 2026-09 | Control flow | `NEXT_REDIRECT`-style control-flow errors MUST be rethrown (`unstable_rethrow`), never swallowed by try/catch. | high |
| 2026-09 | Build | A build that skips the frontend asset step ships yesterday's UI — make the asset build a hard dependency of the native/app build. | high |
| 2026-09 | Build | Generated files must be excluded from source globs, or builds loop/rebuild endlessly. | med |
| 2026-09 | Build | `tsc -b --noCheck` hides type errors; delete stale `.tsbuildinfo` before diagnosing type errors. | med |
| 2026-09 | Env | Env access goes through one validated schema; unvalidated `process.env` reads fail silently in production. | med |
| 2026-09 | i18n | Locale switch via partial refresh misses server-rendered text — do a full navigation when the framework requires it. | med |
| 2026-09 | i18n | CI parity checks (missing keys, hardcoded strings) prevent locale drift; baselines may only shrink. | med |
| 2026-09 | Imports | Path aliases must cover every root used by the app; a missing alias breaks only at build time. | low |
| 2026-09 | Dev mode | Dev fallbacks MUST be random/non-secret and clearly scoped; published default secrets are a breach waiting to happen. | high |
| 2026-09 | Lists | Unbounded lists + bot traffic = egress blowup; cookie-free clients + ISR + edge UA blocking is the defense triad. | high |
| 2026-09 | Caching | Missing `WHERE col IS NOT NULL` returns wrong "max" rows (NULL sorts first in some DBs). | med |
| 2026-09 | Data | A missing column in a select can return `data: null` silently — always check the error field. | high |
| 2026-09 | Dates | Partial dates (`2026`, `2026-03`) must normalize to a full date at the boundary. | low |
| 2026-09 | Version | One version string across build/installer/runtime/in-app news; contract-test it. | med |

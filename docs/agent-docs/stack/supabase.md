# Stack — Supabase / Postgres

Load for: Supabase repos. Core rules stay in `backend/`.

## Clients

| Client | Use for | NEVER |
| --- | --- | --- |
| Browser (anon) | Client-side auth, realtime | Service operations |
| Server (session/cookies) | Authenticated reads/writes in RSC/actions | Inside caches |
| Public (cookie-free anon) | Public reads, ISR/cache callbacks | User-scoped data |
| Service role (admin) | Admin/cron/system paths only | Client bundles, convenience bypasses |

- `cookies()` forces dynamic rendering — never inside `unstable_cache` callbacks.
- Realtime: one subscription owner, unique channel topics, handlers in refs ([../lessons/ui-ux.md](../lessons/ui-ux.md)).

## Schema

- ONE idempotent SQL SSOT (`schema.sql`/`reset.sql`/`init_all.sql`) — no parallel migration chains where the repo forbids them.
- Order: extensions → enums (guarded DO-blocks) → functions → tables → constraints → RLS → seeds.
- Additive/forward-compatible only; verify old clients can still read ([../testing/contracts-ci.md](../testing/contracts-ci.md)).
- Types generated from the schema; never hand-maintained duplicates.

## RLS

- Enabled on every exposed table in the SAME change as `CREATE TABLE`.
- Deny-by-default; policies named `"table: actor action"`; helper functions `SECURITY DEFINER` with fixed search path.
- Probe RLS in CI (loopback only for local DB checks).
- Service role bypasses RLS — justify each use ([../backend/auth.md](../backend/auth.md)).

## Rate limiting

- Postgres-backed limiter (`rate_limits` table + `consume_rate_limit()` function) for distributed limits.
- Hash IPs with a salt (`RATE_LIMIT_SALT`); throw when the salt is missing.
- Fail closed + in-memory backstop; RLS deny-all on the limiter table.

## Storage

- NEVER Supabase Storage for new work where the repo standardizes on object storage (R2/S3) — follow the repo's SSOT.
- Signed URLs short-lived; paths stored, URLs derived ([../stack/cloudflare-r2.md](cloudflare-r2.md)).

## Auth (Supabase Auth)

- Server-side login flows set cookies on the same response ([../backend/auth.md](../backend/auth.md)).
- Pass `@supabase/ssr` cookie options through unchanged (chunked cookies, cache headers).
- Middleware/proxy refreshes sessions and copies cookies on redirects.
- NEVER auto-promote roles; MFA for admins.

## Pitfalls

- Missing table grants (not RLS) cause empty results — check both.
- NULL ordering, partial dates, silent `data: null` on missing columns ([../lessons/web-platform.md](../lessons/web-platform.md)).
- Cookie-bound clients on public pages kill ISR and caches.

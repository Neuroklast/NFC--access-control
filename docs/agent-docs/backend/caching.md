# Backend — Caching

Load for: ISR, cache layers, invalidation, TTLs.

## Cache layers

| Layer | Use for | Invalidate by |
| --- | --- | --- |
| Request memoization | Same-request duplicate fetches (e.g. metadata + page) | Request scope, automatic |
| Data cache | Expensive reads, per-entity | Tag-based invalidation |
| Full route / ISR | Public pages | Revalidate path + tag together |
| CDN / edge | Static assets, cacheable public responses | Deploy / purge |

- Use the stack's existing cache primitives. NEVER introduce a cache service the repo does not already run.

## Rules

- Inside cache callbacks: cookie-free/anon clients ONLY. `cookies()`/session clients inside caches force dynamic rendering and leak user data.
- NEVER cache user-scoped data without the user ID in the cache key.
- NEVER cache binaries/bodies of large files; cache metadata and signed URLs.
- TTLs are documented (they are privacy facts — [../legal/legal-maintenance.md](../legal/legal-maintenance.md)).
- Tags are constants, not string literals scattered across files.
- Invalidation happens on the **single write path** — pair `revalidateTag` with `revalidatePath` (or equivalents) so lists and detail pages refresh together.
- Admin mutations invalidate their public counterparts in the same request.

## Cache keys

- Key = entity + scope + params that affect the result.
- Public reads: column whitelists; NEVER `*` that leaks private columns into cached responses.
- Normalize inputs (locale, filters) before keying.

## Warm-up & precompute

- Warm-up jobs run server-side, return no data to clients, and re-check authorization.
- Warm-up prefetches only allowlisted routes.
- NEVER warm-up user-specific pages into a shared cache.

## Public read pattern (typical)

1. Public page/route uses a cookie-free client.
2. Expensive read wrapped in the data cache with tags.
3. Mutations call the invalidation helper for their tags/paths.
4. Optional scheduled revalidation as a safety net.

## Anti-patterns

- Two cache systems for the same data.
- Cache-busting by disabling cache instead of fixing invalidation.
- Relying on TTL expiry as the only invalidation.
- Caching error responses or empty states as if they were data.
- Reading env/config inside cache callbacks when it is request-scoped.

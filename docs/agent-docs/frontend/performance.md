# Frontend — Performance

Load for: performance work, heavy widgets, images, bundles.

## Measure first

- Profile before optimizing: bundle analyzer, Lighthouse, PerformanceObserver. NEVER optimize by intuition.
- Budgets per repo (bundle size, LCP, CLS, TBT). CI-enforced where available.
- Regressions: compare against the last known baseline, not absolute ideals.

## Images & media

- ALWAYS width/height (or aspect ratio) to prevent layout shift.
- `priority`/eager only for the LCP image; everything else lazy.
- Serve modern formats (WebP/AVIF) via the framework's image pipeline or an image proxy.
- NEVER raw remote storage URLs in `<img>`/`<Image>` — route through the repo's URL helper (referrer/CORS/quota issues).
- Hero videos: compressed, muted, poster frame, lazy; NEVER uncompressed background video.
- Accurate `sizes`/`srcset`; never upscale beyond source resolution.

## JavaScript & bundles

- Code-split heavy widgets (3D, editors, charts, PDF, maps): dynamic import + lazy mount.
- NEVER load a heavy library in the root layout "for later".
- Check for duplicate icon/animation libraries; consolidate.
- Tree-shaking: import named exports, avoid barrel files that pull whole libraries.
- Defer non-critical scripts; no third-party scripts without a consent gate ([../legal/legal-maintenance.md](../legal/legal-maintenance.md)).

## Rendering

- Server components / server rendering for data-heavy first paint where the framework supports it.
- Lists: paginate or virtualize; NEVER unbounded DOM lists.
- Avoid layout thrash: batch reads/writes; no forced reflow in loops.
- Memoize expensive computations; do not re-fetch unchanged data.

## Network & caching

- Debounce inputs that hit the server (~300 ms).
- Cache headers/CDN for static assets; personalized API responses never on a public CDN ([../backend/caching.md](../backend/caching.md)).
- Batching over chatty endpoints in render loops.
- Streaming/pending states for slow backends ([ux.md](ux.md)).

## Canvas / 3D / animation

- Cap device pixel ratio (e.g. 1.0–1.25) and frame rates per context (idle vs scrolling vs hidden).
- Dispose geometries, materials, textures before renderer dispose; one WebGL context per feature.
- Pause render loops when offscreen/hidden.
- Prefer CSS transforms for simple motion; canvas only when needed.

## Data layer

- Column whitelists / narrow selects ([../backend/data-and-schema.md](../backend/data-and-schema.md)).
- No N+1 queries; batch `IN` lookups.
- Cache public reads (ISR/CDN) instead of per-request queries.
- Guard against render amplification: bot traffic + uncached dynamic pages = egress blowup ([../lessons/ui-ux.md](../lessons/ui-ux.md)).

## Definition of done for perf work

- Before/after numbers documented in the PR.
- No budget exceeded; if exceeded, explicit justification + follow-up issue.

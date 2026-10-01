# Lessons — UI/UX

Load for: scroll, overlays, mobile, realtime UI, media issues. Consolidated, anonymized.

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| 2026-09 | Scroll | Never blanket-prevent smooth scroll on carousels/grids; prevent only real nested vertical scrollports (measured overflow, not class names). | high |
| 2026-09 | Scroll | Horizontal-only overflow must not dead-zone page scroll. | med |
| 2026-09 | Scroll | Set either lerp OR duration+easing on smooth scroll, never both (steppy wheel). | low |
| 2026-09 | Scroll | Don't mix a smooth-scroll library with a second scroll engine (ScrollTrigger etc.) unless deliberately synchronized. | med |
| 2026-09 | Scroll | `whileInView` + `opacity: 0` initial can leave content invisible under smooth scroll — prefer `animate` or reduced-motion guards. | high |
| 2026-09 | Overlays | Portaled overlays MUST mount to `body`: transformed/filtered ancestors become containing blocks and break fixed positioning. | high |
| 2026-09 | Overlays | After ANY z-index change, audit all portaled overlays (date pickers, selects, tooltips) — they stack above dialogs. | high |
| 2026-09 | Overlays | Smooth scroll `stop()` preventDefaults wheel on window — scroll regions inside overlays need explicit scroll-prevent. | med |
| 2026-09 | Overlays | One overlay at a time; overlay state keyed by session, not by whole-object identity (prevents empty modals). | med |
| 2026-09 | iOS | `position: fixed` + backdrop-filter scrolls along with the page on iOS — bottom bars belong in-flow. | high |
| 2026-09 | Mobile | Hiding a resizable panel group with CSS fails (inline flex) — mount conditionally on large viewports. | med |
| 2026-09 | Mobile | Compact toolbar + overflow menu beats wrapped icon walls on small screens. | low |
| 2026-09 | Mobile | Huge data-URL videos are rejected by iOS — use blob URLs + CSP `media-src blob:`. | med |
| 2026-09 | Realtime | One owner per realtime subscription; unique channel topics per mount; register handlers before subscribing. | high |
| 2026-09 | Realtime | Handlers in refs; lift shared subscriptions to a provider — duplicate subscriptions on a singleton client leak. | med |
| 2026-09 | Web Push | Push subscribe/upsert needs a privileged server path (endpoint is globally unique); keep the in-app notification path as source of truth. | med |
| 2026-09 | PWA | Service workers/badges are only testable on deployed HTTPS; provide a re-open path for the install prompt after dismissal. | low |
| 2026-09 | Media | Canvas white-logo processing: document the pipeline; CSS filters/masks break on some marks — use a canvas silhouette pipeline. | med |
| 2026-09 | Media | Dispose geometries/materials/textures before renderer dispose; one WebGL context per feature. | med |
| 2026-09 | Images | Accurate `sizes` + `priority` only for LCP; double-proxying images breaks caching and costs quota. | med |
| 2026-09 | Charts | Chart libraries need explicit accessible names + fallback data; never `hsl(var(--token))` when the token holds hex/oklch. | low |
| 2026-09 | Fonts | Brand fonts may lack glyphs (`… — ●`) — ASCII-only chrome or a fallback font for those characters. | low |
| 2026-09 | Motion | An explicit "full motion" user setting may override OS reduced-motion, but `off` must always win. | low |

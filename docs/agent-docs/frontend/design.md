# Frontend — Design

Load for: tokens, color, typography, spacing, themes, motion policy.

## Token SSOT

- ONE token source (CSS variables / theme file). Components consume tokens, never raw values.
- NEVER private hex/rgb values inside components. Exceptions require a comment and a follow-up debt entry.
- Tokens are semantic: `surface-elevated`, `text-muted`, `brand-primary` — not `gray-700` in usage code.
- Token changes are additive; removals require a migration pass ([../core/regression.md](../core/regression.md)).

## Color

- Semantic roles: background, surface, card, border, foreground, muted, primary, accent, destructive, ring.
- Destructive color is reserved for destructive/error semantics — never for decoration.
- Contrast is verified, not estimated: normal text ≥ 4.5:1, large text ≥ 3:1 ([accessibility.md](accessibility.md)).
- Status sets (success/warning/error) exist for light AND dark mode as paired sets.
- NEVER encode meaning by color alone (icons/text accompany status color).
- Brand/tenant values (name, logo, colors) come from config — NEVER hardcoded strings in components.

## Typography

- One type scale with semantic names (`text-hero`, `text-heading`, `text-body`, `text-body-sm`), clamp-based for responsive sizes.
- Reading text ≥ 12–14 px; chrome/footer micro type is forbidden.
- Fonts: self-hosted or licensed sources only; no runtime CDN fonts without consent review ([../legal/legal-maintenance.md](../legal/legal-maintenance.md)).
- Headings use the heading token family; body/mono separated via tokens.

## Spacing, radius, elevation

- Semantic spacing scale (`py-section`, `p-card`, `gap-inline`), no arbitrary pixel values in feature code.
- Radius and shadow via tokens; no per-component magic values.
- Elevation communicates layering; combined with the z-index contract ([scroll-motion.md](scroll-motion.md)).

## Themes & dark mode

- Theme = token set swap, not per-component conditionals.
- Dark mode remaps surfaces AND text tokens together; NEVER remap only backgrounds.
- Theme previews apply declaratively (e.g. injected `<style>`), never by mutating root inline styles ad hoc.
- User preference persists; hydration-safe reads only ([../lessons/web-platform.md](../lessons/web-platform.md)).

## Motion policy

- Three levels: `full` | `reduced` | `off`. `reduced` keeps only essential feedback animations; `off` disables all.
- OS `prefers-reduced-motion` maps to at least `reduced`; an explicit user setting may override the OS, but `off` always wins.
- Motion must be interruptible; no animation blocks input.
- One motion system per repo; do not stack two animation runtimes on the same element.

## Brand assets

- Logo variants (light/dark, compact) live as assets with documented usage.
- Logo sizing uses dedicated variables (desktop/mobile), `height: auto`, never upscaled beyond source resolution.
- Third-party/partner logos: normalize via a documented pipeline (silhouette/contrast), never CSS filters that break on some marks ([../lessons/ui-ux.md](../lessons/ui-ux.md)).

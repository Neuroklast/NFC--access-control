# Frontend — Scroll & Motion

Load for: scroll behavior, overlays, carousels, video scrubbing, z-index.

## Scroll ownership decision tree

1. **Public route** → smooth-scroll library (e.g. Lenis) owns page scroll. NEVER add `overflow-y-auto` to page-level wrappers.
2. **Dashboard route** → native scroll via the app shell. NEVER `min-h-screen` or root-level `overflow-y-auto` on content pages.
3. **Scrollable panel inside a page** → dedicated scroll-panel primitive.
4. **Full-bleed tool page** → shell `fill` layout, native inner scroller.
5. **Wide table** → horizontal scroll wrapper with `overflow-x-auto overflow-y-clip` — never plain `overflow-x-auto` alone.
6. **Carousel/Swiper** → keep vertical wheel on the page; horizontal drag/axis-aware wheel for slides (`touch-action: pan-y`). NEVER blanket-prevent on the whole widget.
7. **Modal body / real nested vertical scrollport** → `overflow-y-auto max-h-[70vh]` + scroll-prevent attribute. NEVER use prevent because "the component is heavy".
8. **After any scroll change** → run the repo's scroll contract check ([../testing/contracts-ci.md](../testing/contracts-ci.md)).

## Scroll-prevent contract

- Prevent the smooth-scroll library only for elements with **real vertical overflow**.
- NEVER match Tailwind class substrings; measure computed overflow (`scrollHeight > clientHeight`) and axis.
- Horizontal-only overflow MUST NOT block page scroll.
- Content inside scroll panels is keyboard reachable; Escape/keys unaffected.

## Z-index / overlay contract

- ONE z-index token system; feature code uses tokens, NEVER raw numbers.
- Layers (typical): base < content < sticky < overlay < system < top.
- Token values live in the theme only (e.g. dialog 9998/9999, portaled pickers 10000) — after ANY z-index change, audit all portaled overlays (date pickers, selects, tooltips).
- Negative z-index requires `isolation: isolate` on the section.
- Fixed-position overlays portal to `body` — `transform`/`filter`/`backdrop-filter` ancestors create containing blocks that break them.
- One overlay at a time; overlay state lives in a session key, not a whole object.

## Smooth scroll (Lenis et al.)

- Exactly ONE provider. NEVER two scrollers or a second smooth-scroll system.
- Configure either lerp OR duration+easing, never both (steppy wheel).
- Keep native scrollbar, anchor links, and reduced-motion behavior intact.
- `syncTouch: false` where touch ghosting is observed.
- Clear `will-change` after animations; no `getComputedStyle` in scroll handlers.
- Stop/start scroll when overlays open/close; restore position on close.

## Motion VFX budget

- Gate expensive effects behind a scrolling state (e.g. `html[data-scrolling="1"]`) instead of blocking scroll.
- Pause canvas/animations when hidden (`visibilitychange`, IntersectionObserver).
- One animation runtime per element; no GSAP ScrollTrigger beside a smooth-scroll library unless synchronized deliberately.

## Video scrubbing

Scroll-bound video is implemented per [../skills/video-scrubbing/SKILL.md](../skills/video-scrubbing/SKILL.md) (frame-sequence/WebCodecs canvas, reduced-motion poster, mobile memory budget). Do not drive `HTMLVideoElement.currentTime` from a scroll handler by default.

## Multi-column builders

- NEVER hide a resizable panel group with CSS alone — mount it conditionally on large viewports.
- Toolbars compact with overflow menu on mobile, not wrapped icon walls.
- Run the repo's mobile-layout contract check after changes.

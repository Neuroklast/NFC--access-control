# Frontend — Accessibility

Load for: all public UI. Baseline: WCAG 2.1 AA (WCAG 2.2 where required).
Legal relevance (BFSG/EU) in [../legal/compliance-de.md](../legal/compliance-de.md).

## Semantics

- Semantic HTML first: `button` for actions, `a` for navigation, `nav/main/header/footer` landmarks, real lists for lists.
- One `h1` per page; heading levels in order.
- NEVER fake interactivity with `div` + click handler without role, tabindex, keyboard handling.
- Tables for tabular data; definition lists for key/value pairs.

## Keyboard & focus

- Every interactive element reachable and operable by keyboard.
- Visible focus indicator (≥ 2 px, high contrast). NEVER remove outlines without a visible replacement.
- Focus order follows visual order. Skip link to main content on public pages.
- Modals/dialogs: focus trap, Escape closes, focus returns to the trigger.
- Custom widgets (menus, comboboxes, trees) follow ARIA authoring patterns for key handling.

## Names & labels

- All form fields have programmatic labels (`label[for]` or `aria-label`).
- Icon-only buttons have `aria-label`; decorative icons `aria-hidden="true"`.
- Images: meaningful `alt`; purely decorative `alt=""`. NEVER `alt` on CSS backgrounds — use real images.
- Links describe the destination; NEVER "click here".
- Buttons describe the action; confirmations name the object.

## Forms & errors

- Errors: `aria-invalid` + `aria-describedby` pointing at the message; message text is specific.
- Required state programmatic (`required` / `aria-required`).
- Error summary at top for long forms; focus moves to the first error.
- NEVER rely on placeholder as label.

## Color & contrast

- Normal text ≥ 4.5:1, large text ≥ 3:1, UI components/graphics ≥ 3:1.
- Verify with tooling, never estimate. Check both themes.
- Meaning never conveyed by color alone.

## Motion & media

- `prefers-reduced-motion: reduce` → no mandatory animation ([scroll-motion.md](scroll-motion.md), [design.md](design.md)).
- Auto-playing media: no autoplay with sound; provide pause/stop for moving content > 5 s.
- Videos: captions where they carry information.
- Video that scrubs with scroll MUST degrade to a static poster under reduced motion.

## Touch & zoom

- Touch targets ≥ 44×44 px on public UI; ≥ 26 px in dense tool chrome with documented exception.
- Layout usable at 200% zoom and 320 px width without loss of content/function.
- NEVER `user-scalable=no`.

## Dialogs & overlays

- Overlay content is portaled to `body` where containing blocks break fixed positioning ([scroll-motion.md](scroll-motion.md)).
- Background content `aria-hidden`/inert while a modal is open.
- Overlay scroll regions get `data-lenis-prevent` or equivalent ([scroll-motion.md](scroll-motion.md)).

## Testing evidence

- Keyboard-only pass, axe/Lighthouse pass, 200% zoom pass, screen reader spot check (NVDA/VoiceOver) for new flows.
- Record evidence in the QA checklist for public-facing changes.

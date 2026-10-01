---
name: frontend-ui
description: UI implementation workflow for user-facing frontend work. Use when building or changing components, pages, forms, dialogs, lists, or any UI state — covers tokens, primitives, the four states, and the accessibility pass.
---

# Skill — Frontend UI

## Workflow

1. Read [../../frontend/ui.md](../../frontend/ui.md), [ux.md](../../frontend/ux.md), [design.md](../../frontend/design.md), and — if scroll/overlays involved — [scroll-motion.md](../../frontend/scroll-motion.md).
2. Locate the existing pattern: is there a primitive/registry entry for this? Extend it.
3. Write the component test for the DOM contract first where feasible ([../tdd-extraction/SKILL.md](../tdd-extraction/SKILL.md)).
4. Implement using tokens and primitives only.
5. Check the four states: loading, empty, error, success.
6. Accessibility pass: keyboard, focus, labels, contrast ([../../frontend/accessibility.md](../../frontend/accessibility.md)).
7. Run the repo's UI contract checks (scroll, overlay, mobile-layout).

## Checklist

- [ ] No raw colors/sizes — tokens only.
- [ ] No hardcoded user-visible strings — i18n system.
- [ ] Icon-only buttons have `aria-label`.
- [ ] Touch targets ≥ 44 px (public UI).
- [ ] Reduced motion respected.
- [ ] Lists paginated/windowed; no unbounded DOM.
- [ ] Images with dimensions; LCP image prioritized.
- [ ] Dialogs: focus trap, Escape, restore; portal to body where needed.
- [ ] Mobile pass at 320 px + 200% zoom.

## NEVER

- Second implementation of an existing primitive.
- UI-only authorization (server re-checks).
- `alert()`/`confirm()`; use the repo's dialogs/toasts.
- Editing vendor UI primitives directly — wrap them.
- Adding a new UI/state library without human approval.

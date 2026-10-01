# Frontend — UX

Load for: interaction states, feedback, errors, confirmations.

## Required states for every async surface

| State | Requirement |
| --- | --- |
| Loading | Skeleton or spinner in the final layout position; never a blank page |
| Empty | Explains why + next action; never a bare "No data" |
| Error | Human message + retry action; no stack traces/codes ([../backend/api.md](../backend/api.md)) |
| Success | Confirmation that names what happened |
| Partial | Show what loaded; isolate failures (per-section error boundaries) |

## Feedback

- Use the repo's toast/notification primitive. NEVER `alert()` / `confirm()`.
- Toasts: short, action-named ("Invoice sent"), never technical ("POST 200").
- Destructive actions: confirmation dialog naming consequences and related records.
- Long operations: progress state, not silent waiting. Optimistic updates only when rollback is defined.

## Forms

- Validate on submit; re-validate on blur for fields already touched.
- Server errors map back to the field when possible; otherwise a form-level message.
- Disable submit while pending, but NEVER disable inputs during submit (fields get dropped from submissions in native form flows).
- Preserve user input on failure.
- Required markers + `aria-required`/`required` consistent ([accessibility.md](accessibility.md)).

## Navigation & state

- Deep-linkable state: filters, tabs, and selected records in the URL when users share or reload that state.
- Browser back must not lose unsaved work silently; warn or autosave.
- Modals/drawers: Escape closes, focus returns to the trigger ([accessibility.md](accessibility.md)).
- One overlay at a time; opening a new one closes the previous ([scroll-motion.md](scroll-motion.md)).

## Copy & errors

- Error messages: what happened + what to do. No blame, no jargon, no internals.
- NEVER expose internal identifiers, SQL, or stack details.
- Empty/error copy is localized like all UI text.
- Confirmations name the object: "Delete artist 'X'?" not "Are you sure?".

## Motion & reduced motion

- Respect `prefers-reduced-motion`; motion policy per [design.md](design.md).
- No motion that blocks interaction or delays feedback.
- Loading spinners may rotate; decorative animation must not be mandatory to understand state.

## Performance perception

- Skeletons match final layout to avoid layout shift.
- Instant feedback on click (pressed state) even when the network is slow.
- Debounce inputs that trigger server calls (~300 ms); show pending state.
- NEVER make the user wait for non-essential data before showing primary content.

## NEVER

- Silent failures (no message, no log, no state change).
- Auto-dismissing error messages the user must read.
- Blocking the whole page with an overlay for a local failure.
- Optimistic UI without a defined rollback path.

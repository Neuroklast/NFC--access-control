# Frontend — UI

Load for: any UI work (pages, chrome, lists, forms).

## Chrome & layout

- ONE chrome pattern per surface area (public / dashboard). Shared primitives, no second header or sidebar.
- Desktop and mobile navigation are separate components, not one component with `matchMedia` hacks.
- Persistent frames use viewport height: header `sticky shrink-0`, content `flex-1 min-h-0` with its own scroller, footer outside the scroller.
- Bottom navigation (mobile): in-flow (`shrink-0`), NEVER `position: fixed` + backdrop-filter (iOS scroll bugs).
- Content pages NEVER set their own `max-w-*` inside a shell that already constrains width.

## Lists

- ONE list primitive per repo; extend it instead of building a second.
- Whole-row click target + chevron affordance; explicit action buttons only for destructive/rare actions.
- Filter + pagination/windowing are part of the list, not the page shell.
- Empty state: centered, explains why it is empty and the next action.
- Zebra striping or dividers, but not both. Compact grouping rows (max 4–5 chips + "+n more").
- Wide tables: horizontal scroll wrapper with `overflow-y-clip` to avoid vertical dead zones ([scroll-motion.md](scroll-motion.md)).

## Forms & detail views

- Uniform detail/edit pattern: view → edit → save; no inline expanders for complex records.
- Save: validate → on success close → on failure stay open with a human error message.
- Cancel always closes without side effects.
- Destructive actions require confirmation naming the consequence and related data.
- Button vocabulary is fixed and translated: Create, Details, Edit, Save, Cancel, Deactivate, Delete, Close.
- Icon-only buttons MUST have `aria-label` ([accessibility.md](accessibility.md)).

## Content & data display

- Read-only data as definition lists or key/value rows, not disabled inputs.
- NEVER show internal identifiers, warehouse layer names, or raw error codes to end users.
- Charts: label axes, accessible name (`role="img"` + label), sr-only data table where feasible.

## Authorization in UI

- NEVER rely on hidden UI for authorization. The server re-checks every mutation ([../backend/auth.md](../backend/auth.md)).
- Hide/disable actions the user cannot perform, but treat that as UX only.

## Responsive

- Mobile-first base classes; desktop overrides via breakpoints. NEVER rewrite base classes for desktop fixes.
- Touch targets ≥ 44×44 px on public UI ([accessibility.md](accessibility.md)).
- Long labels wrap or truncate deliberately; test the longest real translation.
- Builders/multi-column editors: mount resizable panels only on large viewports ([scroll-motion.md](scroll-motion.md)).

## Internationalization

- NEVER hardcode user-visible strings; use the message system of the repo.
- Every locale must render every key — CI parity check where available.
- Dates/numbers via locale formatters, never manual string building.
- Language switch reloads/navigates fully when the framework requires it; no partial refresh hacks.

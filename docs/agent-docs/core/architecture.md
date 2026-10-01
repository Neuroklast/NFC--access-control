# Core — Architecture

Load for: new modules, features, refactors, structural decisions.

## Layers

```text
presentation (UI, routes, handlers)
   → application (use cases, orchestration)
      → domain (pure rules, entities, contracts)
         → data (repositories, ORM, external clients)
```

- Dependencies point one direction only. NEVER reverse, no cycles.
- Domain layer: no framework imports, no ORM, no cookies/request objects.
- Data access behind repository/service interfaces; routes and UI call the interface, not the ORM.
- Record structural decisions as ADRs ([../templates/ADR.md](../templates/ADR.md)).

## Write/read matrix (CQRS-style)

| Surface | Pattern |
| --- | --- |
| Public reads | Cache/ISR-friendly, cookie-free clients, column whitelists |
| User writes | Route handler/action: authenticate → validate → authorize → mutate → invalidate |
| Admin writes | Same, plus audit trail and capability check |
| Cron/jobs | Idempotent, single-flight lease, bounded runtime, logs |
| Webhooks | Verify signature first; webhook is the source of truth, not the redirect |

- Mutations ALWAYS re-check authorization server-side. A middleware/proxy redirect is a UX gate, not a security gate.

## Inversion of control (UI)

- Leaf components receive props; NEVER read global context in leaves.
- Contracts as typed interfaces (`SectionProps`, `AdminPanelProps`, …) so renderers stay swappable.
- Registries (fields, sections, designs) as single dispatch tables — no scattered conditionals.

## State

- Server state lives on the server; client state is UI-only.
- ONE state solution per concern. NEVER add a second state library "next to" the existing one.
- Forms: schema-validated, one source of truth for validation (shared client/server schema).

## Module boundaries

- One module = one responsibility + a public surface (exports).
- Internal helpers stay unexported. NEVER deep-import other modules' internals.
- Shared utilities live once, in the lowest layer that can host them.

## SSOT (single source of truth)

- One source per fact: brand name, legal data, limits, routes, cache tags, env schema.
- Derived values are computed, never duplicated as literals.
- Config that the UI displays comes from config, not hardcoded strings.

## Naming & layout

- Group by domain, not by type, once a folder exceeds ~10 files.
- Tests co-located or in a mirrored `tests/` tree — pick one per repo.
- Public surface of a module documented in its index/README.

## NEVER

- God objects/files; hidden globals; two auth systems; two schema sources; second state library.
- Framework code in domain logic; business rules in UI components.
- Feature-specific special cases inside generic layout code (fix the model, not the symptom).

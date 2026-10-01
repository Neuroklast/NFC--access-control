# Testing — Strategy

Load for: planning tests, deciding what to test.

## Pyramid

| Level | Scope | Runs |
| --- | --- | --- |
| Unit | Pure logic, rules, formatters, validators | Fast, every change |
| Integration/component | Services + mocks, UI primitives | Every change |
| Contract | Wiring, schema, RLS, CI invariants | CI |
| E2E | Critical user flows against a real stack | PR/CI, seeded |
| Manual QA | Non-automatable flows (visuals, hardware, legal) | Release checklist |

## What to test when changing X

| Change | Minimum tests |
| --- | --- |
| Domain rule | Happy path + edges (boundaries, empty, invalid) |
| API endpoint | Happy + 401/403 + validation failure |
| Schema/RLS | RLS probe + deny tests ([contracts-ci.md](contracts-ci.md)) |
| Shared primitive | Behavior test (open/close/keyboard) — source contracts are not enough |
| Serializer/mapper | Sensitive fields present/absent per audience |
| Export/PDF | Renders, correct content, denied without permission |
| Money/invoice logic | Amounts, rounding, idempotency, immutability |
| Bugfix | A test that would have caught the bug |

## Principles

- Test behavior, not implementation details. NEVER assert on internal call counts unless that IS the contract.
- Tests must be deterministic: no network, no wall-clock dependencies, no order dependence.
- Every new service: cover dev/mock mode and empty-data mode where the repo has those.
- Prefer contract tests (few, named asserts) over assertion spam in loops.
- Test integrity: [../core/workflow.md](../core/workflow.md).

## Test data

- Tests create their own data with a unique prefix and clean up unconditionally.
- NEVER mutate seeded fixtures.
- NEVER use production data in tests.
- Seeds for E2E are versioned with the schema.

## Flaky tests

- A flaky test is a bug: fix or quarantine with a tracked issue, never ignore silently.
- Typical causes: timing, shared state, parallel workers, locale/timezone, animations.
- Re-run locally before blaming CI.

## Manual QA

- Keep a QA checklist per release with testable flows ([../checklists/release.md](../checklists/release.md)).
- Manual steps document role, precondition, steps, expected result.
- Evidence (screenshots/notes) for visual and accessibility checks.

## Coverage

- Floors and exclusions per [../core/quality.md](../core/quality.md).
- Critical paths are tested even when excluded from metrics.

## Runner conventions

- Unit/component: [unit.md](unit.md). E2E: [e2e.md](e2e.md). CI gates: [contracts-ci.md](contracts-ci.md).
- NEVER run watchers in agent sessions.

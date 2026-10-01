# Testing — E2E

Load for: Playwright-style end-to-end tests.

## Stack & isolation

- Tests run against a real seeded stack (local DB/storage), not mocks.
- `workers: 1` when tests share a database or rate limits. Parallel only with full isolation.
- Every test creates its own entities with a unique prefix (e.g. `e2e-<testId>`) and cleans up unconditionally.
- NEVER mutate seeded fixtures — they are shared and versioned with the schema.
- Grants/fixtures/seed scripts are part of the repo, applied before the run.

## Section-spec contract (mandatory for new routes)

Minimum assertions per route:

1. Route mounts (200, no redirect to login for authorized roles).
2. Authorization: anonymous/other roles bounced as intended.
3. Renders its heading/landmark.
4. No error boundary (`app/error.tsx` equivalent) triggered.
5. No unresolved i18n key text visible.

Behavioural tests on top for real interaction (happy path).

## Auth in tests

- Reuse the shared auth helpers. NEVER re-implement login per spec.
- Wait on URL **pathname**, never a full-URL substring (`returnTo=/x` falsely satisfies substring waits before the cookie is written).
- Prefer storage-state reuse over UI login where the stack supports it.

## Selecting elements

- Role/label/text first; `data-testid` only when semantics are unavailable.
- NEVER assert on CSS classes or DOM structure.
- Text assertions use the test locale explicitly.

## Stability

- No arbitrary sleeps; wait on network/UI conditions.
- Disable animations/overlays that are irrelevant to the flow (via test config, not production code).
- Fixed timezone/locale per run.
- Screenshots/traces on failure, uploaded as CI artifacts.

## Local footguns

- Dev server reuse can silently serve a stale build — kill the port or use a fresh build for E2E.
- Seeded stacks and rate limits are shared: unique prefixes + cleanup are not optional.
- Port collisions: check before starting; never assume port 3000 is yours.

## Coverage tracking

- Keep a coverage file per repo: specs, flows covered, known failures, open questions.
- New feature/route → spec in the same change. Changed feature → update assertions to the new intended behavior.
- Test integrity: [../core/workflow.md](../core/workflow.md).

## CI

- E2E matrix per browser/project where budget allows; otherwise desktop + one mobile viewport.
- Performance-sensitive specs separated from functional ones.
- Failure logs/artifacts uploaded; run idempotent (re-run cleans state).

# Testing — Unit

Load for: unit/component tests (Vitest/Jest style).

## Conventions

- Node environment for logic; jsdom/happy-dom only for DOM tests.
- Co-located tests (`*.test.ts[x]`) or a mirrored `tests/` tree — one convention per repo.
- Test names describe behavior: `returns 409 when a draft already exists`.
- One behavior per test; arrange/act/assert readable without comments.

## Mocking

- Mock at the boundary (network, clock, storage), not internal modules.
- Hoisted mock factories where the runner requires it (`vi.hoisted`).
- NEVER mock the thing under test.
- Chainable DB client mocks: implement thenable chains deliberately (one shared mock helper).
- Reset modules when testing env-dependent flags (`vi.resetModules()` + dynamic import).
- Time: fake timers or injected clocks; NEVER `sleep` in unit tests.

## Environment

- Mock browser storage in Node versions where it is broken/incomplete (localStorage/sessionStorage).
- Deterministic locale/timezone: set explicitly or inject formatters.
- No real network. No real filesystem outside temp dirs.

## Component tests

- Query by role/label/text (accessibility-first), not by CSS class.
- Assert on user-visible states: loading, empty, error, success.
- Keyboard interactions for interactive primitives (Enter/Space/Escape/Tab).
- Destructure `container` only when unavoidable.

## Async

- Await state updates explicitly (`act`, `findBy*`, `waitFor`).
- Guard post-async `setState` with an `isMountedRef` in components that fetch.
- Clear timers/intervals in cleanup.

## Coverage

- Thresholds per [../core/quality.md](../core/quality.md).
- Excluded orchestration still gets targeted tests for risky branches.
- Coverage output must be deterministic (no snapshot drift).

## Anti-patterns

- Snapshot tests of whole trees without review.
- Testing private functions through `as any` access.
- Shared mutable state between tests.
- Tests that pass when the feature is deleted (assertion-free tests).

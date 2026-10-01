# Stack — TypeScript

Load for: `.ts`/`.tsx`/`.js`/`.jsx`. Repo formatter/linter rules win over this file.

## Commands

- Use the repo's scripts; typical: `npm run typecheck`, `npm run lint`, `npm test -- --watch=false`.
- NEVER start watchers in agent sessions.

## Rules

- `strict` mode respected. NEVER `@ts-ignore`. If a library bug blocks the fix, use `@ts-expect-error` with a comment linking the issue.
- NEVER introduce `any`. Use `unknown` + narrowing; validate external payloads with the repo's schema library (Zod/Valibot/ArkType) — never add a second one.
- Explicit return types on public functions and package exports.
- Named exports for app code; default exports only where the framework requires them.
- NEVER deep-import package internals (`src/internal/*`) or unexported paths.
- NEVER TypeScript `enum` for simple variants — string-literal unions or `as const`.
- `JSON.parse` and external payloads start as `unknown`.
- No `console.log` in production paths.
- Prefer `satisfies` over casts; prefer type guards over `as`.

## Imports

- Path aliases exactly as `tsconfig.json` defines them.
- No cycles between `ui` ↔ `domain` ↔ `data` layers.
- Type-only imports where supported (`import type`).

## Zod / schema validation (typical usage)

- One schema per payload; infer types from schemas (`z.infer`) instead of duplicating interfaces.
- Validate at boundaries: env, API input, storage/DB JSON, webhooks.
- NEVER `schema.parse` untyped data and then trust the original object.

## React/JSX specifics

- Hooks at top level only; functional `setState` updaters for derived updates.
- `useEffect` for synchronization with external systems, not for derived state.
- Stable refs for single-init effects; `useCallback` ordering matters for dependencies.
- See [../lessons/web-platform.md](../lessons/web-platform.md) for hydration and control-flow pitfalls.

# Core — Clean Code

Load for: writing or reviewing any code.

## Naming

- Names reveal intent: `invoiceLineItems`, not `data` / `list2` / `tmp`.
- Components `PascalCase`, functions/variables `camelCase`, route paths `kebab-case`, constants `SCREAMING_SNAKE_CASE` only for true constants.
- Booleans read as predicates: `isActive`, `hasPermission`, `canEdit`.
- NEVER abbreviations unless domain-standard (`id`, `url`, `dto`). No single letters except loop indices.
- One concept, one name — everywhere. Renaming a concept = rename all occurrences in the same change.

## Size & structure

| Unit | Soft limit | Hard signal |
| --- | --- | --- |
| File | ~400 lines | Review for split by responsibility |
| Function | ~40 lines | Multiple purposes → extract |
| Params | ~4 | Parameter object |
| Nesting | ~3 levels | Early returns / guard clauses |

- One responsibility per file. One exported concern per module.
- No dead code, no unused exports, no unreachable branches.
- No commented-out code — git history is the archive.

## Errors

- Explicit error objects/types. NEVER stack traces or internal messages to end users.
- NEVER empty `catch`. Either handle, rethrow with context, or log deliberately.
- NEVER swallow control-flow errors (e.g. framework redirect/not-found signals) in generic try/catch.
- Fail fast at boundaries; validate external input once, at the edge.
- Distinguish user errors (4xx, actionable message) from system errors (5xx, generic message + internal log).

## Comments

- Comments explain **why**, never **what**.
- No commented-out code, no changelog comments (`// added 2026-09`), no author tags.
- Document non-obvious invariants and workarounds with a link to the issue.

## Dependencies & abstraction

- YAGNI: no abstraction without a second concrete use case. Filter: [../skills/anti-overengineering/SKILL.md](../skills/anti-overengineering/SKILL.md).
- Rule of three before extracting a shared helper.
- NEVER speculative features, single-use factories/registries/strategies, or config for one known value.
- NEVER strip validation, auth, or security checks to "simplify".
- Dependency direction: UI → domain → data. NEVER reverse, no cycles.
- NEVER introduce a library the task does not require. Check the repo for an existing solution first.
- Wrap third-party primitives; never edit vendor files directly (see [../frontend/components.md](../frontend/components.md)).

## Constants & configuration

- No magic numbers or strings: named constants, config from a single source.
- Environment-dependent values come from validated env access, not scattered `process.env` reads.
- Feature flags live in one registry, documented and removable.

## Language rules

- TypeScript: see [../stack/typescript.md](../stack/typescript.md). C/C++: see [../stack/cpp-juce.md](../stack/cpp-juce.md).
- ALWAYS strict mode / equivalent. NEVER disable checks to make code compile.
- Public functions have explicit return types.

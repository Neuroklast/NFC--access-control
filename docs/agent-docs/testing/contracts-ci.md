# Testing — Contracts & CI

Load for: CI pipelines, contract scripts, structural gates.

## Principle

**Structural gates beat prose bans.** If a rule matters, encode it as a script that fails CI — not as a paragraph an agent can ignore.

## Contract script patterns

| Script kind | Checks |
| --- | --- |
| `check:*` | Source scanning: forbidden patterns, required imports, overlay/z-index, scroll rules, brand strings, i18n parity, hardcoded colors |
| `verify:*` | Data/DB invariants: RLS enabled, schema columns match types, API contracts vs OpenAPI |
| `audit:*` | Dependency audit, license scan, secret scan |
| `perf:*` | Bundle budget, Lighthouse assertions, performance budgets |
| `db:compat` | Old client reads new schema (forward compatibility) |
| `db:verify` | Live schema vs declared schema |

Rules for writing them:

- Deterministic, fast, no network unless explicitly an integration check.
- Clear failure output: file, line, rule, how to fix.
- Exclusions are explicit allowlists with a reason, never silent skips.
- Baseline counts (e.g. hardcoded-string baseline) may only shrink — CI enforces the direction.

## CI pipeline layout

- Parallel jobs where independent: `lint+contracts`, `typecheck`, `test`, `build`.
- E2E as a separate job/matrix with a seeded stack; not on every push if cost-heavy (PR + main).
- Path filters for expensive jobs (e.g. Lighthouse only on UI paths).
- Build once, reuse artifacts where the platform allows.
- Pin runner versions, action versions, and tool versions.
- NEVER let a job pass on warnings-only when the rule matters (set `--error`/`--max-warnings 0` deliberately).

## Gates

- Merge blocked on: lint, types, unit tests, contract scripts, build.
- Secret scan + SAST as separate required jobs.
- Dependency audit: critical blocking, high visible (policy per repo).
- E2E required for PRs touching user flows; deferral only as an explicit, reasoned exception recorded in the PR.

## OpenAPI contract

- Spec generated from code where possible; hand-edited YAML forbidden.
- `verify:api-contracts` (or equivalent) fails when routes and spec diverge.
- Every endpoint change updates the spec in the same PR ([../backend/api.md](../backend/api.md)).

## Failure artifacts

- Upload logs, traces, screenshots, coverage on failure.
- Link artifacts in the PR/CI summary.
- Never debug CI by pushing blind commits — reproduce locally first.

## Agent rules

- Run the same gates locally that CI runs, before pushing.
- Unavailable checks are named explicitly ([../core/workflow.md](../core/workflow.md)).
- Fixing CI by disabling a check is forbidden; fix the cause or change the rule deliberately with human approval.

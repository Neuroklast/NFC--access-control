# Core — Quality

Load for: reviews, Definition of Done, coverage decisions, debt tracking.

## Definition of Done

- [ ] Checks green: lint, types, tests, build (project scripts).
- [ ] Change matches the acceptance criteria / issue.
- [ ] Minimal diff; no unrequested scope. Keep validation, auth, and security checks.
- [ ] No secrets, no debug logs, no dead code.
- [ ] Tests added/updated for new or changed behavior.
- [ ] Docs updated or explicit "unchanged because …" ([docs-system.md](docs-system.md)).
- [ ] Risky surfaces checked against [regression.md](regression.md).

## Review criteria (order matters)

1. **Correctness** — does it solve the stated problem? Edge cases named?
2. **Security** — authZ on mutations, input validation, no secret/PII leaks ([../security/security.md](../security/security.md)).
3. **Tests** — do they prove behavior, not just wiring?
4. **Blast radius** — shared files/symbols touched? ([regression.md](regression.md))
5. **Conventions** — naming, layering, file sizes ([clean-code.md](clean-code.md)).
6. **Docs** — updated or explicitly unchanged.

## Coverage expectations

- Floor for core logic (domain, services, serializers): ~80% lines/branches — as a floor, not a goal.
- Critical paths MUST be tested even when excluded from coverage metrics (auth gates, money, permissions, exports).
- NEVER write tests to satisfy coverage. NEVER lower thresholds to pass.
- Excluded orchestration still needs targeted tests for its risky branches.

## Source/contract tests vs behavior tests

- Source/contract tests prove **wiring** (e.g. "route calls guard"). They can be green while behavior is broken.
- Shared primitives (list components, formatters, filters) need **behavior tests** or a documented manual proof.
- After any regression: name the fix commit and add the lesson to [../lessons/](../lessons/README.md).

## Debt register

- Keep a debt file per project with severity P0–P2 and state (open / partial / paid).
- P0 = security or data-loss risk → fix before new features.
- NEVER widen a surface (new admin route, new API) without its P0 guard in the same PR.
- Debt entries need: what, where, why deferred, trigger to fix.

## Residual risks

- Known, accepted risks are documented (e.g. CSP `unsafe-inline`, in-memory rate limits) with mitigation and revisit trigger.
- NEVER silently accept a risk. If it cannot be fixed now, write it down.

## Anti-patterns

- Coverage theater (tests that assert nothing meaningful).
- "Temporary" bypasses without an owner and a removal trigger.
- Green CI as the only quality signal — reviewers restate the issue's intent in one line and check the diff against it, not just the status checks.
- Big-bang refactors bundled with behavior changes.

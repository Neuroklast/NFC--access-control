# Core — Workflow

Load for: session loop, check pipeline, multi-agent, closeout. Not always-on.

## Session loop

1. **PLAN** — restate the task; name files, acceptance criteria, risks. For multi-file work, plan before coding (see [../skills/plan-first/SKILL.md](../skills/plan-first/SKILL.md)).
2. **IMPLEMENT** — smallest change that fully solves the task ([../skills/anti-overengineering/SKILL.md](../skills/anti-overengineering/SKILL.md)). One purpose per commit ([git.md](git.md)).
3. **TEST** — run the project's check pipeline; add/adjust tests with the change.
4. **VALIDATE** — re-read the diff against the acceptance criteria; check blast radius ([regression.md](regression.md)).
5. **DOCUMENT** — update docs or state explicitly "unchanged because …" ([docs-system.md](docs-system.md)).
6. **SHIP** — commit / PR / report. Never leave the tree in a half-done state.

## Check pipeline

- ALWAYS use the project's own scripts; read them from the manifest. Typical order:
  1. `lint` → 2. `typecheck` → 3. `test` → 4. `build`.
- Prefer the aggregate script if one exists (e.g. `npm run ci`).
- NEVER start test watchers in agent sessions. Run once, non-interactive.
- NEVER report done on failing checks. No PR with failing checks.
- If a check is unavailable locally, say so explicitly in the report. NEVER claim it passed.

## When a test goes red

- A red test on a deliberate behavior change = reconcile intent: update the test to the **new intended behavior**.
- NEVER weaken, `skip`, or delete a test just to go green.
- If a test is genuinely obsolete: delete it with a one-line reason in the diff.
- Fix root causes. Never stack workarounds on top of a failing test.

## Multi-agent protocol

- More than ~3 independent concerns → split into sub-tasks; one atomic commit each; full checks after each.
- Parallel agents MUST run in isolated git worktrees. One writer per working tree. NEVER two agents on the same tree.
- Handoff notes MUST list: exported symbols, schema changes, env changes, open TODOs.
- Separate issues per module. Never let one agent's uncommitted work block another's checks.

## Task sizing

| Size | Approach |
| --- | --- |
| 1 file, trivial | Just do it, run focused checks |
| 1 concern, several files | Plan inline, atomic commit, full checks |
| > 3 concerns | Sub-tasks with individual commits, full checks after each |
| New feature / route | Feature spec first ([../templates/feature-spec.md](../templates/feature-spec.md)), then plan, then code |

## Escalation — stop and ask the human

Approval gates for deploys, destructive migrations, data backfills, `rm -rf`, history rewrite, force-push, and secret rotation are canonical in [AGENTS.md](../AGENTS.md) §Hard rules and [../security/security.md](../security/security.md) §Least privilege. Additionally stop and ask for:

- Deviation from a safety rule (e.g. realtime/MISRA, see [../skills/c-realtime/SKILL.md](../skills/c-realtime/SKILL.md)).
- Legal text wording, operator data, pricing/contract terms.

## Failure handling

- On the second failed attempt at the same fix: stop, re-read the relevant topic file, name the wrong assumption in one line (file + what you believed), then replace it. No third patch on the same symptom.
- NEVER silently retry loops (network, CI, builds). Bound retries, log the reason, report.

## Session closeout

Order is fixed: **implement → checks → docs → commit/PR/report**.
Full checklist: [../checklists/session.md](../checklists/session.md).

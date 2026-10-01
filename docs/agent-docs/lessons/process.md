# Lessons — Process

Load for: workflow, docs, CI, release, regression issues. Consolidated, anonymized.

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| 2026-09 | Scope | Mixing bundle-fix + feature + refactor in one PR caused a chain of regressions — enforce one purpose per PR and a regression playbook. | high |
| 2026-09 | Scope | Agents over-build (single-use factories, unrequested deps, future-proofing). Checkable YAGNI beats "keep it simple"; never strip validation/auth to cut lines. | high |
| 2026-09 | Scope | A "fix" that changes UX defaults (view, order, navigation) is a feature — needs explicit request + tests. | med |
| 2026-09 | Docs | Docs are part of the deliverable every session; "code only" tasks are not exempt. | med |
| 2026-09 | Docs | Structural CI gates (`check:*`/`verify:*`) beat prose bans — encode rules as scripts. | high |
| 2026-09 | Docs | Never require "any docs file changed" as a CI gate — it produces no-op edits; use a conditional PR checklist instead. | med |
| 2026-09 | Docs | Docs must match code facts (TTLs, cookie names, processors); drift is worse than missing docs. | med |
| 2026-09 | Tests | Source/contract tests can be green while behavior is broken — shared primitives need behavior tests. | high |
| 2026-09 | Tests | A version bump cascades through contracts/backup tables/nav tests — treat it as a release, run full gates. | med |
| 2026-09 | Tests | Don't run test watchers in agent sessions; run once, non-interactive. | low |
| 2026-09 | CI | A dev server reuse can silently serve a stale build in E2E — kill the port or rebuild. | med |
| 2026-09 | CI | Never fix CI by disabling the check; fix the cause or change the rule deliberately. | high |
| 2026-09 | Release | "Merged" ≠ "shipped": verify production SHA + hard refresh after deploy. | med |
| 2026-09 | Release | In-app release notes must be updated with every version bump (contract-tested). | med |
| 2026-09 | Auth | Approve gates and idempotency belong in the data layer, not in UI flows. | high |
| 2026-09 | Ops | Backup restore must be tested on a copy; "restore exists" is not "restore works". | high |
| 2026-09 | Ops | Local dev starters should refuse remote DB/hosts and non-local storage — hard-fail, not warn. | med |
| 2026-09 | Windows | Stop dev servers before `prisma generate`/native builds (file locks, EPERM). | low |
| 2026-09 | Deps | Check dependency age/maintenance before adding; duplicated icon/animation libs bloat bundles. | low |
| 2026-09 | Security | npm audit before adding deps; never ignore critical advisories. | high |
| 2026-09 | Legal | Legal text changes follow a trigger table with dated "unchanged because" entries — no silent drift. | high |
| 2026-09 | Reviews | Never merge unreviewed AI-generated PRs; agent PRs get the same review as human PRs. | high |

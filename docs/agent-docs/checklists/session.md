# Checklist — Session Closeout

Copy into the session report. Order is fixed: implement → checks → docs → commit/PR/report.
Definition of Done: [../core/quality.md](../core/quality.md).

## 1. Code

- [ ] Change matches the task/issue; acceptance criteria met.
- [ ] Conventions followed ([../core/clean-code.md](../core/clean-code.md)).

## 2. Checks

- [ ] Lint green.
- [ ] Types green.
- [ ] Unit/integration tests green (with new/updated tests for the change).
- [ ] Build green.
- [ ] Contract scripts green (scroll/overlay/i18n/RLS/API — as applicable).
- [ ] E2E for changed user flows green (or explicitly deferred with a recorded reason).
- [ ] Unavailable checks explicitly named as "not run" ([../core/workflow.md](../core/workflow.md)).

## 3. Docs

Walk the maintenance matrix in [../core/docs-system.md](../core/docs-system.md) and the legal trigger table ([../legal/legal-maintenance.md](../legal/legal-maintenance.md)); update each affected doc or record `Docs: unchanged because <reason>`.

## 4. Git

- [ ] One purpose per commit; conventional message ([../core/git.md](../core/git.md)).
- [ ] Only intended files staged.
- [ ] No secrets/large artifacts in the diff.
- [ ] PR description: what, why, how to verify, risk, do-not-touch list.
- [ ] PR checklist filled ([pr.md](pr.md)).

## 5. Report

- [ ] Summary: what changed, where, why.
- [ ] Checks run + results.
- [ ] Open items/blockers named explicitly.
- [ ] Nothing half-done left in the working tree.

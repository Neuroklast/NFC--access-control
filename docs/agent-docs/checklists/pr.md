# Checklist — Pull Request

## Before opening

- [ ] Branch from current `main`; rebased/merged if stale.
- [ ] One purpose; fix ≠ feature; refactor separate ([../core/git.md](../core/git.md)).
- [ ] Local gates run: lint, types, tests, build (+ E2E for flows).
- [ ] Diff reviewed by yourself line by line.
- [ ] No secrets, no debug code, no unrelated files.

## PR description

- [ ] What changed (short).
- [ ] Why (link issue/ticket).
- [ ] How to verify (steps, commands, test names).
- [ ] Risk: blast radius, data/auth/UX implications.
- [ ] Do-not-touch list for risky changes.
- [ ] Screenshots for UI changes (before/after).

## Docs section

- [ ] Docs updated (list paths) **or** explicit "unchanged because …".
- [ ] CHANGELOG entry if user-visible/API/security.
- [ ] QA checklist updated for new flows.
- [ ] Schema/deploy docs if infra/env changed.

## Quality section

- [ ] Tests added/updated for the change.
- [ ] No test weakened/skipped ([../core/workflow.md](../core/workflow.md)).
- [ ] Deny tests for new guarded surfaces (401/403).
- [ ] Accessibility check for public UI changes.
- [ ] Performance note for heavy changes (before/after).

## Risk checkboxes

- [ ] Auth/permissions touched → deny tests included.
- [ ] PII/data processing touched → legal trigger table walked.
- [ ] Schema touched → idempotent + additive + RLS in same PR.
- [ ] External services touched → timeouts, retries, secrets server-side.
- [ ] UI defaults/navigation touched → regression matrix run.

## Merge

- [ ] All checks green; required reviews present.
- [ ] No force-push after review without re-request.
- [ ] Delete branch after merge.
- [ ] Verify production deploy (SHA matches merge commit, smoke check).

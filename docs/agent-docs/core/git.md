# Core — Git

Load for: branches, commits, PRs, issues, worktrees, hooks.

## Branches

- Branch from `main` (or the repo's default). Short-lived, kebab-case: `feat/x`, `fix/y`, `docs/z`, `chore/w`.
- NEVER commit directly to `main` when the repo uses PR flow.
- Delete branches after merge.

## Commits

- One purpose per commit. Fix ≠ feature. Refactor separate from behavior change.
- Message: imperative mood, concise subject ≤ 72 chars, optional body with *why*.
- Conventional Commits where the repo uses them: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- NEVER commit secrets, `.env*`, credentials, large binaries, or build artifacts (unless repo convention requires them).
- NEVER commit commented-out code or debug logging.
- NEVER `git add -A` blindly; stage only intended files.
- NEVER `--no-verify`. If a hook fails, fix the cause.

## Pull requests

- One purpose per PR. Link the issue. Describe: what, why, how to verify, risk.
- Include a **do-not-touch list** when the change is risky (files/symbols intentionally untouched).
- Small diffs merge faster and review better. Split > ~500 changed lines by concern.
- No PR with failing checks. Docs checklist included (see [docs-system.md](docs-system.md)).
- Full checklist: [../checklists/pr.md](../checklists/pr.md).

## Issues (optional)

- Templates: [../.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/) (bug, feature, task, docs). Copy into a target repo only if it uses GitHub Issues ([../skills/adopt-into-project/SKILL.md](../skills/adopt-into-project/SKILL.md)).
- Security stays private ([../SECURITY.md](../SECURITY.md)). NEVER add a public security issue template.
- PRs MUST link the issue. Prefer the matching template over a blank issue.

## Worktrees (parallel agents)

- One agent per worktree. NEVER two agents writing the same working tree.
- Worktree per concern: `git worktree add ../repo-feature-x -b feat/x`.
- Merge order matters: rebase or merge `main` before final checks.
- Handoff between agents MUST list exported symbols, schema changes, env changes.

## Forbidden without explicit human approval

- Force-push to shared branches (`main`, release branches).
- History rewrite (`rebase -i`, `filter-branch`) on shared branches.
- Deleting remote branches or tags not created in this session.
- `git reset --hard` on uncommitted work you did not create.

## Hooks

- Fix hook failures; never bypass them.
- Pre-commit: lint + format on staged files; typecheck where fast enough.
- Pre-push: typecheck + focused tests.
- Hook scripts MUST be committed and reviewable (no hidden local-only magic).

## Tags & releases

See [../checklists/release.md](../checklists/release.md). Tags are annotated (`vX.Y.Z`) and immutable once pushed.

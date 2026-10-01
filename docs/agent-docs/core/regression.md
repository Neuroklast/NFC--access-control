# Core — Regression

Load for: bugfixes, refactors, shared-file changes.

## Scope rules

- Commit/PR scope, fix vs. feature vs. refactor: [git.md](git.md).
- NEVER change UX/view defaults unless the task explicitly asks (calendar default view, nav order, sort order).
- A version bump is a release, not a commit side effect ([../checklists/release.md](../checklists/release.md)).
- Name a **do-not-touch list** in the PR for risky changes.

## Blast radius

Before editing shared files/symbols, find every usage:

```bash
git grep -l "<symbol>"
rg "<symbol>" --glob '!node_modules'
```

High-risk shared surfaces (typical):

| Surface | Risk |
| --- | --- |
| Validators / schemas | Every form |
| Serializers / mappers | Every list and detail view |
| Auth/guards | Every mutation |
| Shared list/dialog primitives | Every admin page |
| Date/format helpers | Every table and export |
| Version constants | Build, installer, in-app news |

- Changing a shared surface requires: focused tests + the manual regression matrix below.

## Manual regression matrix (12 points — adapt per project)

1. Default view unchanged (e.g. calendar opens on month).
2. Primary list loads with data and correct counts.
3. Save stays in the open dialog; cancel closes without side effects.
4. Role/permission visibility unchanged for each role.
5. Create → edit → delete roundtrip works.
6. Dashboard aggregates match list data.
7. Member/portal isolation: user A cannot see user B's data.
8. Exports/PDFs render and download.
9. Empty states and error states render.
10. Mobile layout: chrome, scroll, dialogs.
11. Cache invalidation: mutation reflects on public page after revalidate.
12. No new console errors/warnings.

## After a follow-up bug

1. Identify the fix commit (`git log -p -- <file>`).
2. Name the bundle commits that caused it (mixed concerns are the usual root cause).
3. Add a lesson row ([../lessons/README.md](../lessons/README.md)) and promote recurring ones into topic files.
4. Add/adjust a test that would have caught it.

## NEVER

- Test integrity and red-test handling: [workflow.md](workflow.md).
- Mix refactor, fix, and feature in one commit/PR ([git.md](git.md)).
- Reintroduce a removed pattern because "it worked before" — check the lesson first.

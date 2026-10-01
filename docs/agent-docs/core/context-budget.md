# Core — Context Budget

Load for: every session. This file explains how to read this collection.

## Progressive disclosure

```text
AGENTS.md (router, ≤120 lines)
  └─ one topic file (≤150 lines)
       └─ linked detail files only when referenced
```

MANIFEST.md is a maintainer index and is not part of the session read chain.

- ALWAYS read only the files the routing table names for the current task.
- NEVER read whole docs trees "to be safe". That burns context and hides the relevant rule.
- When a task spans areas, read at most 2–3 topic files plus the files those topics or the invoked skill name directly.
- Load skills only when their description matches the task.
- Subfolders get a `README.md` only when they hold a non-rule index (e.g. `lessons/`, `roles/`, `skills/`). Pure topic folders rely on `AGENTS.md` routing + `MANIFEST.md`.

## File size budgets

| File | Budget | If exceeded |
| --- | --- | --- |
| `AGENTS.md` | ≤ 120 lines | Move rules into topic files, keep only routing |
| `MANIFEST.md` | ≤ 200 lines | Index; keep rows one line, link instead of explaining |
| Topic file | ≤ 150 lines | Split by concern, register both in `MANIFEST.md` |
| Skill | ≤ 100 lines | Move detail into the linked topic file |
| Lesson entry | 1 table row | Promote recurring lessons into topic files |

Budgets are enforced by [../scripts/check-docs.mjs](../scripts/check-docs.mjs) (CI: [../.github/workflows/docs-check.yml](../.github/workflows/docs-check.yml)).

## Single source of truth per rule

- Every rule exists in exactly one file. Other files link to it.
- Before writing a rule, search for an existing one: `rg "rule phrase"`.
- When moving a rule, update all inbound links in the same change.

## Rule lifecycle (evaluation)

- Every rule needs an observed failure it prevents (incident, review finding, repeated mistake). No failure mode → no rule.
- Litmus test before adding or keeping a rule: would removing it cause a mistake the agent would not otherwise make?
- Rules that never fired are deletion candidates. Delete with the same care as adding: say why in the commit.
- NEVER add rules speculatively. Repeating what the model already knows costs tokens and can lower task success (see [../README.md](../README.md) §Why these rules).

## What belongs where

| Content | Location |
| --- | --- |
| Routing, hard rules | `AGENTS.md` |
| Definition of Done | `core/quality.md` |
| Package-specific rules (monorepo) | nested `AGENTS.md` in that package (nearest wins) |
| Process, gates, multi-agent | `core/*` |
| Technology behavior | `frontend/`, `backend/`, `stack/*` |
| Hard-won incident knowledge | `lessons/*` |
| Reusable task recipes | `skills/*` |
| One-off plans, specs, ADRs | project repo (`docs/`, `templates/`) |

## Archive policy

- See [docs-system.md](docs-system.md) — archive policy lives there, once.

## Session token hygiene

Find the smallest high-signal set. Extra tokens dilute attention (context rot).

- ALWAYS grep/glob before a full-file read. NEVER dump a tree or log "to be safe".
- Delegate exploration to a subagent; keep only the summary in the main session.
- Filter large command output (`head`, `grep`). Drop stale tool results.
- Load a skill only when its description matches. NEVER load extra topic files.
- Scope the task (files, done-check) before coding. Vague asks cause extra reads.
- Reply with the solution first. No preamble, no narration of which check fired.
- NEVER compress rule text to save tokens — that raises reasoning cost ([../README.md](../README.md) §Why these rules).
- NEVER list this collection in `opencode.json` `instructions`. The tool already injects `AGENTS.md`.
- [workflow.md](workflow.md) is on-demand (checks, multi-agent, closeout), not always-on.

## Anti-patterns

- Copy-pasting rules between files → drift. Link instead.
- Adding prose explanations to rule files → use bullets and tables.
- Growing `AGENTS.md` into an encyclopedia → it is a router.
- Keeping dead docs around without a banner → agents will trust them.

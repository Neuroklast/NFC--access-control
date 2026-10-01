# Core — Docs System

Load for: every session end, when behavior or conventions change.

## Living docs (per project repo)

| Doc | Content | Update trigger |
| --- | --- | --- |
| `CHANGELOG.md` | User-visible changes under `[Unreleased]`, cut per release | Any behavior/API/security change |
| `LESSONS_LEARNED.md` or `lessons/*` | Dated, deduplicated lessons | Any incident or recurring pitfall |
| `QA_CHECKLIST.md` | Testable flows for release QA | New/changed user-facing flow |
| `PROJECT_STATUS.md` | Current capabilities and known limits | Milestones, scope changes |
| `SECURITY.md` | Policy, residual risks, reporting | Security-relevant changes |
| `AGENTS.md` + topic files | Conventions | New/changed convention |
| `README.md` / deploy docs | Setup, env, operations | New env var, new service, new command |

## Maintenance matrix

| Change | Docs to touch |
| --- | --- |
| New feature/route | Feature docs, `QA_CHECKLIST`, `CHANGELOG` |
| Behavior change | `CHANGELOG`, `QA_CHECKLIST`; update affected docs |
| New env var / service | `README`/deploy docs, env example |
| Schema change | Schema docs, `DB_REQUIREMENTS` equivalent |
| New convention | Matching topic file + link from router |
| Legal-relevant change | [../legal/legal-maintenance.md](../legal/legal-maintenance.md) trigger table |
| Bugfix with lesson | Lessons file; promote if recurring |

## Rules

- Docs update is part of the deliverable, same as code. Skipping docs because "the task was only code" is a process failure.
- If nothing changed, state it explicitly: `Docs: unchanged because <reason>`.
- Docs MUST match code facts (TTLs, cookie names, processor names, limits, versions). Wrong docs are worse than no docs.
- One rule change edits one section; if a doc needs edits in more than two sections, split or rewrite it deliberately.
- Prefer structural gates over prose bans: if a rule matters, add a CI contract script ([../testing/contracts-ci.md](../testing/contracts-ci.md)).

## Decision log

- When a legal/compliance/architecture check happened but nothing changed, record a dated one-liner: `YYYY-MM-DD: checked <trigger>, unchanged because <reason>`.
- For this collection the log is [../DECISIONS.md](../DECISIONS.md); in a target project keep it next to the affected docs (e.g. legal maintenance file or the ADR list).

## Archive policy

- Superseded docs get a banner and move to `docs/archive/`. NEVER silently delete decision history.
- Archive docs are NEVER read as current truth ([context-budget.md](context-budget.md)).

## Version-news contract (pattern)

- In-app release notes are a code artifact (e.g. `version-history.ts`) tied to the package version by a test.
- Version bump MUST update: package version → in-app news entry → changelog heading → contract test green.
- NEVER ship a bump without the in-app news update where the product shows release notes.

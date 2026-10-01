---
name: plan-first
description: Plan before coding for any non-trivial task. Use when a task spans multiple files, adds a feature, refactors, or has unclear requirements — names files, steps, acceptance criteria, and risks before implementation.
---

# Skill — Plan First

## Steps

1. **Restate** the task in one sentence. If you cannot, ask.
2. **Find** the relevant topic files via the routing table ([../../AGENTS.md](../../AGENTS.md)).
3. **Inspect**: read the affected files and the manifests. No guessing.
4. **Write the plan**:
   - Files to create/modify (exact paths).
   - Order of steps.
   - Acceptance criteria (observable results).
   - Risks + blast radius ([../../core/regression.md](../../core/regression.md)).
   - Do-not-touch list.
5. **Check smallest diff**: can this be done with fewer files/changes? If yes, revise.
6. **Execute** only after the plan is coherent; update it when reality diverges.

## Plan quality bar

- Another agent can execute it without follow-up questions.
- Every step has a verification (command, test, observable behavior).
- Non-goals are explicit.
- Unknowns are listed as blockers, not silently assumed.

## When to skip

- Trivial single-file change with an obvious fix.
- Pure read/report tasks.

## NEVER

- Start coding while requirements are ambiguous — ask first.
- Plan with invented APIs, versions, or file paths — verify them.
- Expand scope beyond the task ("while I'm here").

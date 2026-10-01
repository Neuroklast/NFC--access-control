---
name: anti-overengineering
description: Prevent overengineering when implementing, refactoring, reviewing, or deciding whether to abstract. Use when adding a feature, introducing a helper/factory/registry, structuring a module, simplifying code, or when the user asks if something is too complex. Do not use for deploy, infra, or runtime debugging unrelated to structure.
---

# Skill — Anti-Overengineering

Build exactly what the current task requires. No less, no more.
Minimize **scope**, never **correctness**.

## Before writing

1. **Required?** Explicitly in the task or an existing requirement → continue. Else do not build it.
2. **Reuse?** Search the repo for a pattern, helper, stdlib, or existing dependency. Match it. NEVER invent a parallel one.
3. **Simplest correct?** Direct, flat, one use case inline. Name the built-in before hand-rolling parse/format/retry/validate.
4. **Abstract?** Only if the same logic already exists in multiple real places, would change together, and has a clear name without "and"/"or". Else keep it direct.

Uncertain → do not build / do not abstract.

## NEVER

- Features, config, flexibility, or extra layers the task did not ask for
- Single-use factory, registry, strategy, base class, or plugin system
- New dependency, package, or build step without asking
- Drive-by refactors, reformatting, or adjacent "improvements"
- Future-proofing or extension points for a change that fits in a few lines
- Hand-rolled stdlib/platform features
- Premature optimization without a measurement

## ALWAYS keep

Do not delete these in the name of simplicity:

- Auth, authorization, input validation
- Security checks and secret handling
- Accessibility on public UI
- Reliability already required by the repo
- Existing architecture and conventions
- Explicit stakeholder requirements

## After the diff

- [ ] Every changed line traces to the request
- [ ] No new abstraction with a single caller
- [ ] No new dependency unless approved
- [ ] Validation/auth/security still present
- [ ] A built-in could not replace a new block

If the diff is 200 lines and 50 would do, rewrite it as 50.

## Output

Code first. At most three short lines: what you skipped, when it becomes worth adding.

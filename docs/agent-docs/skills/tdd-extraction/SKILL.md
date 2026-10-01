---
name: tdd-extraction
description: Derive the smallest failing test from intended behavior before implementing. Use when fixing a bug or building a feature with testable behavior, to get the failure signal first.
---

# Skill — TDD Extraction

## Principle

Derive the smallest failing test from the intended behavior, watch it fail, then implement until it passes.

## Steps

1. **Name the contract** in one sentence: "When X, the system must Y."
   If you cannot name it, you do not understand the bug yet — investigate first.
2. **Find the smallest reproduction**: direct function call > integration > E2E.
3. **Write the test** so it fails for the right reason (not because of setup errors).
4. **Run it** and confirm the failure message matches the contract violation.
5. **Implement** the minimal fix.
6. **Run**: new test passes; run the surrounding test files for regressions.
7. **Refactor** only after green, separately from the behavior change.

## Rules

- One contract per test; name tests after behavior, not implementation.
- Prefer few named asserts over assertion spam in loops.
- If the bug is in shared code, add the test at the shared layer AND verify one consumer.
- If a test cannot be written (UI timing, hardware, third party): document the manual proof (steps + expected result) instead.
- Test integrity (never weaken or skip a test to go green): [../../core/workflow.md](../../core/workflow.md).
- NEVER write the test after the implementation "to save time" — you lose the failure signal.

## Anti-patterns

- Golden/snapshot tests as the only coverage.
- Tests asserting internal call counts instead of observable behavior.
- Reproduction that depends on production data or live services.

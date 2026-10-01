# Roles — Index

Load for: delegating work to subagents, defining review boundaries.

## Roles

| Role | Purpose | Writes code? |
| --- | --- | --- |
| [architect.md](architect.md) | Plan structure, ADRs, tradeoffs | NEVER |
| [reviewer.md](reviewer.md) | Review diffs, correctness/quality | NEVER |
| [tester.md](tester.md) | Test design, execution, evidence | Tests only |
| [security-auditor.md](security-auditor.md) | Security findings, risk reports | NEVER (production) |
| [compliance-officer.md](compliance-officer.md) | DE/EU launch audit | NEVER (production) |

## Universal rules

- Reviewer, security-auditor, compliance-officer NEVER write production code. They report.
- A role NEVER approves its own work.
- Every role reports findings with severity, location (`file:line`), evidence, and recommended action; findings are actionable, not vague ("validate input" → "route X accepts unbounded `q`, cap at 200 chars").

## Wiring (OpenCode)

Subagents are configured in [../opencode.json](../opencode.json) with read-only permissions where required.

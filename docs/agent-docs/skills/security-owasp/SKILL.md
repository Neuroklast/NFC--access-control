---
name: security-owasp
description: OWASP-based security review workflow and checklist. Use when reviewing security, adding auth surfaces, handling user input, uploads, or third-party integrations — verifies with deny tests and records residual risks.
---

# Skill — Security (OWASP)

## Workflow

1. Read [../../security/security.md](../../security/security.md) and [web-api.md](../../security/web-api.md).
2. Map the change to the OWASP Top 10 (web) and — for AI features — [owasp-llm.md](../../security/owasp-llm.md).
3. For each surface, ask: who can call this, with what input, seeing what output?
4. Verify with deny tests (401/403) and negative input cases.
5. Record residual risks.

## Review checklist

- [ ] AuthZ server-side on every mutation and foreign-ID read.
- [ ] Tenant/ownership derived from session, not client IDs.
- [ ] Input validated at boundary; unknown fields rejected where supported.
- [ ] Output escaped; rich text sanitized with one allowlist.
- [ ] URLs validated by parsing (no substring checks); SSRF guard on server fetches.
- [ ] Uploads: auth first, magic bytes, size limits, private storage.
- [ ] Rate limits on abuse-prone endpoints; fail closed.
- [ ] Secrets server-only; no PII/secrets in logs or responses.
- [ ] New external origins in CSP; residual risks documented.
- [ ] Dependencies: audit + license + maintenance checked.
- [ ] Error responses leak nothing.

## Output format

| Severity | Finding | Location | Evidence | Fix |
| --- | --- | --- | --- | --- |

- critical/high findings block merge.
- Hypotheses are marked as such, never as facts.
- Re-test after fixes; close only with evidence.

## NEVER

- Fix code while acting as auditor (separation of duties).
- Accept "the UI hides it" as authorization.
- Approve your own remediation.

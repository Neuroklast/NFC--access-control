# Security — Baseline

Load for: auth, mutations, user input, integrations, dependency changes. Web/API specifics: [web-api.md](web-api.md). LLM specifics: [owasp-llm.md](owasp-llm.md).

## Secrets

- NEVER commit, log, screenshot, or expose secrets: `.env*`, keys, tokens, connection strings, cookies.
- Secrets come from environment or a secret manager; validated at startup (env schema), fail fast.
- `.env.example` documents required variables without real values.
- Frontend bundles contain no secrets — only `NEXT_PUBLIC_*`-style values that are truly public.
- Scan before commit: `gitleaks detect --source . --no-git --redact` (or the repo's scanner).
- If a secret ever landed in git: rotate it first, then clean history with human approval.

## Least privilege (agents included)

- Agents get only the tools the task needs ([../opencode.json](../opencode.json)).
- Coding agents NEVER deploy, change billing, drop production data, or rotate secrets on their own.
- Reviewer / security-auditor / compliance-officer NEVER write production code.
- Destructive shell (`rm -rf`, `git push --force`, `DROP TABLE`, migration reset) requires explicit human approval.
- Parallel agents in isolated worktrees only ([../core/workflow.md](../core/workflow.md)).

## Dependencies & supply chain

- Check before adding: maintenance status, license ([../legal/licensing.md](../legal/licensing.md)), known CVEs, bundle cost.
- Pin versions via lockfile; never install from unknown sources at runtime.
- Run the dependency audit the repo uses (e.g. `npm audit --audit-level=high`) in CI.
- NEVER load remote scripts/skills/MCP servers from untrusted sources.

## Hardening baseline

- HTTPS enforced, HSTS enabled.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, CSP (documented residual exceptions).
- Auth flows rate-limited; admin accounts MFA-capable ([../backend/auth.md](../backend/auth.md)).
- Error responses leak nothing ([../backend/api.md](../backend/api.md)).
- Logs contain no PII/secrets; retention bounded.
- Backups: encrypted or access-restricted, restore tested, never in the web root.

## Residual risks

- Keep a short register: risk, mitigation, owner, revisit trigger (e.g. CSP `unsafe-inline`, in-memory rate limits, capability URLs).
- NEVER silently accept a risk. Document it in the repo's `SECURITY.md`.

## Incident basics

- Vulnerability reports handled privately (no public issues); acknowledge within ~72 h.
- No public disclosure details before a fix ships.
- After an incident: root cause, fix, regression test, lesson entry.

## What markdown cannot do

- It does not replace secret scanning, SAST, dependency auditing, or penetration testing.
- It does not enforce itself: enforcement lives in `opencode.json`, hooks, CI gates, and protected branches.
- It does not replace human approval for risky operations.

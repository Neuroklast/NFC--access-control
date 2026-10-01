# Backend — Auth

Load for: login, sessions, roles, permissions, any mutation.

## Core rule

**Proxy/middleware is a UX gate. The action/route is the security gate.**
Every mutation re-checks authorization server-side. NEVER rely on redirects, hidden UI, or client state.

## Sessions & cookies

- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or stricter), `__Host-` prefix in production where supported.
- NEVER store tokens in `localStorage` for admin/privileged flows.
- Session refresh writes cookies on the same response; every redirect branch copies refreshed cookies.
- Logout invalidates server-side state, not just the cookie.
- `Cache-Control: no-store` on authenticated responses.

## Login flows

- Prefer server-side credential handling (server action/route handler) over browser-side sign-in calls that race cookie writes.
- Generic error messages ("Invalid credentials") — never reveal whether an account exists.
- Rate-limit login + lockout persisted in the database (e.g. 5 attempts / 15 min), not only in memory.
- MFA available/enforced for admin accounts where the stack supports it.
- NEVER disable credential inputs during submit (fields drop out of native submissions).

## Authorization

- Central capability registry: `permission -> roles`. Roles reference capabilities, code checks capabilities, not role names inline.
- Every mutating endpoint and every read that touches foreign IDs checks ownership/tenant.
- Tenant scoping derived from the session (membership tables), never from client-provided IDs alone.
- Fail closed: unknown role, missing permission, or config error → deny.
- UI hiding is UX only; the API decides.

## Service role / privileged clients

- Service-role keys are server-only, never in client bundles, never logged.
- Privileged clients require: membership/auth check first, then explicit field allowlist on writes (never raw request body).
- Privileged writes are reserved for system paths (admin ops, cron, webhooks, notifications) — user writes use the user's own context where the stack supports RLS.
- NEVER bypass RLS as a convenience; document each bypass with a reason.

## Dual auth (Bearer + cookie)

- Try Bearer first, fall back to cookie. On 401 from Bearer, fall through to cookie; hard-stop only on 403.
- Normalize legacy role names at one point (single `normalizeRole`), never in scattered conditionals.

## Passwords & secrets

- Hash with a current algorithm (bcrypt/scrypt/argon2) via the stack's library.
- NEVER log passwords, tokens, or session IDs. NEVER store plaintext.
- Password change requires current password (or MFA), except admin-forced reset with audit.

## Audit

- Security-relevant mutations write an audit entry (actor, action, target, timestamp).
- Audit writes are best-effort: never block the operation, never log secrets.

## Verification

- Deny-tests for every guarded surface: unauthenticated → 401, wrong role → 403, foreign tenant → 403/404.
- RLS probe/test in CI where the stack supports it ([../testing/contracts-ci.md](../testing/contracts-ci.md)).

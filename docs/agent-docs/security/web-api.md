# Security — Web & API

Load for: web/API security work, reviews, new endpoints, uploads.

## Injection

- SQL: parameterized queries/ORM only. NEVER string-concatenated SQL.
- XSS: framework escaping by default; NEVER `dangerouslySetInnerHTML`/`innerHTML` with user or model output.
- Rich text: sanitize server- AND client-side with one shared allowlist.
- Shell/template injection: NEVER interpolate untrusted input into shell commands or template engines.
- URL checks: parse hostname/origin — NEVER substring matching (`includes("example.com")`).

## CSRF

- Use the framework's session/CSRF pattern; SameSite cookies as baseline.
- Bearer-token APIs do not need classic CSRF middleware; cookie-authenticated mutations do.
- NEVER disable the framework's origin checks to "fix" a failing request.

## SSRF

- Fetch remote URLs only through a guard: protocol allowlist (http/https), DNS resolve + private/metadata IP block, no redirects to private ranges.
- Applies to: image import, link previews, webhooks, admin-configurable URLs.

## CORS

- NEVER `Access-Control-Allow-Origin: *` with credentials.
- Explicit allowlist per environment; state-mutating endpoints never wildcard.
- Preflight responses reflect only allowed methods/headers.

## CSP & headers

- Production CSP lives in ONE place (deployment config), mirrored where required with a parity test.
- Document residual `style-src 'unsafe-inline'` (and similar) as accepted risk with a revisit trigger.
- New external origins (fonts, embeds, upload targets) MUST be added to the correct CSP directive in the same change.
- `upgrade-insecure-requests` on; no `script-src 'unsafe-inline'` additions without human review.

## Uploads

- Authenticate before issuing upload URLs; short TTLs.
- Validate magic bytes server-side, not client MIME.
- Size limits enforced server-side; chunked/multipart for large files.
- Store in private buckets; serve via signed URLs or a controlled proxy.
- NEVER execute or render uploaded content from the storage origin.

## Rate limiting & abuse

- Rate-limit login, registration, password reset, contact forms, public write endpoints.
- Fail closed when the limiter backend is unavailable; an in-memory backstop is acceptable only for single-instance deployments.
- Hash IPs with a salt for storage; never log plaintext IPs.
- Honeypot/rate-limit preferred over third-party captchas; captchas need a consent path ([../legal/legal-maintenance.md](../legal/legal-maintenance.md)).

## Logging

- NEVER log credentials, tokens, full IPs, or personal data beyond what the task requires.
- Error logs: internal identifiers yes, secrets no.
- Log retention bounded and documented.

## Third-party embeds

- No auto-loading of external iframes/scripts; two-click or consent-gated ([../legal/compliance-de.md](../legal/compliance-de.md)).
- Document each embed's data flow in the legal maintenance file.

## Review checklist

The security review checklist is canonical in [../skills/security-owasp/SKILL.md](../skills/security-owasp/SKILL.md). This file remains the reference for the web/API specifics above (injection, CSRF, SSRF, CORS, CSP, uploads, rate limiting, logging, embeds).

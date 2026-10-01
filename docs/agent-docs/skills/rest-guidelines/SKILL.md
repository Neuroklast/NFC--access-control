---
name: rest-guidelines
description: REST API design rules (Zalando-style subset) for any endpoint. Use when designing, changing, or reviewing APIs — resource naming, JSON shapes, methods, status codes, problem+json errors, pagination, versioning, and OpenAPI duty.
---

# Skill — REST Guidelines

Self-contained subset of the Zalando RESTful API Guidelines. Canonical for the REST wire format (paths, JSON, methods, status codes, errors, pagination, versioning). The API topic owner (auth, validation, endpoint DoD) is [../../backend/api.md](../../backend/api.md).

## Resource naming

- kebab-case paths, plural nouns: `/invoice-line-items`.
- No verbs in paths. Actions that are genuinely processes: noun them (`/imports`, `/exports`).
- No trailing slashes. Path segments lowercase.
- IDs: UUIDs/opaque strings. NEVER sequential integers in public APIs.

## JSON

- Property names snake_case: `created_at`, `line_items`.
- Arrays are plural (`items`). Empty array, not `null`, for empty lists.
- Timestamps RFC 3339 UTC (`2026-09-16T12:00:00Z`); dates `YYYY-MM-DD`.
- Enums: lowercase snake strings, stable forever.
- NEVER `null` for missing list/collection fields.

## Methods

| Method | Semantics | Success |
| --- | --- | --- |
| GET | safe, cacheable where applicable | 200 |
| POST | create | 201 + `Location` |
| PUT | full replace | 200/204 |
| PATCH | partial merge | 200/204 |
| DELETE | idempotent | 204 |

- Long-running operations: 202 + status resource.
- Idempotency key (header) for payment and retryable create endpoints.

## Status codes

- 400 malformed, 401 unauthenticated, 403 unauthorized, 404 unknown, 409 conflict, 422 semantically invalid, 429 rate limited, 500 server error, 503 dependency down.
- 429 MUST carry retry information (`Retry-After`).
- NEVER 200 with an error body.

## Errors — problem+json

```json
{
  "type": "https://example.com/problems/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "line_items[0].quantity must be >= 1",
  "instance": "/api/v1/invoices"
}
```

- Content-Type: `application/problem+json`.
- NEVER stack traces, SQL, or internal identifiers.
- Validation errors SHOULD include field-level detail.

## Pagination

- Cursor-based by default; opaque cursor (`next_cursor`), never page numbers in public contracts.
- Default page size ~50, max ~200; enforce server-side.
- Response shape: `items`, `next_cursor` (nullable), optional `total` only when cheap.

## Versioning

- URL versioning `/api/v1/*`.
- Additive-only within a version: new optional fields/endpoints OK; renames/removals/type changes → new version.
- Deprecation announced in docs + headers before removal.

## Auth

- Every non-public endpoint authenticates + authorizes ([../../backend/auth.md](../../backend/auth.md)).
- Tenant/ownership derived from the session, never from client-supplied IDs alone.
- Public endpoints: rate-limited, column-whitelisted.

## OpenAPI — definition of done

- [ ] Paths, request/response schemas, status codes reflected in the OpenAPI spec.
- [ ] Spec generated from code where possible; NEVER hand-edit generated YAML.
- [ ] Contract check (`verify:api-contracts`) green.
- [ ] An endpoint without spec coverage is not done.

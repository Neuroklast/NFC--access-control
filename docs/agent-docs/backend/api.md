# Backend — API

Load for: any API endpoint or spec. Mandatory skill: [../skills/rest-guidelines/SKILL.md](../skills/rest-guidelines/SKILL.md).

## REST wire format

Paths, JSON shape, methods, status codes, problem+json errors, pagination, and versioning are canonical in [../skills/rest-guidelines/SKILL.md](../skills/rest-guidelines/SKILL.md). Do not restate or fork them here.

## Auth & limits

- Every non-public endpoint authenticates and authorizes. Server-side only ([auth.md](auth.md)).
- Rate limit public/mutating endpoints; return 429 with retry hints.
- Idempotency keys for payments and creates that must survive retries.

## Validation

- Validate at the boundary with the repo's schema library (one source for client+server where possible).
- Reject unknown fields where the schema library supports it.
- NEVER trust client-provided IDs for ownership/tenant — derive from the session.

## OpenAPI

- Every endpoint ships an updated OpenAPI spec in the same change: paths, schemas, status codes.
- Prefer generated specs from code (route definitions/schemas) over hand-edited YAML.
- The spec MUST document actual behavior, including known gaps (e.g. error shape migration).

## Definition of Done (endpoint)

- [ ] REST guidelines complied with.
- [ ] AuthZ on every mutation and every foreign-ID read.
- [ ] Validation at the boundary.
- [ ] Problem+json errors, correct status codes.
- [ ] Pagination for lists, limits for public inputs.
- [ ] OpenAPI updated and contract check green.
- [ ] Tests: happy path + denied path (401/403) + validation failure.

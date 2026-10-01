# Template — PRD (Product Requirements)

> Copy into the project. Keep it living: update as the product evolves.

## 1. Product

- Name:
- One-liner:
- Problem solved:
- Target users:
- Non-goals:

## 2. Surfaces

| Surface | Audience | Access |
| --- | --- | --- |
| Public site | anonymous | public |
| Admin | staff | authenticated + role |
| Portal | customers/members | authenticated + ownership |

## 3. Features (per surface)

| # | Feature | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| F1 | | must | planned | |

## 4. Roles & permissions

| Role | Capabilities |
| --- | --- |
| admin | all |
| editor | content, no finance |
| user | own data only |

## 5. Data model (high level)

- Core entities:
- Relationships:
- Sensitive data classes:

## 6. Non-functional requirements

- Performance budgets:
- Accessibility: WCAG 2.1 AA on public UI.
- Security: RLS, authZ server-side, rate limits.
- Legal: DE/EU compliance if public (see legal docs).
- i18n locales:

## 7. Integrations

| Service | Purpose | Optional? |
| --- | --- | --- |

## 8. Edge cases & failure modes

- Empty states:
- Abuse cases:
- Offline/degraded behavior:

## 9. Out of scope

-

## 10. Open questions

-

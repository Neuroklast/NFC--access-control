# Lessons — Index & Format

Load for: adding a lesson, promoting recurring lessons into topic files.

## Files

| File | Area |
| --- | --- |
| [web-platform.md](web-platform.md) | Frameworks, RSC, hydration, build, routing |
| [ui-ux.md](ui-ux.md) | Scroll, overlays, mobile, realtime UI, media |
| [data-auth.md](data-auth.md) | RLS, auth, schema, sync, caching data |
| [realtime-native.md](realtime-native.md) | C++, audio thread, plugins, native CI |
| [process.md](process.md) | Workflow, docs, CI, release, regression |

## Format

Append-only table rows:

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| YYYY-MM | short area | one actionable sentence (what to do, not what happened) | low/med/high |

Rules:

- Write the **rule**, not the story: "Measure overflow metrics before enabling scroll-prevent", not "we had a bug on Tuesday".
- One row per lesson. Deduplicate: search before adding.
- Severity: `high` = data loss/security/user-visible breakage; `med` = rework/bug risk; `low` = ergonomics.

## Promotion path

1. New lesson → row in the matching file.
2. Lesson repeats (2+ occurrences) → promote into the matching topic file as a MUST/NEVER rule.
3. Lesson becomes a structural gate → add/update a contract script ([../testing/contracts-ci.md](../testing/contracts-ci.md)).

Promotion does not delete the row (history stays append-only). After promotion, the topic file is the canonical rule; the lesson row remains as its origin.

## Rules for agents

- After any incident, regression, or "that surprised me" moment: add the lesson in the same session.
- NEVER rewrite or delete history rows; supersede with a new dated row.
- Project-specific lessons stay in the project repo; only generalized lessons belong here.

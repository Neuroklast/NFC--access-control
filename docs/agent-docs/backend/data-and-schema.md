# Backend — Data & Schema

Load for: schema changes, queries, migrations, seeds.

## Single source of truth

- ONE schema source per project: a schema file, a reset/init SQL, or a migration chain — never both.
- If the repo forbids migrations (reset.sql pattern): NEVER add a migrations folder; extend the SSOT and its idempotent script.
- Types for the DB live next to the schema and are regenerated, not hand-written.
- Schema changes: apply → verify → regenerate types → update seeds → update docs, in that order.

## Schema design

- 3NF by default. Denormalize only with a written reason and a sync mechanism.
- NEVER duplicate entities as strings (artist names, emails) when a relation exists.
- Junction tables for many-to-many; explicit FK actions (`cascade`/`set null`) decided per relation.
- Audit columns (`created_at`, `updated_at`, actor where relevant) on mutable business tables.
- Secrets/PII go into private tables or columns, never into public read surfaces.

## Idempotent DDL

- `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP ... IF EXISTS` before alters.
- Enum/type creation via guarded DO-blocks (`pg_type` check) where `CREATE TYPE IF NOT EXISTS` is unavailable.
- Drop policies before altering columns they reference.
- Script order: extensions → enums → functions → tables → constraints → RLS → seeds/backfills.
- ALWAYS additive and forward-compatible: no `DROP`/`RENAME`/`NOT NULL` without default on live tables without explicit approval.

## Indexes

- Index every foreign key and every column used in frequent `WHERE`/`ORDER BY`.
- Partial unique indexes for race-prone invariants (one draft per period, one active file hash).
- Composite index order: equality columns first, range last.
- NEVER add an index without a query that needs it.

## Queries

- Column whitelists; NEVER `SELECT *` in new code where columns are listed.
- No N+1: batch with `IN`, joins, or eager loading.
- Sums/aggregations in the database (`groupBy`/`aggregate`), not in application loops.
- Time-window every unbounded list query.

## RLS & permissions (Postgres/Supabase)

- RLS enabled on every table in exposed schemas — same change as `CREATE TABLE`.
- Deny-by-default; policies named `"table: actor action"`.
- Helper functions `SECURITY DEFINER` with fixed search path.
- Service role only server-side, for admin/cron/system paths ([auth.md](auth.md)).
- Verify RLS with a probe/test, not by reading policy SQL alone.

## Seeds & fixtures

- Seeds idempotent (`ON CONFLICT DO NOTHING`); NEVER overwrite existing rows.
- Demo/test data clearly separated from production seeds.
- Fixture mutations in tests are forbidden; tests create their own data with a unique prefix and clean up.

## Storage references

- Store object **paths**, not full URLs, as the primary reference.
- URLs are derived at render time via the storage helper ([integrations.md](integrations.md), [../stack/cloudflare-r2.md](../stack/cloudflare-r2.md)).

## New-table checklist

- [ ] `CREATE TABLE IF NOT EXISTS` + constraints + FK actions.
- [ ] Indexes (FKs, filters).
- [ ] RLS enabled + deny-all default + explicit policies.
- [ ] Types regenerated; Zod/schema mapping if the repo uses one.
- [ ] Service/API layer updated.
- [ ] Admin/public surfaces wired.
- [ ] Tests: happy path, empty, denied.
- [ ] Docs + schema checklist updated.

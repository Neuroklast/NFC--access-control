# ADR-001: Next.js, Prisma, Docker

- Status: accepted
- Date: 2026-09-28
- Deciders: project owner

## Context

Phase 1 must run on a Synology NAS without ongoing cloud cost. Phase 2 must move to Vercel + Supabase without a rewrite.

## Decision

Next.js App Router (standalone Docker), Prisma 6 + PostgreSQL, shadcn/ui, npm.

## Consequences

- Positive: one repo, `DATABASE_URL` is the only DB port, Vercel-native later
- Negative: Prisma generate in Docker; not Edge runtime
- Follow-ups: none

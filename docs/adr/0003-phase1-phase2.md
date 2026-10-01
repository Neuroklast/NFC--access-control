# ADR-003: Phase 1 NAS, Phase 2 Vercel/Supabase

- Status: accepted
- Date: 2026-09-28
- Deciders: project owner

## Context

Must run on-prem first, later on Vercel without refactoring application code.

## Decision

Talk to Postgres only through Prisma and `DATABASE_URL`. No Supabase SDK in Phase 1. Node runtime, not Edge.

## Consequences

- Positive: compose file is the Phase-1 product; Phase 2 is env swap
- Negative: in-memory rate limits do not share across Vercel instances
- Follow-ups: shared rate limit if Phase 2 needs it

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — NFC Club Access

Router only. Read topic files that match the task. Collection: [docs/agent-docs/](docs/agent-docs/).

## Project facts

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Prisma, PostgreSQL, shadcn/ui
- Package manager: npm
- Check commands: `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`
- Deploy target: Docker Compose on Synology NAS (Phase 1); Vercel + Supabase Postgres (Phase 2)

## Hard rules

- ALWAYS the smallest change that fully solves the task.
- NEVER invent a package manager. Use the lockfile present.
- NEVER commit, log, or expose secrets.
- NEVER `as any`, `@ts-ignore`, or blanket `eslint-disable`.
- ALWAYS run the check pipeline before claiming done.

## Routing table

| Task | Files |
| --- | --- |
| Any session | [docs/agent-docs/core/context-budget.md](docs/agent-docs/core/context-budget.md) |
| New feature | [docs/agent-docs/core/architecture.md](docs/agent-docs/core/architecture.md), [docs/PRD.md](docs/PRD.md) |
| UI | [docs/agent-docs/skills/frontend-ui/SKILL.md](docs/agent-docs/skills/frontend-ui/SKILL.md), [docs/agent-docs/frontend/ui.md](docs/agent-docs/frontend/ui.md) |
| API | [docs/agent-docs/backend/api.md](docs/agent-docs/backend/api.md), [docs/agent-docs/skills/rest-guidelines/SKILL.md](docs/agent-docs/skills/rest-guidelines/SKILL.md) |
| DB / schema | [docs/agent-docs/backend/data-and-schema.md](docs/agent-docs/backend/data-and-schema.md) |
| Auth | [docs/agent-docs/backend/auth.md](docs/agent-docs/backend/auth.md) |
| Next.js | [docs/agent-docs/stack/nextjs.md](docs/agent-docs/stack/nextjs.md) |
| Tests | [docs/agent-docs/testing/strategy.md](docs/agent-docs/testing/strategy.md), [docs/testing/device-matrix.md](docs/testing/device-matrix.md) |
| Admin cards | [docs/features/admin-cardholders.md](docs/features/admin-cardholders.md) |
| Ops / deploy | [docs/ops/synology.md](docs/ops/synology.md), [docs/ops/vercel.md](docs/ops/vercel.md), [docs/ops/backup-restore.md](docs/ops/backup-restore.md) |
| NFC / QR | [docs/ops/nfc-cards.md](docs/ops/nfc-cards.md) |

## Session closeout

Implement → checks → update docs. DoD: [docs/agent-docs/core/quality.md](docs/agent-docs/core/quality.md).

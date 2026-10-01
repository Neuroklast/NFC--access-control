# NFC Club Access

PWA for door staff to check whether someone is a club employee. Admin UI manages card records.

## Quick start

Windows: `start.bat` doppelklicken (baut, startet, seedet, öffnet den Browser).

Manuell:

```bash
cp .env.example .env
docker compose up -d --build
npx prisma migrate deploy
npx prisma db seed
```

App: `http://localhost:3000`  
Admin: `http://localhost:3000/admin/login` (see `.env.example`)

Local without Docker: Postgres on `DATABASE_URL`, then:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Checks: `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`

## Notes

- Scanner has no login. Admin does.
- NFC: Android Chrome + HTTPS. iOS: QR with the same UID.
- Phase 2: point `DATABASE_URL` at Supabase Postgres. No Supabase client in this repo.

Docs: [docs/PRD.md](docs/PRD.md), [docs/ops/synology.md](docs/ops/synology.md), [docs/ops/nfc-cards.md](docs/ops/nfc-cards.md)

# NFC Club Access

PWA für Einlasspersonal, um zu prüfen, ob jemand Club-Mitarbeiter ist. Admin-UI pflegt Karten und Fotos.

## Quick start

Windows: `start.bat` doppelklicken. Erzeugt beim ersten Lauf `.env` mit Zufallswerten, baut, startet, seedet und öffnet den Browser. Das Admin-Passwort wird einmal angezeigt.

Manuell:

```bash
cp .env.example .env   # Werte selbst setzen, siehe Kommentare
docker compose up -d --build
```

Keine Defaults: `SESSION_SECRET`, `POSTGRES_PASSWORD` und `ADMIN_PASSWORD` müssen gesetzt sein. `scripts/ensure-admin.mjs` legt den Admin nur an, wenn noch keiner existiert.

| URL | Zweck |
| --- | --- |
| `http://localhost:3000` | Scanner |
| `http://localhost:3000/admin/login` | Admin |
| `/admin/password` | Passwort ändern |

Demo-Karten (nur mit `SEED_DEMO=1`): `DEMO-ACTIVE` (grün), `DEMO-BLOCKED` (rot).

## Demo ohne Datenbank

Ohne `DATABASE_URL` startet die App automatisch im **Demo-Modus** (In-Memory, gelbes Banner). Kein Postgres nötig.

- Demo-Karten: `DEMO-ACTIVE` (grün), `DEMO-BLOCKED` (rot)
- Admin: `admin@club.local` / `demo-password-123` (oder `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
- Daten sind nach einem Neustart weg; `DEMO_MODE=1` erzwingt den Modus auch mit DB.

Lokal: `.env` ohne `DATABASE_URL` anlegen und `npm run dev`. Auf Vercel: einfach deployen.

## Checks

`npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` — laufen in CI auf jedem Push/PR.

## Betrieb

- **HTTPS ist Pflicht** für Web NFC und Kamera. TLS terminiert am Synology Reverse Proxy — siehe [docs/ops/synology.md](docs/ops/synology.md). `http://` im WLAN reicht nicht.
- **Gerätetests** (Android NFC, iPhone QR) laufen gegen die NAS-HTTPS-URL: [docs/testing/device-matrix.md](docs/testing/device-matrix.md).
- **Backup:** `backup.bat` bzw. `scripts/backup.sh` — siehe [docs/ops/backup-restore.md](docs/ops/backup-restore.md).
- **NFC/QR:** [docs/ops/nfc-cards.md](docs/ops/nfc-cards.md).
- **Vercel-Demo:** Repo importieren, `DATABASE_URL`/`DIRECT_URL` (Neon/Supabase), `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `SEED_DEMO=1` setzen. Build migriert und legt den Admin an — siehe [docs/ops/vercel.md](docs/ops/vercel.md).

## Docs

[PRD](docs/PRD.md) · [ADRs](docs/adr/) · [Features](docs/features/) · [Ops](docs/ops/)

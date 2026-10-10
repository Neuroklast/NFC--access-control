# NFC Club Access

PWA für Einlasspersonal: prüft, ob jemand Club-Mitarbeiter ist. Die Admin-UI pflegt Karten und Fotos.

Läuft als Docker-Stack (App + Postgres). Ziel ist eine Synology NAS mit Container Manager, das fertige Image liegt unter `ghcr.io/neuroklast/nfc--access-control`.

## Quick start

Windows: `start.bat` doppelklicken. Fragt Admin-E-Mail/Passwort, Demo-Karten und Port ab, erzeugt `.env` mit Zufallswerten, baut, startet, verifiziert Login und Karte und öffnet den Browser. Das Admin-Passwort wird einmal angezeigt.

Manuell:

```bash
cp .env.example .env   # Werte selbst setzen, siehe Kommentare
docker compose pull && docker compose up -d   # fertiges Image von ghcr.io
# oder aus dem Quellcode bauen:
docker compose up -d --build
```

Synology NAS (SSH): Release-ZIP entpacken oder `git clone`, dann `sh install.sh`. Der Installer führt in 7 Schritten durch: prüft Voraussetzungen, fragt Admin-E-Mail/Passwort, Demo-Karten und den App-Port ab, erzeugt `.env`, baut/startet, verifiziert DB + Login + Karte, ermittelt die LAN-Adresse und zeigt URLs, Login, Passwort und die HTTPS-Anleitung. Updates: `sh update.sh` (nur bei Git-Clone) oder neues Release-ZIP. Ohne lokalen Build: `docker compose pull && docker compose up -d` (fertiges Image von `ghcr.io/neuroklast/nfc--access-control`). Entfernen/Reset: `sh uninstall.sh [--purge]`. Details: [docs/ops/synology.md](docs/ops/synology.md).

Keine Defaults: `SESSION_SECRET`, `POSTGRES_PASSWORD` und `ADMIN_PASSWORD` müssen gesetzt sein. `scripts/ensure-admin.mjs` legt den Admin nur an, wenn noch keiner existiert.

| URL | Zweck |
| --- | --- |
| `http://localhost:3000` | Scanner |
| `http://localhost:3000/admin/login` | Admin |
| `/admin/password` | Passwort ändern |

Der Port ist über `APP_PORT` in `.env` konfigurierbar (Default 3000).

Demo-Karten (nur mit `SEED_DEMO=1`): `DEMO-ACTIVE` (grün), `DEMO-BLOCKED` (rot).

## Demo ohne Datenbank

Ohne `DATABASE_URL` startet die App automatisch im Demo-Modus (In-Memory, gelbes Banner). Kein Postgres nötig.

- Demo-Karten: `DEMO-ACTIVE` (grün), `DEMO-BLOCKED` (rot)
- Admin: `admin@club.local` / `demo-password-123` (oder `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
- Daten sind nach einem Neustart weg; `DEMO_MODE=1` erzwingt den Modus auch mit DB.

Lokal: `.env` ohne `DATABASE_URL` anlegen und `npm run dev`. Auf Vercel: einfach deployen. Ein auf dem Host laufender Prozess erreicht die Docker-DB nicht (Postgres hat keinen Host-Port). Dafür den Demo-Modus nutzen.

## Checks

`npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`. Diese Checks laufen in CI auf jedem Push/PR.

## Betrieb

- **HTTPS:** Pflicht für Web NFC und Kamera. Über eine reine LAN-IP geht das nie. Es braucht einen Hostnamen mit gültigem Zertifikat: eigene Domain oder Synology-DDNS (`*.synology.me`), dann Let's-Encrypt-Zertifikat + DSM-Reverse-Proxy `https://<hostname>` → `http://localhost:<APP_PORT>`. Anleitung: [docs/ops/synology.md](docs/ops/synology.md). `http://` im WLAN reicht nicht; die App weist bei fehlendem HTTPS darauf hin.
- **Gerätetests** (Android NFC, iPhone QR) laufen gegen die NAS-HTTPS-URL: [docs/testing/device-matrix.md](docs/testing/device-matrix.md).
- **Backup:** `backup.bat` bzw. `scripts/backup.sh`. Siehe [docs/ops/backup-restore.md](docs/ops/backup-restore.md).
- **Update (NAS):** `sh update.sh` holt die neueste Version von GitHub (git fetch + Fast-Forward), erstellt ein DB-Backup (außer mit `--no-backup`) und baut die Container neu. Siehe [docs/ops/synology.md](docs/ops/synology.md).
- **NFC/QR:** [docs/ops/nfc-cards.md](docs/ops/nfc-cards.md).
- **Vercel-Demo:** Repo importieren, `DATABASE_URL`/`DIRECT_URL` (Neon/Supabase), `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `SEED_DEMO=1` setzen. Build migriert und legt den Admin an. Siehe [docs/ops/vercel.md](docs/ops/vercel.md).

## Docs

[PRD](docs/PRD.md) · [ADRs](docs/adr/) · [Features](docs/features/) · [Ops](docs/ops/)

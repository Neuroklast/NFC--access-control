# Ops — Synology Docker & HTTPS

## Erststart

1. Repo auf die NAS kopieren (oder Image auf einem PC bauen und laden).
2. `.env` anlegen — **keine Defaults**:
   - `SESSION_SECRET` ≥ 32 Zeichen: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
   - `POSTGRES_PASSWORD` zufällig, ≥ 16 Zeichen
   - `ADMIN_EMAIL` und `ADMIN_PASSWORD` (≥ 12 Zeichen)
3. `docker compose up -d --build`

Beim Start läuft `prisma migrate deploy`, danach `scripts/ensure-admin.mjs` (legt den Admin **nur** an, wenn noch keiner existiert). Demo-Karten nur mit `SEED_DEMO=1`.

## HTTPS (Synology Reverse Proxy)

TLS terminiert am Synology Reverse Proxy, nicht im Container.

1. DSM → Systemsteuerung → Anmeldeportal → **Reverse Proxy** → Erstellen.
2. Quelle: `https://nfc.deine-domain.tld:443` (HSTS aktivieren).
3. Ziel: `http://localhost:3000`.
4. Zertifikat: Systemsteuerung → Sicherheit → Zertifikat → Let's Encrypt für die Domain.
5. Router: Port 443 auf die NAS weiterleiten; 3000 **nicht** nach außen öffnen.

Wichtig:

- **HTTPS ist Pflicht** für Web NFC und Kamera. `http://` im WLAN ist kein Secure Context — Android/iPhone verweigern dann NFC bzw. `getUserMedia`.
- Das Session-Cookie ist `Secure` (gesetzt bei `NODE_ENV=production`). Über reines HTTP schlägt der Login deshalb fehl. Immer über die HTTPS-URL arbeiten.
- **Gerätetests (Android NFC, iPhone QR) laufen gegen die NAS-HTTPS-URL**, nicht gegen den Dev-Rechner.
- HSTS am Proxy setzen (nicht doppelt in der App).

## Passwort ändern

Eingeloggt unter `/admin/password`. Das Env-`ADMIN_PASSWORD` dient nur der Erstanlage; danach zählt der DB-Hash.

## Backup

Siehe [backup-restore.md](backup-restore.md).

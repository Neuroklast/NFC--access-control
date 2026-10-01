# Ops — Vercel Demo

Ziel: dieselbe App als öffentliche Demo auf Vercel, ohne Code-Änderung gegenüber Docker.

## 1. Datenbank

Kostenloses Postgres, z. B. Neon oder Supabase. Beide Zugangsstrings notieren:

- `DATABASE_URL` — gepoolt (Supabase: Port `6543`, `?pgbouncer=true`)
- `DIRECT_URL` — direkt (Supabase: Port `5432`) — nur für Migrationen

## 2. Vercel

Repo importieren. Framework wird als Next.js erkannt. Als Build-Command läuft automatisch `vercel-build`.

## 3. Umgebungsvariablen (Production)

| Variable | Wert |
| --- | --- |
| `DATABASE_URL` | gepoolte Verbindung |
| `DIRECT_URL` | direkte Verbindung |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_EMAIL` | z. B. `admin@club.local` |
| `ADMIN_PASSWORD` | ≥ 12 Zeichen |
| `SEED_DEMO` | `1` für Demo-Karten |

## 4. Build-Ablauf

`vercel-build` führt aus:

1. `prisma generate`
2. `prisma migrate deploy` — Schema anlegen/aktualisieren
3. `scripts/ensure-admin.mjs` — Admin anlegen, falls keiner existiert
4. `scripts/seed-demo.mjs` — Demo-Karten, nur bei `SEED_DEMO=1`
5. `next build`

Migrationen laufen bei **jedem** Deploy. Für eine Demo in Ordnung; produktiv lieber getrennt und manuell freigeben.

## 5. Nach dem Deploy

- Scanner: `https://<projekt>.vercel.app/`
- Admin: `https://<projekt>.vercel.app/admin/login`
- Passwort danach unter `/admin/password` ändern.

Vercel liefert automatisch HTTPS. Damit ist der Secure Context für Kamera und Web NFC gegeben.

## Grenzen der Demo

- **Rate-Limit** liegt im Speicher pro Instanz. Bei mehreren Serverless-Instanzen ist es ungenau — für eine Demo akzeptabel, produktiv gehört es geteilt (z. B. Redis).
- **Fotos** liegen als `bytea` in der Datenbank. Bei wenigen hundert Mitarbeitern unkritisch.
- **Web NFC** funktioniert nur in Android Chrome. iPhone nutzt QR.
- `ADMIN_PASSWORD` dient nur der Erstanlage; danach zählt der DB-Hash.

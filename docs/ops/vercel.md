# Ops — Vercel Demo

Ziel: dieselbe App als öffentliche Demo auf Vercel, ohne Code-Änderung gegenüber Docker.

## 0. Ohne Datenbank (Demo-Modus)

Kein Postgres nötig: einfach deployen und `DATABASE_URL` leer lassen. Die App läuft dann im **Demo-Modus** mit In-Memory-Daten:

- Demo-Karten: `DEMO-ACTIVE` (grün), `DEMO-BLOCKED` (rot)
- Admin: `ADMIN_EMAIL` (Default `admin@club.local`), Passwort `ADMIN_PASSWORD` oder `demo-password-123`
- Ein gelbes Banner weist auf den Demo-Modus hin
- Daten gehen bei jedem Neustart verloren; mehrere Instanzen teilen sich keinen Zustand

`DEMO_MODE=1` erzwingt den Demo-Modus auch mit gesetzter `DATABASE_URL`.

## 1. Datenbank (optional)

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

`scripts/vercel-build.mjs`:

1. `prisma generate`
2. **Ohne `DATABASE_URL`:** Migration und Seed werden übersprungen (Demo-Modus), direkt `next build`.
3. **Mit `DATABASE_URL`:** `prisma migrate deploy`, `ensure-admin`, `seed-demo`, dann `next build`. `DIRECT_URL` fällt auf `DATABASE_URL` zurück, wenn nicht gesetzt.

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

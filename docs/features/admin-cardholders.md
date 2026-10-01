# Feature Spec — Admin Login & Kartenpflege

- Feature: Admin-Login + Cardholder CRUD
- Issue/ticket: —
- Owner: NFC Club Access

## Problem

Karten existieren nur in Postgres. Verwaltung kann Inhaber nicht anlegen, sperren oder entfernen, ohne SQL. Einlass-Verify (F1–F4) ist wertlos, wenn Stammdaten nicht pflegbar sind.

## Acceptance criteria

- [ ] Given gültige Admin-Credentials, when Login, then Session-Cookie und Redirect auf `/admin/cardholders`.
- [ ] Given falsche Credentials, when Login, then gleiche Meldung „E-Mail oder Passwort ungültig“, kein Leak, Paste ins Passwortfeld funktioniert.
- [ ] Given keine Session, when `/admin/*` außer Login, then 401/Redirect Login (Server), nicht nur Client-Hide.
- [ ] Given Admin, when Liste, then alle Cardholder mit Name, UID, Rolle, aktiv/inaktiv; Suche nach Name oder UID filtert ohne Reload-Verlust (Query `?q=`).
- [ ] Given leere DB, when Liste, then Empty-State mit CTA „Karte anlegen“, keine leere Tabelle.
- [ ] Given gültige Felder, when Anlegen, then Row existiert; Scanner mit dieser UID → Grant.
- [ ] Given doppelte UID, when Anlegen/Ändern, then 409 am Feld `card_uid`, kein Partial-Write.
- [ ] Given aktive Karte, when Deaktivieren, then Scanner → Denied ohne Namen.
- [ ] Given Löschen, when Confirm mit vollem Namen, then Row weg; Abbrechen ändert nichts.
- [ ] Denied path: Scanner-Session darf Admin-APIs nicht aufrufen (kein Cookie → 401).
- [ ] Empty/error: Netzwerkfehler an Formular + Retry; kein Silent Fail.
- [ ] Login: `autocomplete="username"` / `current-password`; Submit-Pending sichtbar; Inputs nicht `disabled` während Submit.

## Scope

- In: `/admin/login`, Logout, Liste, Anlegen, Bearbeiten, Deaktivieren, Löschen, Passwort ändern (eingeloggt), Seed-Admin
- Out: E-Mail-Reset, SSO, Bulk-Import, Audit-UI, UID-Scan am Admin-Gerät, mehrere Admins anlegen in der UI

## Technical notes

- Files: `src/app/admin/login/page.tsx`, `src/app/admin/cardholders/**`, `src/app/api/v1/cardholders/route.ts`, `src/lib/auth/*`
- Schema: `AdminUser`; Cardholder unverändert
- Cache: Admin-Reads `no-store`; Scanner-Verify uncached
- Auth: Cookie-Session; Mutationen prüfen Session + Rolle `admin` in der Route, nicht nur in Layout/Middleware
- i18n: Deutsch hardcodiert
- Analytics/consent: keines

### API (snake_case, problem+json)

| Method | Path | Success |
| --- | --- | --- |
| POST | `/api/v1/sessions` | 204 + Set-Cookie |
| DELETE | `/api/v1/sessions` | 204 |
| GET | `/api/v1/cardholders?q=&cursor=` | 200 `{ items, next_cursor }` |
| POST | `/api/v1/cardholders` | 201 + Location |
| PATCH | `/api/v1/cardholders/{id}` | 200 |
| DELETE | `/api/v1/cardholders/{id}` | 204 |

Login-UI darf shadcn Block `login-01` als Start, Theme dark. Formulare: Zod + FieldError, nicht unzugeordneter Fehlertext.

### UI

- Login: eine Spalte, sichtbare Labels, Primary „Anmelden“
- Liste Desktop: Tabelle; &lt;768px: Cards, horizontales Scroll verboten als einziger Weg
- Status-Badge: Text „Aktiv“/„Gesperrt“ + Farbe, nie Farbe allein
- Destructive: Confirm-Dialog nennt Vor- und Nachname
- Toast nach Speichern/Löschen; Fehler am Feld oder form-level
- Lucide-Icons; Touch-Targets ≥ 44px

## Test plan

- Unit: Password-Verify, UID-Uniqueness-Regel, Session-Guard fail-closed
- Integration: Login 204/401, CRUD happy, 401 ohne Cookie, 409 duplicate UID, 422 validation
- E2E: Login → anlegen → Scanner Grant; deaktivieren → Scanner Deny; Löschen confirm/abort
- Manual: Passwort-Manager-Autofill, iOS Safari Admin, Android Scanner

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Scanner-URL öffentlich im LAN, Admin daneben | medium | Getrennte Pfade, Admin ohne Index-Link auf Scanner |
| Seed-Passwort in Env bleibt Default | high | README: sofort ändern; Login warnt nicht (kein Leak) |
| Hartes Löschen ohne Undo | medium | Confirm + Empfehlung Deaktivieren zuerst |

## Rollout

- Migration: `AdminUser` + Seed
- Feature flag: none
- Rollback: Migration down nur mit Freigabe; App ohne Admin-UI nutzbar, Scanner bleibt

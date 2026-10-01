# PRD — NFC Club Access

> Living document. Evidence: Systembrief (Nutzer, 2026-09-28), Klärung „Ausweis nicht Türöffner“, Auftrag Admin-Kartenpflege. Keine Markt-/Interviewdaten — Annahmen sind markiert.

## 1. Product

- Name: NFC Club Access
- One-liner: Handy-PWA, mit der Einlass prüft, ob jemand Club-Mitarbeiter ist, und Verwaltung Kartenstammdaten pflegt.
- Problem solved: Ohne App nur SQL/Prisma Studio; am Einlass kein klares Grün/Rot. Karten anlegen/sperren/löschen muss ohne Datenbank-Konsole gehen.
- Target users:
  - Einlass (Scanner-PWA, kein Login, Phase 1)
  - Verwaltung / Club-Leitung (Admin-Login, Karten-CRUD)
- Non-goals: Türöffner/Schlösser, Mitglieder-Self-Service, Abrechnung, Multi-Tenant, öffentlicher Club-Auftritt

## 2. Surfaces

| Surface | Audience | Access |
| --- | --- | --- |
| Scanner `/` | Einlass | kein Login; LAN/HTTPS; Rate-Limit API |
| Admin Login `/admin/login` | Verwaltung | unauthenticated form |
| Admin Karten `/admin/cardholders` | Verwaltung | Session + Rolle `admin` |
| API verify | Scanner-Client | public, rate-limited |
| API cardholders | Admin-Client | session, CSRF via SameSite cookie |

## 3. Features (per surface)

| # | Feature | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| F1 | NFC-Scan + Verify-Feedback | must | planned | Android Chrome; Reset 4s |
| F2 | QR-Scan Fallback | must | planned | iOS / kein NFC; gleiche UID |
| F3 | Manuelle UID | should | planned | Desktop-Test, NFC-Fail |
| F4 | PWA installierbar, dark-first | must | planned | Serwist; Offline = kein Grant |
| F5 | Admin-Login | must | planned | Passwort, Paste erlaubt |
| F6 | Kartenliste + Suche | must | planned | Name, UID, Status, Rolle |
| F7 | Karte anlegen / ändern | must | planned | UID unique |
| F8 | Karte deaktivieren | must | planned | `is_active=false` → Scanner Rot |
| F9 | Karte löschen | should | planned | Confirm-Dialog, Namen nennen |
| F10 | UID am Admin per NFC/QR | could | later | sonst Clipboard/Tipp |
| F11 | Mehrere Admin-Accounts | could | later | MVP: ein Seed-Admin |
| F12 | Passwort-Reset per E-Mail | could | later | MVP: Änderung nur eingeloggt |
| F13 | Mitarbeiterfoto am Scanner | must | done | signierte URL, 60 s |
| F14 | Passwort ändern (eingeloggt) | must | done | min. 12 Zeichen |
| F15 | Backup/Restore | must | done | pg_dump, Retention |
| F16 | CI (lint/typecheck/test/build) | must | done | GitHub Actions |

## 4. Roles & permissions

| Rolle | Capabilities |
| --- | --- |
| (none) Scanner | POST verify; kein Listen, kein Mutate |
| admin | Login, CRUD Cardholder, Deaktivieren, Löschen, Logout, Passwort ändern |
| security / staff / vip | nur Karten-*Attribut* am Inhaber, kein App-Login |

Code prüft Capability serverseitig. UI-Hide ist kein Schutz.

## 5. Data model (high level)

- Core entities: `Cardholder` (Karte + Person), `AdminUser` (Login)
- Relationships: keine; Admin pflegt Cardholder, ist selbst kein Cardholder
- Sensitive: Namen, `card_uid`, Passwort-Hash, Session. Deny-Responses ohne Namen.

Cardholder: `id`, `card_uid` unique, `first_name`, `last_name`, `is_active` default true, `role` default `staff`, timestamps.

AdminUser: `id`, `email` unique, `password_hash`, timestamps. Seed aus Env beim ersten Start.

## 6. Non-functional requirements

- Performance: Verify p95 < 500 ms im LAN; Admin-Liste < 200 Zeilen ohne Pagination-Pflicht, danach Cursor.
- Accessibility: WCAG 2.1 AA; Login WCAG 2.2 Accessible Authentication (Paste, `autocomplete=current-password`, kein Paste-Block). Kontrast Text ≥ 4.5:1. Touch ≥ 44×44px. Status nie nur per Farbe (Haken/Kreuz + Text).
- Security: Session HttpOnly/Secure/SameSite; Login rate-limit + generische Fehlermeldung; Mutationen re-checken AuthZ; kein `localStorage`-Token.
- Legal: internes Tool, kein öffentlicher DE-Auftritt. Personenbezogene Mitarbeiterdaten → DSGVO intern (Annahme, keine Rechtsberatung).
- i18n: UI Deutsch. Kein i18n-Framework im MVP.
- Design (UI Pro Max, 2026-09-28): Dark-first, Minimalism/Swiss. Tokens — Primary `#1E293B`, Accent/Grant `#22C55E`, Destructive `#EF4444`, Background `#0F172A`, Foreground `#F8FAFC`, Card `#1B2336`, Muted `#94A3B8`. CI später über CSS-Variablen. Body IBM Plex Sans; UID IBM Plex Mono. Lucide-Icons, keine Emoji-Icons. Motion 150–250 ms, `prefers-reduced-motion` = instant. Scanner: ein Primary-CTA. Admin: Tabelle Desktop, Cards <768px.

## 7. Integrations

| Service | Purpose | Optional? |
| --- | --- | --- |
| PostgreSQL | Stammdaten | nein |
| Web NFC | UID lesen | ja (QR-Fallback) |
| BarcodeDetector | QR | ja (manuelle UID) |
| Synology Docker | Phase-1 Host | nein für Go-Live intern |

## 8. Edge cases & failure modes

- Empty: „Keine Karten. Erste Karte anlegen.“ + CTA
- Duplicate `card_uid`: 409, Feldfehler am UID-Feld
- Unbekannt/inaktiv am Scanner: Rot, ohne Namen, 4s Reset
- NFC fehlt: Banner + QR + manuelle UID
- Offline Verify: „Keine Verbindung“, nie Grant
- Login fail: „E-Mail oder Passwort ungültig“ (kein Account-Existenz-Leak)
- Session abgelaufen: Redirect Login, Return-URL
- Abuse: Login- und Verify-Rate-Limit 429
- Delete: Dialog „Karte von {Vorname} {Nachname} unwiderruflich löschen?“

## 9. Out of scope

- Türhardware, Audit-Log-UI, Bulk-CSV, Rollen-UI über die vier Strings hinaus, Light-Mode-First, öffentliches Impressum

## 10. Open questions

- Ein Seed-Admin (Empfehlung MVP) oder sofort mehrere Accounts?
- Hartes Löschen nötig, oder reicht Deaktivieren?
- Scanner-URL und Admin-URL auf demselben Host (Empfehlung: ja, Pfadtrennung)?

## 11. Evidence & assumptions

| Aussage | Status | Quelle |
| --- | --- | --- |
| Ausweis-Check, kein Türöffner | Nutzerentscheidung | Chat 2026-09-28 |
| QR im MVP | Nutzerentscheidung | Chat 2026-09-28 |
| Prisma, Docs-Copy | Nutzerentscheidung | Chat 2026-09-28 |
| Scanner ohne Login | Plan Phase 1 | Plan, nicht widerrufen |
| Admin braucht Login + CRUD | expliziter Auftrag | `/write-prd` 2026-09-28 |
| Ein Seed-Admin reicht | Annahme | bis Frage 10 beantwortet |
| Keine Marktgröße/Wettbewerber | nicht erhoben | — |

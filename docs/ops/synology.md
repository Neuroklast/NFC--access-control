# Ops — Synology Docker & HTTPS

## Schnellstart (empfohlen, per SSH)

1. In DSM den **Container Manager** (Docker) installieren und SSH aktivieren
   (Systemsteuerung → Terminal & SNMP).
2. Repo auf die NAS legen, z. B.:
   `git clone <repo-url> /volume1/docker/nfc-access-control`
3. Installer ausführen:
   `cd /volume1/docker/nfc-access-control && sh install.sh`
4. Der Installer fragt interaktiv nach:
   - **Admin-E-Mail** und **Admin-Passwort** (leer = automatisch generieren)
   - **Demo-Karten** (j/n)
   - **Host-Port der App** (Default 3000)
   - ob **Postgres im LAN** erreichbar sein soll (Default: nein, nur lokal)
   Danach erzeugt er `.env`, baut und startet die Container und zeigt am Ende
   Admin-Login, Passwort und Ports an. Bei einer **bestehenden Installation**
   (vorhandene `.env`) bleiben Admin-Zugang, DB-Passwort und Session-Secret erhalten
   — es werden nur Demo und Ports abgefragt.
5. **HTTPS** über den DSM Reverse Proxy einrichten (siehe unten) und die App danach
   über die HTTPS-URL aufrufen.

Hinweise:

- Ohne Docker-Rechte `sudo sh install.sh` verwenden. Wird `install.sh` ohne `sudo`
  ausgeführt, `.env` gehört danach dem aufrufenden Nutzer.
- Nicht-interaktiv (Automatisierung):
  `NONINTERACTIVE=1 ADMIN_EMAIL=... ADMIN_PASSWORD=... SEED_DEMO=0 APP_PORT=3000 DB_BIND=127.0.0.1 DB_PORT=5432 sh install.sh`.
  Eine bestehende `.env` wird dabei standardmäßig weiterverwendet; mit
  `FORCE_RECONFIGURE=1` wird sie neu geschrieben (Admin-Zugang, DB-Passwort und
  Session-Secret bleiben erhalten).
- Admin-Passwörter und E-Mails sind auf `A-Za-z0-9._@%+=:/!?*,-` beschränkt (keine
  Leerzeichen, `$`, `#`, Anführungszeichen, Backslash) — so kann Compose die Werte in
  `.env` nicht umdeuten.
- Die Installer-Ausgabe enthält das generierte Admin-Passwort. Nicht in Logs umleiten
  (kein `| tee`) und die Terminal-Historie beachten. Ein selbst gesetztes Passwort
  wird nicht angezeigt.
- Ports stehen in `.env` (`APP_PORT`, `DB_BIND`, `DB_PORT`) und werden von
  `docker-compose.yml` gelesen. Default ist nur lokal (`127.0.0.1`).
  `DB_BIND=0.0.0.0` gibt die DB im LAN frei — **Docker kann die Host-Firewall
  umgehen**, den Port daher niemals am Router weiterleiten.
- `.env` muss eine reguläre Datei sein (kein Symlink); der Installer ersetzt sie
  atomar. Zusätzliche, nicht vom Installer verwaltete Zeilen (z. B. `DEMO_MODE`)
  bleiben bei einer Rekonfiguration erhalten.

## Update (neue Version einspielen)

Bei einer per `git clone` installierten App die neueste Version von GitHub holen
und neu bauen:

```sh
cd /volume1/docker/nfc-access-control
sh update.sh
```

Ablauf: lokale Prüfung → `git fetch` → Fast-Forward auf `origin/<branch>` →
DB-Backup (Pflicht, siehe unten) → `docker compose up -d --build` → Warten auf die
App. `.env`, `backups/` und das Postgres-Volume bleiben erhalten; Migrationen
laufen beim Start des Containers automatisch. Nur der Remote-Stand wird gebaut,
und der erfolgreiche Neubau wird als Marker in `.git/` vermerkt — so wird ein
abgebrochener Lauf beim nächsten Start zuverlässig wiederholt.

Optionen und Umgebungsvariablen:

- `sh update.sh --force` bzw. `FORCE_RESTART=1` — baut auch dann neu, wenn der
  Code bereits aktuell ist, und erstellt den App-Container neu.
- `sh update.sh --no-backup` bzw. `SKIP_BACKUP=1` — Backup überspringen (nicht
  empfohlen; es wird dann eine Warnung ausgegeben).
- `BRANCH=<name>` — Branch wählen. Der Branch muss bereits ausgecheckt sein
  (`git checkout <name>` vorher), sonst bricht das Update ab.

Hinweise:

- Voraussetzung ist ein per `git clone` angelegtes Repo mit Remote `origin` über
  **HTTPS oder SSH** (unsichere Protokolle wie `http://`/`git://` werden
  abgelehnt). Eine über File Station kopierte Installation ohne `.git` lässt
  sich nicht aktualisieren.
- Lokale Änderungen an versionierten Dateien **und** lokale, nicht gepushte
  Commits brechen das Update ab (nur der Remote-Stand wird gebaut). `.env` und
  `backups/` sind ignoriert und stören nicht.
- Vor dem Neubau ist ein DB-Backup Pflicht. Läuft der Postgres-Container nicht,
  bricht das Update ab, sofern nicht bewusst `--no-backup` gesetzt ist. Backups
  enthalten Admin-Hash und Kartendaten; sie werden mit `umask 077` (Datei `0600`)
  geschrieben und sollten auf einem geschützten Share liegen.
- Erste Aktualisierung: Ältere Installationen kennen `update.sh` noch nicht und
  müssen einmalig `git pull` ausführen, danach steht das Skript zur Verfügung.
- Ohne Docker-Rechte `sudo sh update.sh` verwenden. Dann muss das Repo demselben
  Nutzer gehören (sonst bricht Git mit „dubious ownership" ab), und das
  Repo-Verzeichnis darf nur von diesem Nutzer beschreibbar sein. Besser: den
  Admin zur Docker-Gruppe hinzufügen und ohne `sudo` arbeiten.
- **Rebuild vs. Daten:** Wird ein Repo neu geklont, muss das in **denselben Pfad**
  geschehen — Compose leitet Namen und `pgdata`-Volume vom Ordnernamen ab. Ein
  anderer Pfad erzeugt ein leeres Volume; die alten Daten scheinen verloren.
- **Rollback:** Zuerst das passende DB-Backup einspielen
  ([backup-restore.md](backup-restore.md)), dann Code zurückrollen:
  `git checkout <alter-commit> && docker compose up -d --build` (danach mit
  `git checkout <branch>` wieder ins Update-Gleis). Ein Code-Rollback macht eine
  bereits angewandte Migration **nicht** rückgängig.

## Container Manager (ohne SSH)

1. Ordner mit dem Repo über File Station auf die NAS kopieren.
2. Container Manager → **Projekt** → Erstellen, Pfad zum Ordner wählen,
   `docker-compose.yml` als Quelle.
3. `.env` im selben Ordner ablegen. Ohne SSH gibt es keine Shell zum Erzeugen der
   Zufallswerte: `.env.example` kopieren und `SESSION_SECRET` (≥ 32 Zeichen),
   `POSTGRES_PASSWORD` (≥ 16) und `ADMIN_PASSWORD` (≥ 12) mit einem Passwortmanager
   oder dem dokumentierten `node`-Befehl auf einem PC füllen. `APP_PORT`, `DB_BIND`
   und `DB_PORT` sind optional (Defaults 3000 / `127.0.0.1` / 5432). Danach
   `chmod 600 .env` setzen. Alternativ den SSH-Schnellstart nutzen.
4. Projekt starten. Beim ersten Start laufen Migration und Admin-Anlage automatisch.
5. HTTPS-Reverse-Proxy einrichten (siehe unten).

Wichtig: `.env` braucht **LF**-Zeilenenden (nicht CRLF) — Compose würde sonst `\r` in
Werte übernehmen. `install.sh`, `update.sh`, `scripts/init-env.sh` und
`scripts/backup.sh` normalisieren ihre eigenen Zeilenenden selbst; bei einer
Windows-Kopie daher vorher `sed -i 's/\r$//' .env` ausführen.

## Manueller Start (Erststart)

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
3. Ziel: `http://localhost:<APP_PORT>` (der in `.env` gewählte Host-Port, Default 3000).
4. Zertifikat: Systemsteuerung → Sicherheit → Zertifikat → Let's Encrypt für die Domain.
5. Router: Port 443 auf die NAS weiterleiten; den App-Port **nicht** nach außen öffnen.

Wichtig:

- **HTTPS ist Pflicht** für Web NFC und Kamera. `http://` im WLAN ist kein Secure Context — Android/iPhone verweigern dann NFC bzw. `getUserMedia`.
- Das Session-Cookie ist `Secure` (gesetzt bei `NODE_ENV=production`). Über reines HTTP schlägt der Login deshalb fehl. Immer über die HTTPS-URL arbeiten.
- **Gerätetests (Android NFC, iPhone QR) laufen gegen die NAS-HTTPS-URL**, nicht gegen den Dev-Rechner.
- HSTS am Proxy setzen (nicht doppelt in der App).

## Passwort ändern

Eingeloggt unter `/admin/password`. Das Env-`ADMIN_PASSWORD` dient nur der Erstanlage; danach zählt der DB-Hash.

## Backup

Siehe [backup-restore.md](backup-restore.md).

#!/bin/sh
# Update-Skript fuer Synology NAS (und jedes Linux mit Docker Compose).
# Holt die neueste Version aus GitHub (git) und baut/startet die Container neu.
# Aufruf: sh update.sh [--force] [--no-backup]
#
#   --force      Container auch dann neu bauen/neu erstellen, wenn bereits aktuell
#   --no-backup  Datenbank-Backup vor dem Update ueberspringen
#
# Umgebungsvariablen:
#   BRANCH=<name>    Branch; muss dem ausgecheckten Branch entsprechen (Default:
#                    aktueller Branch)
#   SKIP_BACKUP=1    wie --no-backup
#   FORCE_RESTART=1  wie --force
#
# Die bestehende .env bleibt unangetastet (Secrets, Ports, Admin-Zugang).
# Vor dem Neubau wird die DB automatisch gesichert (Backup). Laeuft der
# Postgres-Container nicht, bricht das Update ab, sofern nicht bewusst
# --no-backup gesetzt ist.

# CRLF-Schutz: Windows-Kopien enthalten \r und brechen sh-Skripte.
if [ -z "${NFC_LF_UPDATE:-}" ] && ! tr -d '\r' < "$0" | cmp -s - "$0" 2>/dev/null; then
  NFC_ORIG_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
  export NFC_ORIG_DIR NFC_LF_UPDATE=1
  _tmp="$(mktemp "${TMPDIR:-/tmp}/nfc-update-XXXXXX")" || exit 1
  chmod 600 "$_tmp" 2>/dev/null || true
  # Temp-Datei auch bei Abbruch/Interrupt entfernen.
  trap 'rm -f "$_tmp"' EXIT
  trap 'rm -f "$_tmp"; exit 130' INT TERM HUP
  tr -d '\r' < "$0" > "$_tmp" || { rm -f "$_tmp"; echo "[FEHLER] CRLF-Konvertierung fehlgeschlagen." >&2; exit 1; }
  sh "$_tmp" "$@"
  _rc=$?
  rm -f "$_tmp"
  exit "$_rc"
fi

set -eu

SCRIPT_DIR="${NFC_ORIG_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)}"
cd "$SCRIPT_DIR"

# shellcheck source=scripts/lib.sh
. ./scripts/lib.sh

echo "=== NFC Club Access - Update ==="

# --- Optionen ---
FORCE_RESTART="${FORCE_RESTART:-0}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"
for arg in "$@"; do
  case "$arg" in
    --force) FORCE_RESTART=1 ;;
    --no-backup) SKIP_BACKUP=1 ;;
    -h|--help)
      printf 'Aufruf: sh update.sh [--force] [--no-backup]\n'
      printf '  --force / FORCE_RESTART=1   auch bei aktuellem Stand neu bauen/erstellen\n'
      printf '  --no-backup / SKIP_BACKUP=1 DB-Backup ueberspringen (nicht empfohlen)\n'
      printf '  BRANCH=<name>               ausgecheckten Branch waehlen\n'
      exit 0
      ;;
    *)
      printf '[FEHLER] Unbekannte Option: %s\n' "$arg" >&2
      exit 1
      ;;
  esac
done

# Boolesche Werte strikt normalisieren: 1/true/yes/on = an, 0/false/no/off = aus.
# Verhindert, dass z. B. SKIP_BACKUP=false den '['-Vergleich still fehlschlagen
# laesst und dadurch das Backup unbemerkt uebersprungen wird.
case "${FORCE_RESTART:-0}" in
  1|true|yes|on) FORCE_RESTART=1 ;;
  0|false|no|off|'') FORCE_RESTART=0 ;;
  *) echo "[FEHLER] FORCE_RESTART muss 1 oder 0 sein (erhalten: '$FORCE_RESTART')." >&2; exit 1 ;;
esac
case "${SKIP_BACKUP:-0}" in
  1|true|yes|on) SKIP_BACKUP=1 ;;
  0|false|no|off|'') SKIP_BACKUP=0 ;;
  *) echo "[FEHLER] SKIP_BACKUP muss 1 oder 0 sein (erhalten: '$SKIP_BACKUP')." >&2; exit 1 ;;
esac

# Wert aus .env lesen (Wert darf '=' enthalten, umschliessende Quotes werden entfernt).
read_env() {
  _val="$(grep -E "^$1=" .env 2>/dev/null | tail -n 1 | cut -d= -f2- | tr -d '\r' || true)"
  case "$_val" in
    \"*\"|\'*\')
      _val="${_val#?}"
      _val="${_val%?}"
      ;;
  esac
  printf '%s' "$_val"
}

valid_port() {
  case "${1:-}" in
    ''|*[!0-9]*) return 1 ;;
  esac
  [ "$1" -ge 1 ] && [ "$1" -le 65535 ]
}

# --- Voraussetzungen pruefen ---
if [ ! -f .env ]; then
  echo "[FEHLER] Keine .env gefunden. Erst installieren: sh install.sh" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "[FEHLER] git nicht gefunden. Update per git nicht moeglich." >&2
  echo "         Repo neu klonen oder Paket 'git' installieren." >&2
  exit 1
fi

if [ ! -d .git ]; then
  echo "[FEHLER] Kein Git-Repository in $SCRIPT_DIR." >&2
  echo "         Dieses Verzeichnis wurde nicht per 'git clone' angelegt." >&2
  echo "         Neu klonen (gleicher Pfad, sonst zeigt Compose auf ein leeres" >&2
  echo "         pgdata-Volume!): .env und backups/ vorher sichern." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[FEHLER] Docker nicht gefunden. Bitte auf der NAS den Container Manager installieren." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[FEHLER] Docker-Daemon nicht erreichbar." >&2
  echo "         Ohne sudo erneut versuchen: sudo sh update.sh" >&2
  exit 1
fi

COMPOSE=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "[FEHLER] Docker Compose nicht gefunden." >&2
  exit 1
fi

# --- Remote / Branch bestimmen ---
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
if [ -z "$ORIGIN_URL" ]; then
  echo "[FEHLER] Kein Git-Remote 'origin' konfiguriert." >&2
  exit 1
fi
# Nur HTTPS/SSH zulassen (Schema case-insensitiv, keine Klartext-Protokolle).
ORIGIN_LOWER="$(printf '%s' "$ORIGIN_URL" | tr 'A-Z' 'a-z')"
case "$ORIGIN_LOWER" in
  https://*|ssh://*) : ;;
  *://*)
    # Nur das Schema zeigen - eine URL kann Zugangsdaten enthalten.
    echo "[FEHLER] Unsicheres origin-Protokoll: ${ORIGIN_URL%%://*}://" >&2
    echo "         Bitte HTTPS oder SSH verwenden." >&2
    exit 1
    ;;
  *@*:*) : ;; # scp-artiges SSH (z. B. git@github.com:owner/repo.git)
  *)
    echo "[FEHLER] origin ist weder HTTPS noch SSH." >&2
    echo "         Bitte Remote auf HTTPS/SSH umstellen." >&2
    exit 1
    ;;
esac

CURRENT_BRANCH="$(git symbolic-ref --short -q HEAD 2>/dev/null || true)"
if [ -z "$CURRENT_BRANCH" ]; then
  echo "[FEHLER] Kein Branch ausgecheckt (detached HEAD)." >&2
  echo "         Bitte zuerst Branch waehlen: git checkout main" >&2
  exit 1
fi

BRANCH="${BRANCH:-$CURRENT_BRANCH}"
case "$BRANCH" in
  -*|*[!A-Za-z0-9._/-]*)
    echo "[FEHLER] Ungueltiger Branch-Name: '$BRANCH'." >&2
    exit 1
    ;;
esac
if [ "$BRANCH" != "$CURRENT_BRANCH" ]; then
  echo "[FEHLER] BRANCH=$BRANCH, aber ausgecheckt ist '$CURRENT_BRANCH'." >&2
  echo "         Erst wechseln: git checkout $BRANCH" >&2
  exit 1
fi

# --- Lokale Aenderungen an versionierten Dateien? ---
if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null || true)" ]; then
  echo "[FEHLER] Lokale Aenderungen an versionierten Dateien gefunden:" >&2
  git status --short --untracked-files=no >&2 || true
  echo "" >&2
  echo "         Bitte sichern oder verwerfen und erneut ausfuehren:" >&2
  echo "           git stash   # Aenderungen beiseitelegen" >&2
  echo "           git checkout -- .   # Aenderungen verwerfen" >&2
  exit 1
fi

OLD_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
OLD_SUBJECT="$(git log -1 --format=%s 2>/dev/null || echo '')"
echo "[INFO] Aktueller Stand: $OLD_COMMIT ${OLD_SUBJECT:+($OLD_SUBJECT)}"

# Zuletzt erfolgreich deployter Stand (Marker in .git, nicht versioniert), damit
# ein fehlgeschlagener Neubau beim naechsten Lauf nicht als "aktuell" gilt.
NFC_GIT_DIR="$(git rev-parse --git-dir 2>/dev/null || echo .git)"
DEPLOYED_FILE="$NFC_GIT_DIR/nfc-last-deployed"
DEPLOYED_COMMIT="$(cat "$DEPLOYED_FILE" 2>/dev/null | tr -d '\r' || true)"

echo "[INFO] Hole neueste Version von origin/$BRANCH ..."
if ! git fetch --prune origin "$BRANCH"; then
  echo "[FEHLER] 'git fetch' fehlgeschlagen. Netzwerk/Remote pruefen." >&2
  exit 1
fi

TARGET_COMMIT="$(git rev-parse --short "origin/$BRANCH" 2>/dev/null || echo '')"
if [ -z "$TARGET_COMMIT" ]; then
  echo "[FEHLER] Branch origin/$BRANCH nicht gefunden." >&2
  exit 1
fi
TARGET_SUBJECT="$(git log -1 --format=%s "origin/$BRANCH" 2>/dev/null || echo '')"

# Nur den Remote-Stand deployen: lokale, nicht gepushte Commits ablehnen.
if [ -n "$(git log --oneline "origin/$BRANCH..HEAD" 2>/dev/null || true)" ]; then
  echo "[FEHLER] Lokale Commits vorhanden, die nicht auf origin/$BRANCH liegen:" >&2
  git log --oneline "origin/$BRANCH..HEAD" >&2 || true
  echo "         Bitte den Remote-Stand verwenden: git reset --hard origin/$BRANCH" >&2
  exit 1
fi

if [ "$OLD_COMMIT" = "$TARGET_COMMIT" ] && [ "$DEPLOYED_COMMIT" = "$TARGET_COMMIT" ] && [ "$FORCE_RESTART" -ne 1 ]; then
  echo "[OK] Bereits aktuell ($OLD_COMMIT)."
  echo "     Nur neu bauen/starten erzwingen: sh update.sh --force"
  echo ""
  echo "============================================"
  APP_PORT_VALUE="$(read_env APP_PORT)"
  valid_port "$APP_PORT_VALUE" || APP_PORT_VALUE=3000
  echo " Scanner : http://localhost:$APP_PORT_VALUE"
  echo "============================================"
  exit 0
fi

if [ "$OLD_COMMIT" != "$TARGET_COMMIT" ]; then
  echo "[INFO] Neuer Stand: $TARGET_COMMIT ${TARGET_SUBJECT:+($TARGET_SUBJECT)}"
else
  echo "[INFO] Stand unveraendert, aber Build/Deploy wird wiederholt."
fi

# --- Quellcode aktualisieren (nur Fast-Forward, keine Merge-Commits) ---
if ! git merge --ff-only "origin/$BRANCH"; then
  echo "[FEHLER] Update fehlgeschlagen: lokaler Branch kann nicht auf origin/$BRANCH" >&2
  echo "         vorgespult werden (History divergiert oder Datei im Weg?)." >&2
  echo "         Ursache pruefen: git status / git log --oneline --graph --all" >&2
  exit 1
fi
NEW_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"

# --- Backup vor Migration/Neubau ---
if [ "$SKIP_BACKUP" -ne 1 ]; then
  if $COMPOSE ps db 2>/dev/null | grep -qiE 'up|running'; then
    echo "[INFO] Datenbank-Backup vor dem Update..."
    if ! sh scripts/backup.sh; then
      echo "[FEHLER] Backup fehlgeschlagen - Update abgebrochen." >&2
      echo "         Mit 'sh update.sh --no-backup' ohne Backup fortfahren." >&2
      exit 1
    fi
  else
    echo "[FEHLER] Postgres-Container laeuft nicht - Backup nicht moeglich." >&2
    echo "         Stack starten ('$COMPOSE up -d') oder bewusst ohne Backup:" >&2
    echo "         sh update.sh --no-backup" >&2
    exit 1
  fi
else
  echo "[WARN] Backup uebersprungen (--no-backup/SKIP_BACKUP=1)." >&2
fi

# --- Container neu bauen und starten (Migration laeuft beim Start) ---
APP_PORT_VALUE="$(read_env APP_PORT)"
valid_port "$APP_PORT_VALUE" || APP_PORT_VALUE=3000

echo "[INFO] Container bauen und starten..."
up_ok=0
if [ "$FORCE_RESTART" -eq 1 ]; then
  $COMPOSE up -d --build --force-recreate app && up_ok=1 || up_ok=0
else
  $COMPOSE up -d --build && up_ok=1 || up_ok=0
fi
if [ "$up_ok" -ne 1 ]; then
  # Fehlgeschlagenes Deploy: Marker entfernen, damit der naechste Lauf neu baut.
  rm -f "$DEPLOYED_FILE" 2>/dev/null || echo "[WARN] Deploy-Marker konnte nicht entfernt werden." >&2
  echo "[FEHLER] '$COMPOSE up -d --build' fehlgeschlagen." >&2
  echo "         Logs: $COMPOSE logs -f app" >&2
  echo "         Erneut versuchen: sh update.sh" >&2
  exit 1
fi

echo "[INFO] Warte auf http://localhost:$APP_PORT_VALUE ..."
ready=0
tries=0
while [ "$tries" -lt 60 ]; do
  _hc=0
  health_ok "$APP_PORT_VALUE" || _hc=$?
  if [ "$_hc" -eq 0 ]; then
    ready=1
    break
  fi
  if [ "$_hc" -eq 2 ]; then
    if $COMPOSE ps app 2>/dev/null | grep -qiE 'up|running'; then
      ready=1
      break
    fi
  fi
  tries=$((tries + 1))
  sleep 2
done

if [ "$ready" -eq 1 ]; then
  echo "[OK] App antwortet."
else
  # Nicht bereit = fehlgeschlagenes Deploy: Marker entfernen, damit der naechste
  # Lauf erneut baut (z. B. fehlgeschlagene Migration).
  rm -f "$DEPLOYED_FILE" 2>/dev/null || echo "[WARN] Deploy-Marker konnte nicht entfernt werden." >&2
  echo "[FEHLER] App antwortet nicht (Build/Start oder Migration fehlgeschlagen?)." >&2
  echo "         Logs: $COMPOSE logs -f app" >&2
  echo "         Erneut versuchen: sh update.sh" >&2
  exit 1
fi

# Erfolgreichen Stand merken (markiert den Neubau als abgeschlossen).
# rm zuerst: unlink braucht nur Schreibrecht am Verzeichnis, nicht an der Datei
# (relevant, wenn ein frueherer Lauf per sudo eine Root-Datei hinterlassen hat).
rm -f "$DEPLOYED_FILE" 2>/dev/null || true
printf '%s\n' "$NEW_COMMIT" > "$DEPLOYED_FILE" 2>/dev/null || \
  echo "[WARN] Deployment-Stand konnte nicht gespeichert werden." >&2

echo ""
echo "============================================"
echo " Update abgeschlossen"
echo " Vorher : $OLD_COMMIT ${OLD_SUBJECT:+($OLD_SUBJECT)}"
echo " Jetzt  : $NEW_COMMIT ${TARGET_SUBJECT:+($TARGET_SUBJECT)}"
echo " Scanner: http://localhost:$APP_PORT_VALUE"
echo "============================================"

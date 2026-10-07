#!/bin/sh
# Datenbank-Backup als gzip-Dump. Aufruf: sh scripts/backup.sh
# ENV: RETENTION_DAYS (Default 14), BACKUP_DIR (Default ./backups)
#
# WICHTIG: Das Backup enthaelt Admin-Hash und Kartendaten (inkl. Fotos).
# Es wird mit umask 077 (Datei 0600, Verzeichnis 0700) geschrieben.

# CRLF-Schutz: Windows-Kopien enthalten \r und brechen sh-Skripte.
if [ -z "${NFC_LF_BACKUP:-}" ] && ! tr -d '\r' < "$0" | cmp -s - "$0" 2>/dev/null; then
  export NFC_LF_BACKUP=1
  _tmp="$(mktemp "${TMPDIR:-/tmp}/nfc-backup-XXXXXX")" || exit 1
  chmod 600 "$_tmp" 2>/dev/null || true
  trap 'rm -f "$_tmp"' EXIT
  trap 'rm -f "$_tmp"; exit 130' INT TERM HUP
  tr -d '\r' < "$0" > "$_tmp" || { rm -f "$_tmp"; echo "[FEHLER] CRLF-Konvertierung fehlgeschlagen." >&2; exit 1; }
  sh "$_tmp" "$@"
  _rc=$?
  rm -f "$_tmp"
  exit "$_rc"
fi

set -eu

RETENTION_DAYS="${RETENTION_DAYS:-14}"
case "$RETENTION_DAYS" in
  ''|*[!0-9]*)
    echo "[WARN] RETENTION_DAYS ungueltig ('$RETENTION_DAYS') - verwende 14." >&2
    RETENTION_DAYS=14
    ;;
esac
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"

COMPOSE=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "[FEHLER] Docker Compose nicht gefunden." >&2
  exit 1
fi

# Sensible Dumps: nur fuer den Eigentuemer lesbar/schreibbar.
umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true

FILE="$BACKUP_DIR/nfc-$STAMP.sql.gz"
DUMP_TMP="$BACKUP_DIR/nfc-$STAMP.sql"
GZ_TMP="$FILE.part"

# Unvollstaendige Artefakte bei Abbruch/Interrupt entfernen.
trap 'rm -f "$DUMP_TMP" "$GZ_TMP"' EXIT
trap 'rm -f "$DUMP_TMP" "$GZ_TMP"; exit 130' INT TERM HUP

# pg_dump in eine Temp-Datei schreiben, damit ein Fehler nicht von gzip
# verschluckt wird (POSIX sh kennt kein pipefail).
if ! $COMPOSE exec -T db pg_dump -U nfc -d nfc > "$DUMP_TMP"; then
  rm -f "$DUMP_TMP"
  echo "[FEHLER] pg_dump fehlgeschlagen - laeuft der db-Container?" >&2
  exit 1
fi
if [ ! -s "$DUMP_TMP" ]; then
  rm -f "$DUMP_TMP"
  echo "[FEHLER] pg_dump lieferte ein leeres Backup." >&2
  exit 1
fi
# Erst in eine Temp-Datei gzipen und dann atomar verschieben, damit ein Abbruch
# niemals eine partielle .gz-Datei hinterlaesst.
if ! gzip < "$DUMP_TMP" > "$GZ_TMP"; then
  rm -f "$DUMP_TMP" "$GZ_TMP"
  echo "[FEHLER] gzip fehlgeschlagen." >&2
  exit 1
fi
rm -f "$DUMP_TMP"
chmod 600 "$GZ_TMP" 2>/dev/null || true
if ! mv -f "$GZ_TMP" "$FILE"; then
  rm -f "$GZ_TMP"
  echo "[FEHLER] Backup konnte nicht abgelegt werden." >&2
  exit 1
fi
chmod 600 "$FILE" 2>/dev/null || true

echo "Backup: $FILE"

# Aufbewahrung ist Best-Effort: ein Fehler hier darf ein gueltiges Backup nicht
# als fehlgeschlagen erscheinen lassen. Alte Temp-Reste werden mit entfernt.
if find "$BACKUP_DIR" \
  \( -name 'nfc-*.sql.gz' -o -name 'nfc-*.sql' -o -name 'nfc-*.part' \) \
  -mtime "+$RETENTION_DAYS" -delete 2>/dev/null; then
  echo "Aufbewahrung: $RETENTION_DAYS Tage"
else
  echo "[WARN] Aufbewahrung konnte nicht bereinigt werden." >&2
fi

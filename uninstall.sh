#!/bin/sh
# Entfernt die NFC-Club-Access-Container von einer Synology NAS (oder Linux mit
# Docker Compose). Aufruf: sh uninstall.sh [--purge]
#
#   ohne Option : Container stoppen und entfernen. Datenbank-Volume, .env und
#                 backups/ bleiben erhalten (Neuinstallation moeglich).
#   --purge     Zusaetzlich das Datenbank-Volume und .env loeschen. ENDGUELTIG:
#                 alle Karten, Fotos und der Admin-Zugang gehen verloren.
#                 backups/ bleibt erhalten (falls vorhanden).
#
# Sicherheit: vor dem Loeschen ist eine Bestaetigung noetig. --purge verlangt
# das Eintippen von LOESCHEN.
# Nicht-interaktiv: FORCE=1 (normales Entfernen), FORCE_PURGE=1 (mit Volumes).

# CRLF-Schutz: Windows-Kopien enthalten \r und brechen sh-Skripte.
if [ -z "${NFC_LF_UNINSTALL:-}" ] && ! tr -d '\r' < "$0" | cmp -s - "$0" 2>/dev/null; then
  NFC_ORIG_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
  export NFC_ORIG_DIR NFC_LF_UNINSTALL=1
  _tmp="$(mktemp "${TMPDIR:-/tmp}/nfc-uninstall-XXXXXX")" || exit 1
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

SCRIPT_DIR="${NFC_ORIG_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)}"
cd "$SCRIPT_DIR"

say()  { printf '%s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*" >&2; }
fail() { printf '[FEHLER] %s\n' "$*" >&2; }

PURGE=0
for arg in "$@"; do
  case "$arg" in
    --purge) PURGE=1 ;;
    -h|--help)
      say "Aufruf: sh uninstall.sh [--purge]"
      say "  ohne Option   Container entfernen (Daten bleiben)"
      say "  --purge       zusaetzlich DB-Volume und .env loeschen (ENDGUELTIG)"
      exit 0
      ;;
    *)
      fail "Unbekannte Option: $arg"
      exit 1
      ;;
  esac
done

say "=== NFC Club Access - Deinstallation ==="

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker nicht gefunden."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  fail "Docker-Daemon nicht erreichbar. Ohne sudo erneut versuchen: sudo sh uninstall.sh"
  exit 1
fi

COMPOSE=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "Docker Compose nicht gefunden."
  exit 1
fi

INTERACTIVE=1
if [ ! -t 0 ]; then INTERACTIVE=0; fi

# 'docker compose down' interpoliert die Compose-Datei. Die Pflicht-Variablen
# muessen gesetzt sein, auch wenn .env schon geloescht wurde.
compose_down() {
  if [ -f .env ]; then
    $COMPOSE down "$@"
  else
    POSTGRES_PASSWORD=unused SESSION_SECRET=unused ADMIN_PASSWORD=unused $COMPOSE down "$@"
  fi
}

if [ "$PURGE" -eq 1 ]; then
  say ""
  say "!!! ACHTUNG: --purge loescht ENDGUELTIG:"
  say "    - alle Karten und Fotos (Datenbank-Volume)"
  say "    - die .env (Secrets, Admin-Passwort-Eintrag)"
  say "    backups/ bleibt erhalten."
  say ""
  if [ "${FORCE_PURGE:-0}" = "1" ]; then
    : # bestaetigt per FORCE_PURGE
  elif [ "$INTERACTIVE" -eq 0 ]; then
    fail "Nicht-interaktiv: zum Loeschen FORCE_PURGE=1 setzen."
    exit 1
  else
    printf 'Zum Bestaetigen LOESCHEN eintippen: ' >&2
    IFS= read -r _answer || _answer=""
    if [ "$_answer" != "LOESCHEN" ]; then
      say "Abgebrochen."
      exit 0
    fi
  fi
  say "[INFO] Entferne Container und Volume..."
  compose_down -v
  if [ -f .env ]; then
    rm -f .env
    say "[OK] .env entfernt."
  fi
else
  if [ "${FORCE:-0}" = "1" ]; then
    : # bestaetigt per FORCE
  elif [ "$INTERACTIVE" -eq 0 ]; then
    fail "Nicht-interaktiv: zum Entfernen FORCE=1 setzen."
    exit 1
  else
    printf 'Container stoppen und entfernen? Datenbank bleibt erhalten (j/n) [n]: ' >&2
    IFS= read -r _answer || _answer=""
    case "$_answer" in
      j|J|y|Y|ja|Ja|yes|Yes) : ;;
      *) say "Abgebrochen."; exit 0 ;;
    esac
  fi
  say "[INFO] Entferne Container..."
  compose_down
fi

say ""
say "[OK] Fertig."
if [ "$PURGE" -eq 1 ]; then
  say "     Neu installieren: sh install.sh"
else
  say "     Daten und .env sind erhalten. Erneut starten: $COMPOSE up -d"
fi

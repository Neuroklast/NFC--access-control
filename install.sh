#!/bin/sh
# Guided-Installer für Synology NAS (und jedes Linux mit Docker Compose).
# Aufruf: sh install.sh
#
# Der Installer fragt interaktiv nach:
#   - Admin-E-Mail und Admin-Passwort (leer = automatisch generieren)
#   - Demo-Karten (j/n)
#   - Host-Port der App
#   - ob Postgres auch im LAN erreichbar sein soll (inkl. Port)
# Bei einer bestehenden Installation (vorhandene .env) bleiben Admin-Zugang,
# DB-Passwort und Session-Secret erhalten; nur Ports/Demo werden abgefragt.
#
# Nicht-interaktiv (Automatisierung/CI) per Umgebungsvariablen:
#   NONINTERACTIVE=1
#   ADMIN_EMAIL=... ADMIN_PASSWORD=... SEED_DEMO=0|1
#   APP_PORT=3000 DB_BIND=127.0.0.1 DB_PORT=5432
#   FORCE_RECONFIGURE=1  (bestehende .env neu schreiben, Secrets bleiben erhalten)

# CRLF-Schutz: Windows-Kopien enthalten \r und brechen sh-Skripte.
if [ -z "${NFC_LF_INSTALL:-}" ] && ! tr -d '\r' < "$0" | cmp -s - "$0" 2>/dev/null; then
  NFC_ORIG_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
  export NFC_ORIG_DIR NFC_LF_INSTALL=1
  _tmp="$(mktemp "${TMPDIR:-/tmp}/nfc-install-XXXXXX")" || exit 1
  chmod 600 "$_tmp" 2>/dev/null || true
  tr -d '\r' < "$0" > "$_tmp" || { rm -f "$_tmp"; echo "[FEHLER] CRLF-Konvertierung fehlgeschlagen." >&2; exit 1; }
  sh "$_tmp" "$@"
  _rc=$?
  rm -f "$_tmp"
  exit "$_rc"
fi

set -eu

SCRIPT_DIR="${NFC_ORIG_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)}"
cd "$SCRIPT_DIR"

echo "=== NFC Club Access - Installation ==="

# --- Interaktiv? ---
INTERACTIVE=1
if [ "${NONINTERACTIVE:-0}" = "1" ] || [ ! -t 0 ]; then
  INTERACTIVE=0
fi

# Prompt nach stderr, Antwort nach stdout. Leere Eingabe -> Default.
ask() {
  _prompt="$1"
  _default="${2:-}"
  if [ "$INTERACTIVE" -eq 0 ]; then
    printf '%s' "$_default"
    return 0
  fi
  if [ -n "$_default" ]; then
    printf '%s [%s]: ' "$_prompt" "$_default" >&2
  else
    printf '%s: ' "$_prompt" >&2
  fi
  IFS= read -r _answer || _answer=""
  [ -n "$_answer" ] || _answer="$_default"
  printf '%s' "$_answer"
}

# $1 = Frage, $2 = Default (j/n). Gibt "j" oder "n" aus.
ask_yes_no() {
  _prompt="$1"
  _default="$2"
  if [ "$INTERACTIVE" -eq 0 ]; then
    printf '%s' "$_default"
    return 0
  fi
  while :; do
    printf '%s [%s]: ' "$_prompt" "$_default" >&2
    IFS= read -r _ans || _ans=""
    [ -n "$_ans" ] || _ans="$_default"
    case "$_ans" in
      j|J|y|Y|ja|Ja|yes|Yes) printf 'j'; return 0 ;;
      n|N|nein|Nein|no|No) printf 'n'; return 0 ;;
      *) printf 'Bitte j oder n.\n' >&2 ;;
    esac
  done
}

# Passwort ohne Echo (leer = automatisch generieren). Gibt das Passwort aus.
ask_password() {
  _prompt="$1"
  if [ "$INTERACTIVE" -eq 0 ]; then
    printf '%s' "${ADMIN_PASSWORD:-}"
    return 0
  fi
  printf '%s (leer = automatisch generieren): ' "$_prompt" >&2
  if command -v stty >/dev/null 2>&1; then
    _old_stty="$(stty -g 2>/dev/null || true)"
    if [ -n "$_old_stty" ]; then
      trap 'stty "$_old_stty" 2>/dev/null || true' EXIT
      trap 'stty "$_old_stty" 2>/dev/null || true; exit 130' INT TERM
      stty -echo 2>/dev/null || true
    fi
    IFS= read -r _pw || _pw=""
    if [ -n "$_old_stty" ]; then
      stty "$_old_stty" 2>/dev/null || true
      trap - EXIT INT TERM
    fi
    printf '\n' >&2
  else
    IFS= read -r _pw || _pw=""
  fi
  printf '%s' "$_pw"
}

# Erlaubte Zeichen fuer Nutzereingaben: keine Leerzeichen/Steuerzeichen und
# keine Zeichen, die Compose in .env umdeuten wuerde ($ # " ' ` \) .
valid_secret() {
  [ -n "$1" ] || return 1
  case "$1" in
    *[!A-Za-z0-9._@%+=:/!?*,-]*) return 1 ;;
  esac
  return 0
}

valid_port() {
  case "${1:-}" in
    ''|*[!0-9]*) return 1 ;;
  esac
  [ "$1" -ge 1 ] && [ "$1" -le 65535 ]
}

# $1 = Frage, $2 = Default-Port
ask_port() {
  _prompt="$1"
  _default="$2"
  if [ "$INTERACTIVE" -eq 0 ]; then
    printf '%s' "$_default"
    return 0
  fi
  while :; do
    printf '%s [%s]: ' "$_prompt" "$_default" >&2
    IFS= read -r _p || _p=""
    [ -n "$_p" ] || _p="$_default"
    if valid_port "$_p"; then
      printf '%s' "$_p"
      return 0
    fi
    printf 'Ungueltiger Port (1-65535).\n' >&2
  done
}

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

# --- Docker prüfen ---
if ! command -v docker >/dev/null 2>&1; then
  echo "[FEHLER] Docker nicht gefunden. Bitte auf der NAS den Container Manager installieren." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[FEHLER] Docker-Daemon nicht erreichbar." >&2
  echo "         Ohne sudo erneut versuchen: sudo sh install.sh" >&2
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

# --- Bestehende .env erkennen ---
HAD_ENV=0
EXISTING_PG_PW=""
EXISTING_SESSION=""
EXISTING_ADMIN_PW=""
EXISTING_ADMIN_EMAIL=""
EXISTING_SEED=""
EXISTING_APP_PORT=""
EXISTING_DB_PORT=""
EXISTING_DB_BIND=""

if [ -f .env ]; then
  HAD_ENV=1
  chmod 600 .env 2>/dev/null || true
  EXISTING_PG_PW="$(read_env POSTGRES_PASSWORD)"
  EXISTING_SESSION="$(read_env SESSION_SECRET)"
  EXISTING_ADMIN_PW="$(read_env ADMIN_PASSWORD)"
  EXISTING_ADMIN_EMAIL="$(read_env ADMIN_EMAIL)"
  EXISTING_SEED="$(read_env SEED_DEMO)"
  EXISTING_APP_PORT="$(read_env APP_PORT)"
  EXISTING_DB_PORT="$(read_env DB_PORT)"
  EXISTING_DB_BIND="$(read_env DB_BIND)"
fi

RECONFIGURE=1
if [ "$HAD_ENV" -eq 1 ]; then
  RECONFIGURE=0
  if [ "${FORCE_RECONFIGURE:-0}" = "1" ]; then
    RECONFIGURE=1
  elif [ "$(ask_yes_no 'Vorhandene .env verwenden' 'j')" = "n" ]; then
    RECONFIGURE=1
  fi
fi

NEW_ADMIN_PW=""
if [ "$RECONFIGURE" -eq 1 ]; then
  if [ "$HAD_ENV" -eq 0 ]; then
    echo ""
    echo "--- Admin-Zugang ---"
    while :; do
      ADMIN_EMAIL_ANSWER="$(ask 'Admin-E-Mail' "${ADMIN_EMAIL:-admin@club.local}")"
      if [ "$INTERACTIVE" -eq 0 ]; then break; fi
      if valid_secret "$ADMIN_EMAIL_ANSWER"; then break; fi
      printf 'Ungueltige Zeichen (keine Leerzeichen, $ #, Anfuehrungszeichen, Backslash).\n' >&2
    done
    while :; do
      ADMIN_PASSWORD_ANSWER="$(ask_password 'Admin-Passwort (min. 12 Zeichen)')"
      if [ -z "$ADMIN_PASSWORD_ANSWER" ]; then break; fi
      if [ "$INTERACTIVE" -eq 0 ]; then break; fi
      if [ "${#ADMIN_PASSWORD_ANSWER}" -lt 12 ] || ! valid_secret "$ADMIN_PASSWORD_ANSWER"; then
        printf 'Passwort zu kurz oder unerlaubte Zeichen (min. 12).\n' >&2
        continue
      fi
      ADMIN_PASSWORD_CONFIRM="$(ask_password 'Admin-Passwort wiederholen')"
      if [ "$ADMIN_PASSWORD_ANSWER" = "$ADMIN_PASSWORD_CONFIRM" ]; then
        break
      fi
      printf 'Passwoerter stimmen nicht ueberein.\n' >&2
    done
    export ADMIN_EMAIL="$ADMIN_EMAIL_ANSWER"
    if [ -n "$ADMIN_PASSWORD_ANSWER" ]; then
      export ADMIN_PASSWORD="$ADMIN_PASSWORD_ANSWER"
    else
      unset ADMIN_PASSWORD
    fi
  else
    # Bestehende Installation: Zugangsdaten und Secrets unverändert lassen.
    echo "[INFO] Bestehende Admin-Zugangsdaten, DB-Passwort und Session-Secret bleiben erhalten."
    export ADMIN_EMAIL="${EXISTING_ADMIN_EMAIL:-admin@club.local}"
    if [ -n "$EXISTING_ADMIN_PW" ]; then export ADMIN_PASSWORD="$EXISTING_ADMIN_PW"; fi
    if [ -n "$EXISTING_PG_PW" ]; then export POSTGRES_PASSWORD="$EXISTING_PG_PW"; fi
    if [ -n "$EXISTING_SESSION" ]; then export SESSION_SECRET="$EXISTING_SESSION"; fi
  fi

  echo ""
  echo "--- Demo & Ports ---"
  _seed_default="n"
  if [ "${SEED_DEMO:-${EXISTING_SEED:-0}}" = "1" ]; then _seed_default="j"; fi
  if [ "$(ask_yes_no 'Demo-Karten anlegen (DEMO-ACTIVE/DEMO-BLOCKED)' "$_seed_default")" = "j" ]; then
    SEED_DEMO_ANSWER=1
  else
    SEED_DEMO_ANSWER=0
  fi

  _app_default="${APP_PORT:-${EXISTING_APP_PORT:-3000}}"
  valid_port "$_app_default" || _app_default=3000
  _db_default="${DB_PORT:-${EXISTING_DB_PORT:-5432}}"
  valid_port "$_db_default" || _db_default=5432

  APP_PORT_ANSWER="$(ask_port 'Host-Port fuer die App' "$_app_default")"
  _db_lan_default="n"
  if [ "${DB_BIND:-${EXISTING_DB_BIND:-127.0.0.1}}" = "0.0.0.0" ]; then _db_lan_default="j"; fi
  if [ "$(ask_yes_no 'Postgres auch im LAN freigeben (nur wenn wirklich noetig)' "$_db_lan_default")" = "j" ]; then
    DB_BIND_ANSWER=0.0.0.0
    DB_PORT_ANSWER="$(ask_port 'Host-Port fuer Postgres' "$_db_default")"
  else
    DB_BIND_ANSWER=127.0.0.1
    DB_PORT_ANSWER="$(ask_port 'Host-Port fuer Postgres (nur lokal)' "$_db_default")"
  fi

  export SEED_DEMO="$SEED_DEMO_ANSWER"
  export APP_PORT="$APP_PORT_ANSWER"
  export DB_BIND="$DB_BIND_ANSWER"
  export DB_PORT="$DB_PORT_ANSWER"

  echo ""
  echo "[INFO] .env erzeugen..."
  if ! NEW_ADMIN_PW="$(sh scripts/init-env.sh --force)"; then
    echo "[FEHLER] .env-Erzeugung fehlgeschlagen." >&2
    exit 1
  fi
else
  echo "[INFO] .env vorhanden - wird verwendet."
  chmod 600 .env 2>/dev/null || true
fi

# --- Werte für Warteschleife und Zusammenfassung (validiert) ---
APP_PORT_VALUE="${APP_PORT:-$(read_env APP_PORT)}"
valid_port "$APP_PORT_VALUE" || APP_PORT_VALUE=3000
ADMIN_EMAIL_VALUE="$(read_env ADMIN_EMAIL)"
[ -n "$ADMIN_EMAIL_VALUE" ] || ADMIN_EMAIL_VALUE="admin@club.local"
SEED_DEMO_VALUE="${SEED_DEMO:-$(read_env SEED_DEMO)}"
DB_BIND_VALUE="${DB_BIND:-$(read_env DB_BIND)}"

echo "[INFO] Container bauen und starten..."
if ! $COMPOSE up -d --build; then
  echo "[FEHLER] '$COMPOSE up -d --build' fehlgeschlagen." >&2
  exit 1
fi

echo "[INFO] Warte auf http://localhost:$APP_PORT_VALUE ..."
ready=0
tries=0
while [ "$tries" -lt 60 ]; do
  if command -v curl >/dev/null 2>&1; then
    if curl -fsS -o /dev/null "http://localhost:$APP_PORT_VALUE" 2>/dev/null; then ready=1; break; fi
  elif command -v wget >/dev/null 2>&1; then
    if wget -q -O /dev/null "http://localhost:$APP_PORT_VALUE" 2>/dev/null; then ready=1; break; fi
  elif $COMPOSE ps app 2>/dev/null | grep -qiE 'up|running'; then
    ready=1
    break
  fi
  tries=$((tries + 1))
  sleep 2
done

if [ "$ready" -eq 1 ]; then
  echo "[OK] App antwortet."
else
  echo "[WARN] App antwortet noch nicht. Logs: $COMPOSE logs -f app" >&2
fi

if [ "${SEED_DEMO_VALUE:-0}" = "1" ]; then
  echo "[INFO] Demo-Daten seeden..."
  seed_ok=0
  seed_tries=0
  while [ "$seed_tries" -lt 5 ]; do
    if $COMPOSE exec -T app node scripts/seed-demo.mjs; then seed_ok=1; break; fi
    seed_tries=$((seed_tries + 1))
    sleep 3
  done
  [ "$seed_ok" -eq 1 ] || echo "[WARN] Demo-Seed übersprungen." >&2
fi

echo ""
echo "============================================"
echo " Scanner : http://localhost:$APP_PORT_VALUE"
echo " Admin   : http://localhost:$APP_PORT_VALUE/admin/login"
if [ "$HAD_ENV" -eq 1 ]; then
  echo " Login   : $ADMIN_EMAIL_VALUE"
  echo " Passwort: laut ADMIN_PASSWORD in .env"
  echo " (existiert der Admin bereits, gilt das alte Passwort;"
  echo "  aendern nach dem Login unter /admin/password)"
elif [ -n "$NEW_ADMIN_PW" ]; then
  echo " Login   : $ADMIN_EMAIL_VALUE"
  echo " Passwort: $NEW_ADMIN_PW"
  echo " (steht auch in .env - bitte nach dem Login aendern)"
else
  echo " Login   : $ADMIN_EMAIL_VALUE"
  echo " Passwort: (selbst gesetzt - siehe .env)"
fi
echo " Stoppen : $COMPOSE down"
echo "============================================"
if [ "$DB_BIND_VALUE" = "0.0.0.0" ]; then
  echo ""
  echo "HINWEIS: Postgres ist im LAN freigegeben. Docker kann die Host-Firewall"
  echo "         umgehen - Port nicht am Router weiterleiten."
fi
echo ""
echo "Naechste Schritte:"
echo "  1. HTTPS ueber den DSM Reverse Proxy auf Port $APP_PORT_VALUE einrichten"
echo "     (Pflicht fuer Web NFC & Kamera) - siehe docs/ops/synology.md"
echo "  2. Fuer Zugriff von aussen nur 443 am Router weiterleiten, NICHT $APP_PORT_VALUE."

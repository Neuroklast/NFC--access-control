#!/bin/sh
# Geführter Installer für Synology NAS (und jedes Linux mit Docker Compose).
# Aufruf: sh install.sh
#
# Der Installer führt in nummerierten Schritten durch die Einrichtung:
#   1) Voraussetzungen prüfen (Docker, Compose, Port, Speicher)
#   2) Admin-E-Mail/Passwort, Demo-Karten, Ports abfragen
#   3) .env erzeugen
#   4) Container bauen und starten
#   5) Warten und verifizieren (DB, Admin-Login, Demo-Karte)
#   6) LAN-Adressen ermitteln
#   7) Zusammenfassung + nächster Schritt (HTTPS)
#
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

say()  { printf '%s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*" >&2; }
fail() { printf '[FEHLER] %s\n' "$*" >&2; }
step() { printf '\n=== %s ===\n' "$*"; }

# shellcheck source=scripts/lib.sh
. ./scripts/lib.sh

say "=== NFC Club Access - Installation ==="

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

# --- Netzwerk-/Prüf-Helfer (best-effort, busybox-tauglich) ---

# 0 = Port belegt (lokale Listen-Sockets), 1 = frei oder nicht pruefbar.
port_in_use() {
  _p="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk 'NR>1 {print $4}' | grep -qE "[:.]${_p}\$"
  elif command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | awk 'NR>2 {print $4}' | grep -qE "[:.]${_p}\$"
  else
    return 1
  fi
}

# Freier Speicher am aktuellen Verzeichnis in KB (0 wenn nicht ermittelbar).
disk_free_kb() {
  if command -v df >/dev/null 2>&1; then
    _kb="$(df -Pk . 2>/dev/null | awk 'NR==2 {print $4}')"
    case "$_kb" in
      ''|*[!0-9]*) printf '0' ;;
      *) printf '%s' "$_kb" ;;
    esac
  else
    printf '0'
  fi
}

# Erste nicht-lokale IPv4 (best-effort). Leer, wenn nicht ermittelbar.
lan_ip() {
  _ip=""
  if command -v ip >/dev/null 2>&1; then
    _ip="$(ip route get 1.1.1.1 2>/dev/null | awk 'NR==1 {for (i=1;i<=NF;i++) if ($i=="src") print $(i+1)}')"
    if [ -z "$_ip" ]; then
      _ip="$(ip -4 addr show scope global 2>/dev/null | awk '/inet /{sub(/\/.*/,"",$2); if ($2!="127.0.0.1"){print $2; exit}}')"
    fi
  fi
  if [ -z "$_ip" ] && command -v hostname >/dev/null 2>&1; then
    _ip="$(hostname -i 2>/dev/null | awk '{print $1}')"
  fi
  case "$_ip" in
    127.*|'') printf '' ;;
    *) printf '%s' "$_ip" ;;
  esac
}

# Gibt den HTTP-Statuscode des Login-Versuchs aus (leer, wenn nicht pruefbar).
login_status() {
  _port="$1" _email="$2" _pw="$3"
  if ! command -v curl >/dev/null 2>&1; then printf ''; return 0; fi
  curl -s --connect-timeout 3 --max-time 5 -o /dev/null -w '%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${_email}\",\"password\":\"${_pw}\"}" \
    "http://localhost:${_port}/api/v1/sessions" 2>/dev/null || printf ''
}

# Gibt den HTTP-Statuscode des Karten-Checks aus (leer, wenn nicht pruefbar).
verify_status() {
  _port="$1" _uid="$2"
  if ! command -v curl >/dev/null 2>&1; then printf ''; return 0; fi
  curl -s --connect-timeout 3 --max-time 5 -o /dev/null -w '%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d "{\"card_uid\":\"${_uid}\"}" \
    "http://localhost:${_port}/api/v1/card-verifications" 2>/dev/null || printf ''
}

# --- Bestehende .env erkennen (vor den Checks, fuer den Port) ---
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

# ===========================================================================
step "Schritt 1/7 - Voraussetzungen"
# ===========================================================================

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker nicht gefunden. Bitte auf der NAS den Container Manager installieren."
  exit 1
fi
say "[OK] Docker gefunden."

if ! docker info >/dev/null 2>&1; then
  fail "Docker-Daemon nicht erreichbar."
  say "      Ohne sudo erneut versuchen: sudo sh install.sh" >&2
  exit 1
fi
say "[OK] Docker-Daemon erreichbar."

if [ -n "$(docker compose version 2>/dev/null || true)" ]; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "Docker Compose nicht gefunden."
  exit 1
fi
say "[OK] Docker Compose gefunden ($COMPOSE)."

_seed_port="${APP_PORT:-${EXISTING_APP_PORT:-3000}}"
app_running=0
if $COMPOSE ps app 2>/dev/null | grep -qiE 'up|running'; then app_running=1; fi
if [ "$app_running" -eq 0 ] && port_in_use "$_seed_port"; then
  warn "Port $_seed_port scheint belegt. Ist das ein anderes Programm, waehle spaeter einen anderen Host-Port."
fi

_free_kb="$(disk_free_kb)"
if [ "$_free_kb" -gt 0 ] && [ "$_free_kb" -lt 1048576 ]; then
  warn "Nur $(( _free_kb / 1024 )) MB frei - der Build braucht etwas Platz."
fi

# ===========================================================================
step "Schritt 2/7 - Zugangsdaten und Optionen"
# ===========================================================================

RECONFIGURE=1
if [ "$HAD_ENV" -eq 1 ]; then
  RECONFIGURE=0
  if [ "${FORCE_RECONFIGURE:-0}" = "1" ]; then
    RECONFIGURE=1
  elif [ "$(ask_yes_no 'Vorhandene .env verwenden' 'j')" = "n" ]; then
    RECONFIGURE=1
  fi
fi

ADMIN_PASSWORD_ANSWER=""
NEW_ADMIN_PW=""
if [ "$RECONFIGURE" -eq 1 ]; then
  if [ "$HAD_ENV" -eq 0 ]; then
    say ""
    say "--- Admin-Zugang ---"
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
    say "[INFO] Bestehende Admin-Zugangsdaten, DB-Passwort und Session-Secret bleiben erhalten."
    export ADMIN_EMAIL="${EXISTING_ADMIN_EMAIL:-admin@club.local}"
    if [ -n "$EXISTING_ADMIN_PW" ]; then export ADMIN_PASSWORD="$EXISTING_ADMIN_PW"; fi
    if [ -n "$EXISTING_PG_PW" ]; then export POSTGRES_PASSWORD="$EXISTING_PG_PW"; fi
    if [ -n "$EXISTING_SESSION" ]; then export SESSION_SECRET="$EXISTING_SESSION"; fi
  fi

  say ""
  say "--- Demo und Ports ---"
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
else
  say "[INFO] .env vorhanden - wird verwendet."
fi

# ===========================================================================
step "Schritt 3/7 - Konfiguration schreiben"
# ===========================================================================

if [ "$RECONFIGURE" -eq 1 ]; then
  if ! NEW_ADMIN_PW="$(sh scripts/init-env.sh --force)"; then
    fail ".env-Erzeugung fehlgeschlagen."
    exit 1
  fi
  chmod 600 .env 2>/dev/null || true
  say "[OK] .env erzeugt."
else
  chmod 600 .env 2>/dev/null || true
fi

# Werte fuer spaetere Schritte (validiert).
APP_PORT_VALUE="${APP_PORT:-$(read_env APP_PORT)}"
valid_port "$APP_PORT_VALUE" || APP_PORT_VALUE=3000
ADMIN_EMAIL_VALUE="$(read_env ADMIN_EMAIL)"
[ -n "$ADMIN_EMAIL_VALUE" ] || ADMIN_EMAIL_VALUE="admin@club.local"
SEED_DEMO_VALUE="${SEED_DEMO:-$(read_env SEED_DEMO)}"
DB_BIND_VALUE="${DB_BIND:-$(read_env DB_BIND)}"

# ===========================================================================
step "Schritt 4/7 - Container bauen und starten"
# ===========================================================================
say "[INFO] Das kann beim ersten Mal einige Minuten dauern..."

if ! $COMPOSE up -d --build; then
  fail "'$COMPOSE up -d --build' fehlgeschlagen."
  say "      Logs: $COMPOSE logs -f app" >&2
  exit 1
fi
say "[OK] Container gestartet."

# ===========================================================================
step "Schritt 5/7 - Warten und verifizieren"
# ===========================================================================

say "[INFO] Warte auf die App (http://localhost:$APP_PORT_VALUE)..."
ready=0
tries=0
while [ "$tries" -lt 60 ]; do
  _hc=0
  health_ok "$APP_PORT_VALUE" || _hc=$?
  if [ "$_hc" -eq 0 ]; then ready=1; break; fi
  if [ "$_hc" -eq 2 ]; then
    # Kein curl/wget vorhanden - nur pruefen, ob der Container laeuft.
    if $COMPOSE ps app 2>/dev/null | grep -qiE 'up|running'; then ready=1; break; fi
  fi
  tries=$((tries + 1))
  sleep 2
done

if [ "$ready" -eq 1 ]; then
  say "[OK] App antwortet."
else
  fail "App antwortet nicht (Build, Start oder Migration fehlgeschlagen?)."
  say "      Logs: $COMPOSE logs -f app" >&2
  exit 1
fi

# Demo-Daten zuerst (damit der Karten-Test spaeter funktioniert).
if [ "${SEED_DEMO_VALUE:-0}" = "1" ]; then
  say "[INFO] Demo-Daten seeden..."
  seed_ok=0
  seed_tries=0
  while [ "$seed_tries" -lt 5 ]; do
    if $COMPOSE exec -T app node scripts/seed-demo.mjs; then seed_ok=1; break; fi
    seed_tries=$((seed_tries + 1))
    sleep 3
  done
  [ "$seed_ok" -eq 1 ] || warn "Demo-Seed uebersprungen."
fi

# Admin-Login verifizieren (genau ein Versuch; zaehlt im Rate-Limit).
LOGIN_PW=""
if [ "$HAD_ENV" -eq 0 ]; then
  if [ -n "$ADMIN_PASSWORD_ANSWER" ]; then
    LOGIN_PW="$ADMIN_PASSWORD_ANSWER"
  else
    LOGIN_PW="$NEW_ADMIN_PW"
  fi
elif [ -n "$EXISTING_ADMIN_PW" ]; then
  LOGIN_PW="$EXISTING_ADMIN_PW"
fi

if [ -n "$LOGIN_PW" ]; then
  LOGIN_CODE="$(login_status "$APP_PORT_VALUE" "$ADMIN_EMAIL_VALUE" "$LOGIN_PW")"
  if [ "$LOGIN_CODE" = "204" ]; then
    say "[OK] Admin-Login funktioniert ($ADMIN_EMAIL_VALUE)."
  elif [ -z "$LOGIN_CODE" ]; then
    warn "Login-Test uebersprungen (curl fehlt)."
  else
    warn "Login-Test lieferte HTTP $LOGIN_CODE - Passwort in .env pruefen (bei bestehender Installation gilt ggf. das alte Passwort)."
  fi
else
  warn "Login-Test uebersprungen (Passwort nicht bekannt)."
fi

if [ "${SEED_DEMO_VALUE:-0}" = "1" ]; then
  CARD_CODE="$(verify_status "$APP_PORT_VALUE" "DEMO-ACTIVE")"
  if [ "$CARD_CODE" = "200" ]; then
    say "[OK] Karten-Pruefung funktioniert (DEMO-ACTIVE)."
  elif [ -n "$CARD_CODE" ]; then
    warn "Karten-Test lieferte HTTP $CARD_CODE."
  fi
fi

# ===========================================================================
step "Schritt 6/7 - LAN-Adresse"
# ===========================================================================
LAN_IP="$(lan_ip)"
if [ -n "$LAN_IP" ]; then
  say "[OK] LAN-Adresse: $LAN_IP"
else
  warn "LAN-Adresse konnte nicht automatisch ermittelt werden (in DSM unter Systemsteuerung > Netzwerk nachsehen)."
fi

# ===========================================================================
step "Schritt 7/7 - Fertig"
# ===========================================================================
echo ""
echo "============================================"
echo " NFC Club Access ist bereit"
echo "============================================"
echo " Auf der NAS  : http://localhost:$APP_PORT_VALUE"
if [ -n "$LAN_IP" ]; then
  echo " Im WLAN      : http://$LAN_IP:$APP_PORT_VALUE"
fi
echo " Admin-Login  : http://localhost:$APP_PORT_VALUE/admin/login"
if [ "$HAD_ENV" -eq 1 ]; then
  echo " Login        : $ADMIN_EMAIL_VALUE"
  echo " Passwort     : laut ADMIN_PASSWORD in .env (bei bestehender Installation"
  echo "                gilt ggf. das alte Passwort; aendern unter /admin/password)"
elif [ -n "$NEW_ADMIN_PW" ]; then
  echo " Login        : $ADMIN_EMAIL_VALUE"
  echo " Passwort     : $NEW_ADMIN_PW"
  echo "                (steht auch in .env - bitte nach dem Login aendern)"
else
  echo " Login        : $ADMIN_EMAIL_VALUE"
  echo " Passwort     : (selbst gesetzt - siehe .env)"
fi
if [ "${SEED_DEMO_VALUE:-0}" = "1" ]; then
  echo " Demo-Karten  : DEMO-ACTIVE (gruen) / DEMO-BLOCKED (rot)"
fi
echo " Stoppen      : $COMPOSE down"
echo "============================================"

if [ "$DB_BIND_VALUE" = "0.0.0.0" ]; then
  echo ""
  echo "HINWEIS: Postgres ist im LAN freigegeben. Docker kann die Host-Firewall"
  echo "         umgehen - Port nicht am Router weiterleiten."
fi

echo ""
echo "NAECHSTER PFLICHTSCHRITT - HTTPS (sonst gehen NFC und Kamera nicht):"
echo "  1. DSM > Systemsteuerung > Anmeldeportal > Reverse Proxy > Erstellen"
echo "       Quelle : https://deine-domain.tld:443  (HSTS aktivieren)"
echo "       Ziel   : http://localhost:$APP_PORT_VALUE"
echo "  2. DSM > Systemsteuerung > Sicherheit > Zertifikat > Let's Encrypt fuer die Domain"
echo "  3. Router: nur Port 443 auf die NAS weiterleiten, NICHT $APP_PORT_VALUE"
echo "  Danach die App ueber https://deine-domain.tld aufrufen."
echo "  Details: docs/ops/synology.md"
echo ""

#!/bin/sh
# Erzeugt .env mit Zufallswerten (Pendant zu scripts/init-env.ps1).
# Aufruf: sh scripts/init-env.sh [--force]
# Gibt im Normalbetrieb NUR ein generiertes Admin-Passwort auf stdout aus;
# Meldungen gehen nach stderr. Wurde ADMIN_PASSWORD vorgegeben, ist stdout leer.
#
# Optionen (auch per Umgebungsvariable):
#   ADMIN_EMAIL        Login-E-Mail des Admins (Default admin@club.local)
#   ADMIN_PASSWORD     Admin-Passwort (min. 12 Zeichen); leer = generieren
#   SEED_DEMO          1 = Demo-Karten beim Start anlegen (Default 0)
#   APP_PORT           Host-Port der App (Default 3000)
#   POSTGRES_PASSWORD  vorhandenes DB-Passwort beibehalten (sonst generieren)
#   SESSION_SECRET     vorhandenes Session-Secret beibehalten (sonst generieren)
#   ENV_FILE           Ziel-Datei (Default .env)

# CRLF-Schutz: Windows-Kopien enthalten \r und brechen sh-Skripte.
if [ -z "${NFC_LF_INITENV:-}" ] && ! tr -d '\r' < "$0" | cmp -s - "$0" 2>/dev/null; then
  export NFC_LF_INITENV=1
  _tmp="$(mktemp "${TMPDIR:-/tmp}/nfc-init-env-XXXXXX")" || exit 1
  chmod 600 "$_tmp" 2>/dev/null || true
  tr -d '\r' < "$0" > "$_tmp" || { rm -f "$_tmp"; echo "[init-env] CRLF-Konvertierung fehlgeschlagen." >&2; exit 1; }
  sh "$_tmp" "$@"
  _rc=$?
  rm -f "$_tmp"
  exit "$_rc"
fi

set -eu

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    -h|--help)
      echo "Aufruf: sh scripts/init-env.sh [--force]" >&2
      exit 0
      ;;
    *)
      echo "[init-env] Unbekannte Option: $arg" >&2
      exit 1
      ;;
  esac
done

ENV_FILE="${ENV_FILE:-.env}"

if [ -f "$ENV_FILE" ] && [ "$FORCE" -ne 1 ]; then
  echo "[init-env] $ENV_FILE existiert bereits - nicht überschrieben (--force erzwingt)." >&2
  exit 0
fi

# Zufallswert als base64url. Es werden ausschliesslich die erlaubten Zeichen
# behalten, damit plattformspezifische Zeilenenden (\r, \n) oder Padding (=)
# niemals in die Secrets gelangen.
rand() {
  if command -v openssl >/dev/null 2>&1; then
    _rand_raw="$(openssl rand -base64 "$1")"
  else
    _rand_raw="$(head -c "$1" /dev/urandom | base64)"
  fi
  printf '%s' "$_rand_raw" | tr '+/' '-_' | tr -cd 'A-Za-z0-9_-'
}

# Erlaubte Zeichen fuer Nutzereingaben: keine Leerzeichen/Steuerzeichen und
# keine Zeichen, die Compose in .env umdeuten wuerde ($ # " ' ` \) .
# So kann der in .env gespeicherte Wert nicht vom tatsaechlich verwendeten abweichen.
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

# Secrets, die in eine postgresql://-URL eingebettet werden, dürfen nur
# base64url-Zeichen enthalten (sonst wuerde die URL umgedeutet).
valid_base64url() {
  [ -n "$1" ] || return 1
  case "$1" in
    *[!A-Za-z0-9_-]*) return 1 ;;
  esac
  return 0
}

# Vorhandene Secrets beibehalten (z. B. bei Rekonfiguration mit bestehendem Volume).
SESSION_SECRET_IN="${SESSION_SECRET:-}"
if [ -n "$SESSION_SECRET_IN" ]; then
  SESSION_SECRET="$SESSION_SECRET_IN"
else
  SESSION_SECRET="$(rand 48)"
fi

POSTGRES_PASSWORD_IN="${POSTGRES_PASSWORD:-}"
if [ -n "$POSTGRES_PASSWORD_IN" ]; then
  POSTGRES_PASSWORD="$POSTGRES_PASSWORD_IN"
else
  POSTGRES_PASSWORD="$(rand 24)"
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@club.local}"
SEED_DEMO="${SEED_DEMO:-0}"
APP_PORT="${APP_PORT:-3000}"

ADMIN_PASSWORD_GENERATED=0
ADMIN_PASSWORD_IN="${ADMIN_PASSWORD:-}"
if [ -n "$ADMIN_PASSWORD_IN" ]; then
  ADMIN_PASSWORD="$ADMIN_PASSWORD_IN"
else
  ADMIN_PASSWORD="$(rand 18)"
  ADMIN_PASSWORD_GENERATED=1
fi

case "$SEED_DEMO" in
  0|1) ;;
  *)
    echo "[init-env] SEED_DEMO muss 0 oder 1 sein." >&2
    exit 1
    ;;
esac

case "$ADMIN_EMAIL" in
  "" | *[![:print:]]*)
    echo "[init-env] ADMIN_EMAIL ist leer oder enthaelt Steuerzeichen." >&2
    exit 1
    ;;
esac

case "$ADMIN_PASSWORD" in
  *[![:print:]]*)
    echo "[init-env] ADMIN_PASSWORD enthaelt Steuerzeichen." >&2
    exit 1
    ;;
esac

valid_secret "$ADMIN_EMAIL" || { echo "[init-env] ADMIN_EMAIL enthaelt unerlaubte Zeichen." >&2; exit 1; }
valid_secret "$ADMIN_PASSWORD" || { echo "[init-env] ADMIN_PASSWORD enthaelt unerlaubte Zeichen." >&2; exit 1; }
valid_base64url "$POSTGRES_PASSWORD" || { echo "[init-env] POSTGRES_PASSWORD darf nur A-Za-z0-9_- enthalten." >&2; exit 1; }
valid_secret "$SESSION_SECRET" || { echo "[init-env] SESSION_SECRET enthaelt unerlaubte Zeichen." >&2; exit 1; }

valid_port "$APP_PORT" || { echo "[init-env] APP_PORT muss zwischen 1 und 65535 liegen." >&2; exit 1; }

# Fail closed, falls eine Zufallsquelle nichts geliefert hat.
[ "${#SESSION_SECRET}" -ge 32 ] || { echo "[init-env] SESSION_SECRET zu kurz - Zufallsquelle fehlgeschlagen." >&2; exit 1; }
[ "${#POSTGRES_PASSWORD}" -ge 16 ] || { echo "[init-env] POSTGRES_PASSWORD zu kurz - Zufallsquelle fehlgeschlagen." >&2; exit 1; }
[ "${#ADMIN_PASSWORD}" -ge 12 ] || { echo "[init-env] ADMIN_PASSWORD muss mindestens 12 Zeichen haben." >&2; exit 1; }

# Zusaetzliche, nicht vom Installer verwaltete Schluessel erhalten (z. B. DEMO_MODE).
# DB_BIND/DB_PORT werden nicht mehr geschrieben, stehen aber weiter in der
# Ausschlussliste, damit ein Reconfigure sie aus alten .env-Dateien entfernt.
_extras=""
if [ -f "$ENV_FILE" ]; then
  _extras="$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE" | grep -vE '^(DATABASE_URL|DIRECT_URL|SESSION_SECRET|ADMIN_EMAIL|ADMIN_PASSWORD|POSTGRES_PASSWORD|SEED_DEMO|APP_PORT|DB_BIND|DB_PORT)=' | tr -d '\r' || true)"
fi

# Atomar schreiben: Temp-Datei mit 0600 anlegen und ueber $ENV_FILE moven,
# damit auch bei --force keine kurzzeitig offene Datei entsteht.
umask 077
_tmp_env="$(mktemp "${ENV_FILE}.XXXXXX")" || { echo "[init-env] Temp-Datei konnte nicht erstellt werden." >&2; exit 1; }
trap 'rm -f "$_tmp_env"' EXIT
trap 'exit 130' INT TERM HUP
cat > "$_tmp_env" <<EOF
DATABASE_URL=postgresql://nfc:$POSTGRES_PASSWORD@localhost:5432/nfc
DIRECT_URL=postgresql://nfc:$POSTGRES_PASSWORD@localhost:5432/nfc
SESSION_SECRET=$SESSION_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
SEED_DEMO=$SEED_DEMO
APP_PORT=$APP_PORT
EOF
if [ -n "$_extras" ]; then
  printf '%s\n' "$_extras" >> "$_tmp_env"
fi
chmod 600 "$_tmp_env" 2>/dev/null || true
mv -f "$_tmp_env" "$ENV_FILE" || { rm -f "$_tmp_env"; echo "[init-env] $ENV_FILE konnte nicht geschrieben werden." >&2; exit 1; }

echo "[init-env] $ENV_FILE erzeugt (SEED_DEMO=$SEED_DEMO)." >&2
if [ "$ADMIN_PASSWORD_GENERATED" -eq 1 ]; then
  echo "$ADMIN_PASSWORD"
fi

#!/bin/sh
# Gemeinsame Shell-Helfer fuer install.sh und update.sh.
# Einbinden: nach 'cd' in die Repo-Wurzel mit '. ./scripts/lib.sh'.

# 0 = Health ok und DB erreichbar, 1 = nein, 2 = kein HTTP-Werkzeug vorhanden.
health_ok() {
  _port="$1"
  if command -v curl >/dev/null 2>&1; then
    _body="$(curl -fsS --connect-timeout 3 --max-time 5 "http://localhost:${_port}/api/v1/health" 2>/dev/null)" || return 1
  elif command -v wget >/dev/null 2>&1; then
    _body="$(wget -qO- -T 5 "http://localhost:${_port}/api/v1/health" 2>/dev/null)" || return 1
  else
    return 2
  fi
  case "$_body" in
    *'"db":true'*) return 0 ;;
    *) return 1 ;;
  esac
}

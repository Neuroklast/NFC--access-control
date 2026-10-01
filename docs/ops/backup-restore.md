# Ops — Backup & Restore

Die Datenbank ist klein (Kartenstammdaten + Fotos als `bytea`). Ein `pg_dump` deckt alles ab.

## Backup

Windows:

```bat
backup.bat
```

Linux/NAS/macOS:

```sh
sh scripts/backup.sh
```

Ergebnis: `backups/nfc-YYYYMMDD-HHMMSS.sql.gz`, Retention `RETENTION_DAYS` (Default 14).

### Automatisieren

- **Synology:** Aufgabenplaner → Skript `sh /volume1/docker/nfc-access-control/scripts/backup.sh`, täglich.
- **Windows:** Task Scheduler → `backup.bat`, täglich.

Backups liegen neben dem Repo. Für NAS empfiehlt sich ein Share, das von Synology Hyper Backup mitgesichert wird.

## Restore

```sh
gunzip -c backups/nfc-20260928-120000.sql.gz | docker compose exec -T db psql -U nfc -d nfc
```

Nach dem Restore `docker compose restart app` und Login prüfen.

## Test

Ein Backup ist erst gültig, wenn ein Restore geprüft wurde. Mindestens einmal: Restore in eine leere Datenbank, Login und eine Kartenprüfung durchführen.

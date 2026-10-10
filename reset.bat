@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo === NFC Club Access - Zuruecksetzen ===

where docker >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Docker wurde nicht gefunden.
  exit /b 1
)
docker info >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Docker laeuft nicht.
  exit /b 1
)

set "PURGE=0"
if /i "%~1"=="--purge" set "PURGE=1"

if "!PURGE!"=="1" (
  echo.
  echo !!! ACHTUNG: --purge loescht ENDGUELTIG:
  echo     - alle Karten und Fotos ^(Datenbank-Volume^)
  echo     - die .env ^(Secrets, Admin-Passwort-Eintrag^)
  echo     backups\ bleibt erhalten.
  echo.
  set /p "CONFIRM=Zum Bestaetigen LOESCHEN eintippen: "
  if not "!CONFIRM!"=="LOESCHEN" (
    echo Abgebrochen.
    exit /b 0
  )
  echo [INFO] Entferne Container und Volume...
  docker compose down -v
  if exist ".env" (
    del /q ".env"
    echo [OK] .env entfernt.
  )
) else (
  set /p "CONFIRM=Container stoppen und entfernen? Datenbank bleibt (j/n) [n]: "
  if /i not "!CONFIRM!"=="j" (
    if /i not "!CONFIRM!"=="ja" (
      echo Abgebrochen.
      exit /b 0
    )
  )
  echo [INFO] Entferne Container...
  docker compose down
)

echo.
echo [OK] Fertig.
if "!PURGE!"=="1" (
  echo      Neu installieren: start.bat
) else (
  echo      Daten und .env sind erhalten. Erneut starten: docker compose up -d
)
endlocal

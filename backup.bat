@echo off
setlocal
cd /d "%~dp0"

if "%RETENTION_DAYS%"=="" set "RETENTION_DAYS=14"
if "%BACKUP_DIR%"=="" set "BACKUP_DIR=backups"

where gzip >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] gzip nicht gefunden. Bitte gzip installieren.
  exit /b 1
)
for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss-fff"') do set "STAMP=%%a"
if not defined STAMP (
  echo [FEHLER] Zeitstempel konnte nicht erzeugt werden.
  exit /b 1
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
set "FILE=%BACKUP_DIR%\nfc-%STAMP%.sql.gz"

set "DUMP_TMP=%FILE%.sql.part"
set "GZ_TMP=%FILE%.part"
echo [INFO] Backup nach %FILE%
docker compose exec -T db pg_dump -U nfc -d nfc > "%DUMP_TMP%"
if errorlevel 1 goto backup_failed
for %%a in ("%DUMP_TMP%") do if %%~za EQU 0 goto backup_failed
gzip < "%DUMP_TMP%" > "%GZ_TMP%"
if errorlevel 1 goto backup_failed
move /y "%GZ_TMP%" "%FILE%" >nul
if errorlevel 1 goto backup_failed
del /q "%DUMP_TMP%" 2>nul

echo [OK] Backup erstellt.

forfiles /p "%BACKUP_DIR%" /m "nfc-*.sql.gz" /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
echo [INFO] Aufbewahrung: %RETENTION_DAYS% Tage
endlocal
exit /b 0

:backup_failed
del /q "%DUMP_TMP%" "%GZ_TMP%" 2>nul
echo [FEHLER] Backup fehlgeschlagen. Kein Backup erstellt.
exit /b 1

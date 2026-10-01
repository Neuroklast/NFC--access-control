@echo off
setlocal
cd /d "%~dp0"

if "%RETENTION_DAYS%"=="" set "RETENTION_DAYS=14"
if "%BACKUP_DIR%"=="" set "BACKUP_DIR=backups"

for /f "tokens=1-4 delims=/. " %%a in ("%DATE%") do set "D=%%c%%b%%a"
set "T=%TIME::=%"
set "T=%T: =0%"
set "STAMP=%D%-%T:~0,6%"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
set "FILE=%BACKUP_DIR%\nfc-%STAMP%.sql.gz"

echo [INFO] Backup nach %FILE%
docker compose exec -T db pg_dump -U nfc -d nfc | gzip > "%FILE%"
if errorlevel 1 (
  echo [FEHLER] Backup fehlgeschlagen.
  exit /b 1
)
echo [OK] Backup erstellt.

forfiles /p "%BACKUP_DIR%" /m "nfc-*.sql.gz" /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
echo [INFO] Aufbewahrung: %RETENTION_DAYS% Tage
endlocal

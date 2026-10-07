@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo === NFC Club Access - lokal starten ===

where docker >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Docker wurde nicht gefunden. Bitte Docker Desktop installieren.
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Docker laeuft nicht. Bitte Docker Desktop starten.
  exit /b 1
)

set "NEW_ADMIN_PW="
if not exist ".env" (
  echo [INFO] .env mit Zufallswerten erzeugen...
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\init-env.ps1"`) do set "NEW_ADMIN_PW=%%P"
)

set "APP_PORT=3000"
if exist ".env" for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "if (Test-Path .env) { $m = Select-String -Path .env -Pattern '^APP_PORT=([0-9]+)$'; if ($m) { $m.Matches[0].Groups[1].Value } }"`) do set "APP_PORT=%%P"

echo [INFO] Container bauen und starten...
docker compose up -d --build
if errorlevel 1 (
  echo [FEHLER] docker compose up fehlgeschlagen.
  exit /b 1
)

echo [INFO] Warte auf http://localhost:%APP_PORT% ...
set /a tries=0
:waitloop
set /a tries+=1
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:%APP_PORT% -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto ready
if !tries! geq 60 (
  echo [WARN] App antwortet noch nicht. Logs: docker compose logs -f app
  goto seed
)
timeout /t 2 /nobreak >nul
goto waitloop

:ready
echo [OK] App laeuft.

:seed
where npm >nul 2>nul
if errorlevel 1 (
  echo [WARN] npm nicht gefunden - Seed uebersprungen.
  goto done
)
if not exist "node_modules" (
  echo [INFO] npm install ...
  call npm install
)
echo [INFO] Demo-Daten seeden (SEED_DEMO=1)...
call npx prisma db seed

:done
echo.
echo ============================================
echo  Scanner : http://localhost:%APP_PORT%
echo  Admin   : http://localhost:%APP_PORT%/admin/login
if defined NEW_ADMIN_PW (
  echo  Login   : admin@club.local
  echo  Passwort: !NEW_ADMIN_PW!
  echo  ^(Passwort steht auch in .env - bitte nach dem Login aendern^)
) else (
  echo  Login   : siehe ADMIN_EMAIL / ADMIN_PASSWORD in .env
)
echo  Demo    : DEMO-ACTIVE (gruen) / DEMO-BLOCKED (rot)
echo ============================================
echo  Stoppen : docker compose down
echo.
start "" http://localhost:%APP_PORT%
endlocal

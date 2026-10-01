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

if not exist ".env" (
  echo [INFO] .env aus .env.example anlegen
  copy /y ".env.example" ".env" >nul
)

echo [INFO] Container bauen und starten...
docker compose up -d --build
if errorlevel 1 (
  echo [FEHLER] docker compose up fehlgeschlagen.
  exit /b 1
)

echo [INFO] Warte auf http://localhost:3000 ...
set /a tries=0
:waitloop
set /a tries+=1
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:3000 -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
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
  echo [WARN] npm nicht gefunden - Seed uebersprungen. Admin/Demo-Karten fehlen ggf.
  goto done
)
if not exist "node_modules" (
  echo [INFO] npm install ...
  call npm install
)
echo [INFO] Migrationen anwenden und Demo-Daten seeden...
call npx prisma migrate deploy
call npx prisma db seed

:done
echo.
echo ============================================
echo  Scanner : http://localhost:3000
echo  Admin   : http://localhost:3000/admin/login
echo  Login   : admin@club.local / changeme
echo  Demo    : DEMO-ACTIVE (gruen) / DEMO-BLOCKED (rot)
echo ============================================
echo  Stoppen : docker compose down
echo.
start "" http://localhost:3000
endlocal

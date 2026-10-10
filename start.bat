@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo === NFC Club Access - lokal starten ===

REM --- Schritt 1/6: Voraussetzungen ---
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
echo [OK] Docker ist bereit.

set "NEW_ADMIN_PW="
set "ADMIN_EMAIL_VALUE=admin@club.local"
set "ADMIN_PASSWORD_SET=0"
set "SEED_DEMO_VALUE=0"
set "APP_PORT=3000"
set "LAN_IP="

if not exist ".env" (
  REM --- Schritt 2/6: Zugangsdaten und Optionen ---
  echo.
  echo === Schritt 2/6 - Zugangsdaten und Optionen ===
  set /p "ADMIN_EMAIL_VALUE=Admin-E-Mail [admin@club.local]: "
  if "!ADMIN_EMAIL_VALUE!"=="" set "ADMIN_EMAIL_VALUE=admin@club.local"

  for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$s=Read-Host -AsSecureString 'Admin-Passwort (leer = generieren)'; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))"`) do set "ADMIN_PASSWORD=%%P"
  if defined ADMIN_PASSWORD set "ADMIN_PASSWORD_SET=1"

  set /p "SEED_DEMO_ANSWER=Demo-Karten anlegen (j/n) [j]: "
  if /i "!SEED_DEMO_ANSWER!"=="n" ( set "SEED_DEMO_VALUE=0" ) else ( set "SEED_DEMO_VALUE=1" )

  set /p "APP_PORT_ANSWER=Host-Port [3000]: "
  if not "!APP_PORT_ANSWER!"=="" set "APP_PORT=!APP_PORT_ANSWER!"

  set "ADMIN_EMAIL=!ADMIN_EMAIL_VALUE!"
  set "SEED_DEMO=!SEED_DEMO_VALUE!"
  echo.
  echo === Schritt 3/6 - .env erzeugen ===
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\init-env.ps1"`) do set "NEW_ADMIN_PW=%%P"
) else (
  echo === Schritt 3/6 - .env vorhanden, wird verwendet ===
)

REM Werte aus .env lesen (falls vorhanden), sonst Defaults behalten.
if exist ".env" for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$m=Select-String -Path .env -Pattern '^APP_PORT=([0-9]+)$'; if ($m) { $m.Matches[0].Groups[1].Value }"`) do set "APP_PORT=%%P"
if exist ".env" for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$m=Select-String -Path .env -Pattern '^SEED_DEMO=([01])$'; if ($m) { $m.Matches[0].Groups[1].Value }"`) do set "SEED_DEMO_VALUE=%%P"
if exist ".env" for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$m=Select-String -Path .env -Pattern '^ADMIN_EMAIL=(.+)$'; if ($m) { $m.Matches[0].Groups[1].Value }"`) do set "ADMIN_EMAIL_VALUE=%%P"

REM --- Schritt 4/6: Bauen und starten ---
echo.
echo === Schritt 4/6 - Container bauen und starten ===
echo [INFO] Das kann beim ersten Mal einige Minuten dauern...
docker compose up -d --build
if errorlevel 1 (
  echo [FEHLER] docker compose up fehlgeschlagen. Logs: docker compose logs -f app
  exit /b 1
)
echo [OK] Container gestartet.

REM --- Schritt 5/6: Warten und verifizieren ---
echo.
echo === Schritt 5/6 - Warten und verifizieren ===
echo [INFO] Warte auf die App ^(http://localhost:!APP_PORT!^)...
set /a tries=0
:waitloop
set /a tries+=1
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:!APP_PORT!/api/v1/health' -TimeoutSec 3; if ($r.db -eq $true) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto ready
if !tries! geq 60 (
  echo [FEHLER] App antwortet nicht. Logs: docker compose logs -f app
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto waitloop
:ready
echo [OK] App antwortet.

if "!SEED_DEMO_VALUE!"=="1" (
  echo [INFO] Demo-Daten seeden...
  docker compose exec -T app node scripts/seed-demo.mjs
  if errorlevel 1 echo [WARN] Demo-Seed uebersprungen.
)

set "TEST_PW="
if defined ADMIN_PASSWORD set "TEST_PW=!ADMIN_PASSWORD!"
if not defined TEST_PW if defined NEW_ADMIN_PW set "TEST_PW=!NEW_ADMIN_PW!"
if defined TEST_PW (
  powershell -NoProfile -Command "$b = @{ email='!ADMIN_EMAIL_VALUE!'; password='!TEST_PW!' } | ConvertTo-Json; try { $r = Invoke-WebRequest -UseBasicParsing -Method POST -Uri 'http://localhost:!APP_PORT!/api/v1/sessions' -ContentType 'application/json' -Body $b -TimeoutSec 5; if ($r.StatusCode -eq 204) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if errorlevel 1 (echo [WARN] Login-Test fehlgeschlagen - Passwort in .env pruefen.) else (echo [OK] Admin-Login funktioniert.)
) else (
  echo [WARN] Login-Test uebersprungen ^(Passwort nicht bekannt^).
)

REM --- Schritt 6/6: Adressen und Zusammenfassung ---
echo.
echo === Schritt 6/6 - Fertig ===
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$ips=(Get-NetIPAddress -AddressFamily IPv4).Where({ $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' }).IPAddress; $ips[0]"`) do set "LAN_IP=%%P"

echo.
echo ============================================
echo  NFC Club Access ist bereit
echo ============================================
echo  Lokal        : http://localhost:!APP_PORT!
if defined LAN_IP echo  Im WLAN      : http://!LAN_IP!:!APP_PORT!
echo  Admin-Login  : http://localhost:!APP_PORT!/admin/login
if "!ADMIN_PASSWORD_SET!"=="1" (
  echo  Login        : !ADMIN_EMAIL_VALUE!  Passwort: selbst gesetzt
) else if defined NEW_ADMIN_PW (
  echo  Login        : !ADMIN_EMAIL_VALUE!
  echo  Passwort     : !NEW_ADMIN_PW!
  echo                 ^(steht auch in .env - bitte nach dem Login aendern^)
) else (
  echo  Login        : !ADMIN_EMAIL_VALUE!  Passwort: siehe .env
)
if "!SEED_DEMO_VALUE!"=="1" echo  Demo-Karten  : DEMO-ACTIVE ^(gruen^) / DEMO-BLOCKED ^(rot^)
echo  Stoppen      : docker compose down
echo ============================================
echo.
echo HINWEIS: Fuer NFC und Kamera ist HTTPS Pflicht ^(DSM Reverse Proxy^).
echo          Fuer den Test am PC reicht http://localhost.
echo.
start "" http://localhost:!APP_PORT!
endlocal

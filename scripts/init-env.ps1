param([string]$Path = ".env")

# Erzeugt .env mit Zufallswerten (Pendant zu scripts/init-env.sh).
# Entspricht den Umgebungsvariablen (falls gesetzt), sonst Zufall/Defaults:
#   ADMIN_EMAIL, ADMIN_PASSWORD, SEED_DEMO, APP_PORT, DB_BIND, DB_PORT,
#   POSTGRES_PASSWORD, SESSION_SECRET
# Gibt ein generiertes Admin-Passwort auf stdout aus (leer, wenn vorgegeben).

$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function New-B64Url([int]$length) {
  $bytes = New-Object byte[] $length
  $rng.GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

function Get-EnvOrDefault([string]$name, [string]$default) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrEmpty($v)) { return $default } else { return $v }
}

$adminEmail = Get-EnvOrDefault "ADMIN_EMAIL" "admin@club.local"
$seedDemo = Get-EnvOrDefault "SEED_DEMO" "0"
$appPort = Get-EnvOrDefault "APP_PORT" "3000"
$dbBind = Get-EnvOrDefault "DB_BIND" "127.0.0.1"
$dbPort = Get-EnvOrDefault "DB_PORT" "5432"

$sessionSecret = Get-EnvOrDefault "SESSION_SECRET" (New-B64Url 48)
$postgresPassword = Get-EnvOrDefault "POSTGRES_PASSWORD" (New-B64Url 24)

$generated = $false
$adminPassword = [Environment]::GetEnvironmentVariable("ADMIN_PASSWORD")
if ([string]::IsNullOrEmpty($adminPassword)) {
  $adminPassword = New-B64Url 18
  $generated = $true
}

$content = @"
DATABASE_URL=postgresql://nfc:$postgresPassword@localhost:$dbPort/nfc
DIRECT_URL=postgresql://nfc:$postgresPassword@localhost:$dbPort/nfc
SESSION_SECRET=$sessionSecret
ADMIN_EMAIL=$adminEmail
ADMIN_PASSWORD=$adminPassword
POSTGRES_PASSWORD=$postgresPassword
SEED_DEMO=$seedDemo
APP_PORT=$appPort
DB_BIND=$dbBind
DB_PORT=$dbPort
"@

Set-Content -LiteralPath $Path -Value $content -Encoding ASCII
if ($generated) { Write-Output $adminPassword }

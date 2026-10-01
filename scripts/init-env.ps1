param([string]$Path = ".env")

$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function New-B64Url([int]$length) {
  $bytes = New-Object byte[] $length
  $rng.GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

$sessionSecret = New-B64Url 48
$postgresPassword = New-B64Url 24
$adminPassword = New-B64Url 18

$content = @"
DATABASE_URL=postgresql://nfc:$postgresPassword@localhost:5432/nfc
SESSION_SECRET=$sessionSecret
ADMIN_EMAIL=admin@club.local
ADMIN_PASSWORD=$adminPassword
POSTGRES_PASSWORD=$postgresPassword
SEED_DEMO=1
"@

Set-Content -LiteralPath $Path -Value $content -Encoding ASCII
Write-Output $adminPassword

$ErrorActionPreference = "Stop"

$source = Join-Path (Split-Path -Parent $PSScriptRoot) "cloudflare\publico"
$public = Join-Path $PSScriptRoot "hosting-public"

if (-not (Test-Path -LiteralPath $source)) {
  throw "No se encontró el contenido web: $source"
}
if (Test-Path -LiteralPath $public) {
  throw "Ya existe $public; no se sobrescribirá. Revisa o renombra esa carpeta antes de desplegar."
}

New-Item -ItemType Directory -Path $public | Out-Null
try {
  Copy-Item -Path (Join-Path $source "*") -Destination $public -Recurse
  Push-Location $PSScriptRoot
  try {
    & firebase deploy --only hosting --project bexora-agenda-personal
    if ($LASTEXITCODE -ne 0) {
      throw "Firebase Hosting terminó con código $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
} finally {
  if (Test-Path -LiteralPath $public) {
    Remove-Item -LiteralPath $public -Recurse -Force
  }
}

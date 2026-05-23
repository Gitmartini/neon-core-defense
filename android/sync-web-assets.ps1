$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AssetRoot = Join-Path $PSScriptRoot "app\src\main\assets\www"

New-Item -ItemType Directory -Force -Path $AssetRoot | Out-Null

Copy-Item -LiteralPath (Join-Path $ProjectRoot "index.html") -Destination (Join-Path $AssetRoot "index.html") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "styles.css") -Destination (Join-Path $AssetRoot "styles.css") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "app.js") -Destination (Join-Path $AssetRoot "app.js") -Force

Write-Host "Android web assets synced."

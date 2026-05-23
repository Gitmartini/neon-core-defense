$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$AssetRoot = Join-Path $PSScriptRoot "app\src\main\assets\www"

New-Item -ItemType Directory -Force -Path $AssetRoot | Out-Null

Copy-Item -LiteralPath (Join-Path $ProjectRoot "index.html") -Destination (Join-Path $AssetRoot "index.html") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "styles.css") -Destination (Join-Path $AssetRoot "styles.css") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "app.js") -Destination (Join-Path $AssetRoot "app.js") -Force

$ShipAssetSource = Join-Path $ProjectRoot "assets\ships"
$ShipAssetDestination = Join-Path $AssetRoot "assets\ships"
$StationAssetSource = Join-Path $ProjectRoot "assets\station"
$StationAssetDestination = Join-Path $AssetRoot "assets\station"
$RuntimeAssetRoot = Join-Path $AssetRoot "assets"
if (Test-Path $RuntimeAssetRoot) {
  Remove-Item -LiteralPath $RuntimeAssetRoot -Recurse -Force
}
if (Test-Path $ShipAssetSource) {
  New-Item -ItemType Directory -Force -Path (Split-Path $ShipAssetDestination) | Out-Null
  Copy-Item -LiteralPath $ShipAssetSource -Destination $ShipAssetDestination -Recurse -Force
}
if (Test-Path $StationAssetSource) {
  New-Item -ItemType Directory -Force -Path (Split-Path $StationAssetDestination) | Out-Null
  Copy-Item -LiteralPath $StationAssetSource -Destination $StationAssetDestination -Recurse -Force
}

Write-Host "Android web assets synced."

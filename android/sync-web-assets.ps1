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
$SoundAssetSource = Join-Path $ProjectRoot "assets\sounds"
$SoundAssetDestination = Join-Path $AssetRoot "assets\sounds"
$RuntimeAssetRoot = Join-Path $AssetRoot "assets"
New-Item -ItemType Directory -Force -Path $RuntimeAssetRoot | Out-Null

function Sync-AssetFolder($Source, $Destination) {
  if (Test-Path $Source) {
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Copy-Item -Path (Join-Path $Source "*") -Destination $Destination -Recurse -Force
  }
}

Sync-AssetFolder $ShipAssetSource $ShipAssetDestination
Sync-AssetFolder $StationAssetSource $StationAssetDestination
Sync-AssetFolder $SoundAssetSource $SoundAssetDestination

Write-Host "Android web assets synced."

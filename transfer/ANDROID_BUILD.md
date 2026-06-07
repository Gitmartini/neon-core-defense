# Android Build Notes

## Current Shape

Neon Core Defense is packaged as an Android WebView app.

The Android project lives in:

`android/`

The web game is synced into:

`android/app/src/main/assets/www`

The debug APK output is:

`android/app/build/outputs/apk/debug/neoncore-debug.apk`

## Build Prerequisites

Required locally:

- Android Studio or Android SDK installed.
- Java JDK 21 currently used in this workspace.
- Gradle installed and on path, or invoked by configured local tooling.

Environment variables used in this workspace:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:USERPROFILE\tools\gradle-9.5.1\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

## Sync Web Assets

Before building Android, run:

```powershell
.\android\sync-web-assets.ps1
```

This copies current HTML, CSS, JS, images, and sounds into Android assets.

## Build Debug APK

```powershell
gradle -p android :app:assembleDebug
```

Expected output:

```text
android/app/build/outputs/apk/debug/neoncore-debug.apk
```

## App Identity

Neon Core should remain distinct from any visual variant/fork.

Current debug APK filename:

`neoncore-debug.apk`

If creating variants, use separate:

- application id
- app label
- APK filename
- branch or repo

## Install By Email Or File Transfer

For private testing:

1. Build `neoncore-debug.apk`.
2. Send/copy it to the phone.
3. Open the APK on Android.
4. Allow install from that source if Android asks.
5. Install and launch.

This is debug/private distribution only, not store publishing.

# Android Build

The `android/` folder is a native Android WebView wrapper for Neon Core Defense. It bundles the existing browser game as local assets, so the app does not need a network connection to play.

## Build with Android Studio

1. Open `android/` in Android Studio.
2. Let Android Studio sync the Gradle project.
3. Run the `app` configuration on an emulator or Android device.
4. To create an APK, use `Build > Build App Bundle(s) / APK(s) > Build APK(s)`.

## Command Line

If Java and the Android SDK are installed:

```powershell
cd android
gradle :app:assembleDebug
```

The debug APK will be created under:

```text
android/app/build/outputs/apk/debug/
```

## Updating Game Assets

After changing `index.html`, `styles.css`, or `app.js`, run:

```powershell
cd android
.\sync-web-assets.ps1
```

# Mobi Agent APK Project

This folder is separate from the main `backend` and `frontend` folders.

The Android app is a lightweight WebView wrapper for the deployed Mobi Agent web app:

```text
https://mobi-agent-web-1042212171158.us-central1.run.app
```

That deployed web app uses the online backend:

```text
https://mobi-agent-api-1042212171158.us-central1.run.app/api
```

## What This APK Does

- Opens the online Mobi Agent app inside an Android app.
- Uses the live Cloud Run backend through the deployed frontend.
- Keeps the mobile project separate from the existing backend and frontend projects.
- Requires internet access to work.

## Build APK In Android Studio

1. Install Android Studio.
2. Open Android Studio.
3. Choose **Open**.
4. Select this folder:

```text
mobile-apk
```

5. Let Android Studio sync Gradle.
6. Go to:

```text
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

7. Android Studio will show a link to the generated APK when the build finishes.

## Windows SDK Path

On this PC, the Android SDK was found at:

```text
C:\Users\HAVEN\AppData\Local\Android\Sdk
```

If Gradle says `SDK location not found`, create this file:

```text
mobile-apk/local.properties
```

With this content:

```text
sdk.dir=C:\\Users\\HAVEN\\AppData\\Local\\Android\\Sdk
```

`local.properties` is ignored by git because it is machine-specific.

## Build APK From Terminal

This requires Android SDK installed and configured.

From this folder:

```bash
gradle assembleDebug
```

The APK will be created at:

```text
mobile-apk/app/build/outputs/apk/debug/app-debug.apk
```

## Login

Use the same online accounts:

```text
Mobi Agent: agent@mobi.local / agent123
Admin: admin@mobi.local / admin123
```

## Notes

- This app depends on the deployed Cloud Run frontend and backend being online.
- If the Cloud Run URLs change, update `APP_URL` in `app/src/main/java/com/satesoft/mobiagent/MainActivity.java`.
- If you want a fully offline/native Android app later, that would be a separate implementation.
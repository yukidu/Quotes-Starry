# Web First / Capacitor-ready audit — 2026-10-13

## Scope

This change keeps the current Web app as the primary runtime and prepares only the platform boundaries already used today.

## Current platform boundaries

- Device/runtime detection: Web-only, initialized once.
- Device motion: delegated through `StarryPlatform.motion`.
- Image sharing: delegated through `StarryPlatform.share` using Web Share API with download fallback.
- File download: delegated through `StarryPlatform.files`.
- Runtime URLs/config: centralized in `app-config.js`.

## Intentionally not added

- Capacitor dependency or native projects.
- Firebase.
- Camera adapters, notification adapters, or login/native auth adapters because the current app does not use those features.
- Native initialization, polling, global state, or new event listeners at page startup.
- New service worker or manifest. The GitHub baseline contains no existing Service Worker/PWA manifest to preserve, so this audit does not invent one as part of the Capacitor-ready work.

## Performance guardrails

The static build script measures HTML, inline JS, inline CSS, and platform/config runtime bytes. It fails if platform/config runtime exceeds 6 KiB.

The production transform inlines the small platform/config runtime into the generated HTML so it creates zero additional first-party blocking requests.

## Backend

Cloudflare configuration and the shared Web backend model remain unchanged by this audit.

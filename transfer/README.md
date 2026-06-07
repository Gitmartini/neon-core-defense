# Neon Core Defense Transfer Package

This folder is a rebuild brief for recreating Neon Core Defense from scratch without needing to reverse-engineer the current codebase.

It includes:

- `GAME_DESIGN.md`: player fantasy, rules, screen flow, features, and UX expectations.
- `MECHANICS_AND_BALANCE.md`: enemies, upgrades, scoring, rewards, boss, Emergency Pulse, and tuning constants.
- `TECHNICAL_REBUILD.md`: architecture, loop structure, data model, rendering, audio, storage, and Android wrapper notes.
- `ASSET_STYLE_GUIDE.md`: visual style, sprite requirements, UI direction, and sample image manifest.
- `ANDROID_BUILD.md`: Android/WebView packaging notes and debug APK build expectations.
- `IMPLEMENTATION_CHECKLIST.md`: practical build order for recreating the game.
- `sample-images/`: reference sprites and screenshots.

The current project source lives at:

`D:\dev\neon-core-defense`

The active app is a single-screen landscape mobile game implemented as HTML/CSS/canvas JavaScript, packaged into Android with a WebView.

## Core Pitch

Neon Core Defense is a one-tower, auto-aim, auto-fire tower defense game. Enemy ships enter from the edges of the battlefield and attack the central space station core. The player survives by buying upgrades, choosing targeting behavior, repairing the core, and using Emergency Pulse at the right moment.

## Current Prototype Goals

- Fun toy first, commercial polish later.
- No ads, monetization, IAP, store logic, or meta-progression yet.
- Mobile landscape first.
- Runs should become interesting around waves 5-7.
- Wave 5 introduces the first boss: Shieldbreaker.
- The boss should feel dangerous and rewarding, not like a simple HP bag.

## Sample Images

Reference images are copied, not moved, into:

- `sample-images/sprites/`
- `sample-images/screenshots/`

Use these to match the current visual language: dark metallic sci-fi ships, neon accents, side-panel mobile UI, central torus station, and bright projectile effects.

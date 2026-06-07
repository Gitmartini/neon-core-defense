# Asset Style Guide

## Visual Identity

Neon Core Defense should look like a dark sci-fi arcade defense game:

- Deep black/blue space-grid arena.
- Cyan, magenta, lime, amber neon accents.
- Metallic, detailed ship sprites.
- Central mechanical torus station with glowing core.
- Bright projectiles and readable hit/explosion particles.
- Side panels should feel like sci-fi instrumentation, not a website dashboard.

## Sprite Requirements

General:

- Top-down orthographic view.
- Nose points to the right.
- Transparent PNG.
- Generous padding but no baked background.
- Readable at small sizes.
- Strong silhouette first, detail second.
- Avoid tiny text or markings.

Enemy orientation:

- Ships spawn from any edge and rotate toward the core.
- Source sprite should face right so rotation math is simple.

Recommended source dimensions:

- Small enemy source: 200-500 px wide.
- Large enemy source: 500-1500 px wide.
- In-game draw size is controlled by `spriteWidth`.

## Current In-Game Sprite Widths

- interceptor: `48`
- raider: `64`
- dreadnought: `96`
- artillery: `88`
- droneLeader: `58`
- bossShieldbreaker: `176`
- station: drawn separately
- station gun: drawn separately

## Current Sprite Manifest

Copied into `sample-images/sprites/`:

- `interceptor.png`: fast sleek ship.
- `raider.png`: basic medium ship.
- `dreadnought.png`: slow tank ship.
- `artillery.png`: ranged attacker.
- `drone-leader.png`: fast/mid threat.
- `boss-shieldbreaker.png`: first boss sprite.
- `boss-shieldbreaker-concept.png`: larger original boss concept.
- `station.png`: center torus station.
- `gun.png`: station gun/weapon module.

## UI Style

The UI should remain compact and readable on landscape phones.

Left panel:

- Core HP, Pulse, wave, credits, score, pause, SFX/help.

Right panel:

- Upgrade grid with icons and short labels.

Important:

- Avoid clipped upgrade labels.
- Do not let cost text fall below card boundaries.
- Use icons heavily.
- Keep text high contrast.
- Reward/toast text should appear above the station and fade after a few seconds.

## Screenshots

Copied into `sample-images/screenshots/`:

- `screenshot-phone-preview.png`: current constrained mobile layout.
- `screenshot-pulse-test.png`: Emergency Pulse reference.
- `screenshot-run-report.png`: post-run screen.
- `screenshot-upgraded.png`: upgraded gameplay reference.

## Boss Art Notes

Shieldbreaker should read as:

- Large battleship-like ship.
- Dark gunmetal hull.
- Cyan/magenta engine and weapon glow.
- Large spinal gun.
- Slow, dangerous, valuable target.

The boss should feel like a wave milestone, not just a bigger normal ship.

## Sound Direction

The current sound direction moved away from "MIDI toy" effects toward:

- shorter tower fire
- laser/kinetic zap
- small explosive ship destruction
- bigger core destruction
- satisfying pulse sound

Keep common sounds short because tower fire repeats frequently.

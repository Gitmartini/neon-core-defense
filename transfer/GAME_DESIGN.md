# Game Design

## Title

Neon Core Defense

## Genre

Single-tower tower defense, mobile landscape, arcade survival.

## Player Fantasy

The player commands a central neon space station under siege. The tower aims and fires automatically, while the player makes strategic upgrade, repair, targeting, and Emergency Pulse decisions under escalating pressure.

## Core Loop

1. Enemies spawn from the battlefield edges.
2. The central tower auto-aims and auto-fires.
3. Enemies either die, shoot from range, or collide with the core.
4. Destroyed enemies award credits and score.
5. The player spends credits on upgrades or repairs.
6. Waves escalate in enemy count, durability, armor, and variety.
7. Emergency Pulse charges over time and from kills, then clears/damages enemies near the core.
8. The run ends when core HP reaches zero.
9. A post-run report shows wave reached, kills, favorite upgrade, pulses used, score, and new best status.

## Controls

The game is intentionally low-input:

- Tower firing is automatic.
- Tower aiming is automatic.
- Player taps upgrades.
- Player taps Patch Core for instant repair.
- Player taps Emergency Pulse when charged.
- Player can pause.
- Player can mute SFX.
- Player can open the help overlay.
- Target AI unlocks a Focus/Split firing toggle.

## Screen Layout

Mobile landscape only.

Left side:

- SFX and help controls
- Core HP
- Emergency Pulse
- Wave
- Credits
- Score
- Pause

Center:

- Battlefield
- Central station/core
- Range circle
- Enemies, projectiles, particles, pulse wave, reward toast

Right side:

- Upgrade grid:
  - Damage | Fire Rate
  - Range | Piercing
  - Repair Rate | Core HP
  - Add Gun | Patch Core
  - Target AI full-width

## First-Run Help Overlay

The help overlay appears at first game start unless dismissed with "Don't show again". It explains:

- Survive waves.
- Earn credits.
- Buy upgrades.
- Emergency Pulse.
- Boss/armor/piercing basics if expanded in the future.

Retry after death should skip the first-run overlay.

## Post-Run Screen

After death, show more than score:

- Wave reached
- Enemies destroyed
- Favorite/most-used upgrade
- Emergency pulses fired
- New Best if applicable
- Retry button

## Current Milestone

Wave 5 introduces the first boss, Shieldbreaker. This should be a clear milestone:

- The ship is visually larger.
- The wave is less crowded than it otherwise would be.
- Killing the boss gives a noticeable credit and score reward.
- Emergency Pulse helps but does not erase the boss.

## Intended Difficulty Feel

Approximate target:

- First-time player: dies around wave 5-7.
- Player who understands upgrades: reaches wave 9-12.
- Good player using Emergency Pulse well: reaches wave 13-18.
- Exceptional/lucky runs: may pass wave 20.

These are tuning goals, not strict rules.

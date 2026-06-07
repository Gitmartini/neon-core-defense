# Implementation Checklist

Use this order if rebuilding Neon Core Defense from scratch.

## Phase 1: Playable Core

- Create a landscape-only HTML/CSS/canvas shell.
- Add center battlefield canvas.
- Add left status panel and right upgrade panel.
- Create game state.
- Implement resize with device pixel ratio.
- Draw arena grid and center station.
- Spawn one basic enemy from random edges.
- Move enemy toward core.
- Damage core on collision.
- End game at zero core HP.

## Phase 2: Tower Combat

- Add tower auto-targeting.
- Add tower auto-fire cooldown.
- Add projectile creation.
- Add projectile movement and collision.
- Add enemy HP.
- Add enemy death particles.
- Award credits and score on kill.
- Show health bars only after damage.

## Phase 3: Waves And Economy

- Add wave number.
- Add spawn budget and spawn timer.
- Advance wave when budget is empty and enemies are gone.
- Add wave completion credit reward.
- Add floating wave reward toast.
- Add scoring formula based on value, HP, and wave.

## Phase 4: Upgrade System

- Add Damage.
- Add Fire Rate.
- Add Range.
- Add Core HP.
- Add Repair Rate.
- Add Patch Core.
- Add Add Gun.
- Add Piercing.
- Add Target AI unlock and Focus/Split toggle.
- Track most-used upgrade for run report.

## Phase 5: Enemy Variety

- Add interceptor.
- Add raider.
- Add dreadnought.
- Add artillery with ranged shot behavior.
- Add drone leader.
- Add armor and piercing interactions.
- Tune enemy scaling.

## Phase 6: Emergency Pulse

- Add Pulse charge meter.
- Charge Pulse from kills.
- Activate only when full.
- Use tower range as Pulse radius.
- Clear enemy projectiles in range.
- Damage enemies with falloff.
- Add boss resistance via `pulseMultiplier`.
- Add flash, shake, particles, and sound.

## Phase 7: Boss Milestone

- Add `bossShieldbreaker`.
- Spawn exactly one on wave 5.
- Reduce normal wave-5 spawn pressure.
- Use dedicated boss sprite.
- Add larger boss health bar.
- Use boss score formula.
- Award meaningful boss credits.

## Phase 8: UX Polish

- Add first-run help overlay.
- Add "Don't show again".
- Add `?` help button.
- Add pause.
- Add SFX mute.
- Add post-run report.
- Add local best score.
- Add reward toast.

## Phase 9: Android Packaging

- Create Android WebView wrapper.
- Sync web assets into Android.
- Configure app label and package id.
- Configure debug APK filename.
- Build and test on phone.

## Phase 10: Tuning Passes

- Test wave 1-5 onboarding.
- Test wave 5 boss difficulty.
- Test Pulse charge frequency.
- Test Add Gun power.
- Test Piercing usefulness.
- Test upgrade costs.
- Test whether first-time players die around wave 5-7.
- Keep tuning numbers centralized.

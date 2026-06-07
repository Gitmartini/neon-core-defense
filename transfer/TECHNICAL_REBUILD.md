# Technical Rebuild

## Platform Shape

The current game is a browser game packaged into Android:

- `index.html`: UI shell and canvas.
- `styles.css`: responsive mobile landscape layout and side panels.
- `app.js`: all gameplay, rendering, audio, state, upgrades, spawning, scoring, and run report logic.
- `assets/`: ship/station sprites and sound files.
- `android/`: native Android wrapper using WebView.

No server is required.

## Runtime Model

Use a single canvas for the battlefield and DOM buttons/panels for UI.

Recommended structure:

```text
initialize DOM references
define state
define colors and balance constants
load sprites
load sound pools
define enemy and upgrade data
start requestAnimationFrame loop
```

Main loop:

```js
function loop(now) {
  const dt = Math.min(0.033, (now - state.last) / 1000 || 0);
  state.last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
```

Clamp `dt` to avoid huge jumps after pauses or tab switches.

## State Model

Important state groups:

- Game flow: `running`, `paused`, `gameOver`, `time`, `last`
- Core: `health`, `maxHealth`, `repairRate`
- Progress: `wave`, `score`, `credits`
- Entities: `enemies`, `projectiles`, `enemyProjectiles`, `particles`, `floatingTexts`
- Pulse: `pulseCharge`, `pulseMax`, `pulseWave`, `pulseFlash`
- Spawning: `spawnTimer`, `spawnBudget`, `interceptorBudget`, `bossSpawnedThisWave`
- Run report: `runStats`
- Tower: `damage`, `piercing`, `fireDelay`, `range`, `split`, `targetMode`, gun angles

## Entity Update Order

Recommended update order:

1. Skip if not running or paused.
2. Advance time and visual timers.
3. Cool tower.
4. Regenerate core HP by repair rate.
5. Spawn enemies if budget remains.
6. Aim and fire tower if target exists.
7. Update enemies.
8. Update player projectiles.
9. Update enemy projectiles.
10. Update particles and floating text.
11. Update UI.

## Targeting

Tower targeting should prioritize meaningful threats:

- Enemies in range.
- Bosses and enemies closer to core matter.
- Artillery should remain dangerous because it can attack from range.

Gun targeting:

- Focus mode: all guns use the same target.
- Split mode: guns may select separate targets.

Predictive aiming should calculate a future intercept point so multiple guns do not fire around a moving target.

## Rendering Order

Recommended draw order:

1. Clear canvas.
2. Apply screen shake.
3. Arena/grid/background.
4. Range circle.
5. Pulse wave.
6. Enemies.
7. Player projectiles.
8. Enemy projectiles.
9. Tower/station.
10. Particles.
11. Floating reward text.
12. Restore transform.
13. Full-screen pulse flash.

## Canvas Responsiveness

The game is mobile landscape first.

Important rules:

- Body should not scroll.
- UI should fit in landscape on modern phones.
- Canvas uses device pixel ratio for sharpness.
- Side panels stay visible.
- Battlefield occupies the center column.

## Audio

Use pooled `Audio` objects to avoid clipping or delayed rapid fire.

Current SFX categories:

- towerFire
- enemyHit
- enemyDestroyed
- coreDamaged
- emergencyPulse
- upgradePurchase
- waveStart
- pauseToggle
- gameOver

Implement:

- mute button persisted in localStorage.
- audio unlock on first user interaction.
- cooldown per sound type to avoid sonic mush.

## Local Storage

Current persisted keys:

- best score
- briefing hidden preference
- sound muted preference

Do not add monetization, accounts, analytics, or store logic yet.

## Android Wrapper

The Android app wraps local web assets in a WebView.

The sync script copies web files and assets into:

`android/app/src/main/assets/www`

The debug APK is built at:

`android/app/build/outputs/apk/debug/neoncore-debug.apk`

## Known Technical Preferences

- Keep mechanics data-driven.
- Keep balance constants centralized.
- Prefer visible player feedback for rewards and major events.
- Avoid broad refactors while tuning.
- Use existing sprite/audio pipeline until the game direction is stable.

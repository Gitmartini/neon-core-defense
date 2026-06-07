# Mechanics And Balance

## Central Balance Object

Current tuning should live in a centralized balance object so numbers can be adjusted without hunting through gameplay logic.

```js
const balance = {
  score: {
    valueMultiplier: 10,
    hpMultiplier: 0.6,
    waveBonus: 12,
    bossValueMultiplier: 25,
    bossHpMultiplier: 1.2,
    bossWaveBonus: 60
  },
  economy: {
    waveBaseCredits: 12,
    waveCreditScale: 2
  },
  pulse: {
    baseDamage: 85,
    bossMultiplier: 0.2
  },
  bosses: {
    firstBossWave: 5,
    firstBossSpawnRelief: 9
  },
  feedback: {
    waveRewardTextLife: 2.4
  }
};
```

## Player Starting State

- Core HP: `100`
- Starting credits: `70`
- Repair rate: `0.6`
- Tower damage: `16`
- Tower fire delay: `0.42`
- Tower range: `245`
- Starting guns: `1`
- Target mode: `focus`
- Pulse charge max: `100`

## Enemy Types

Normal enemies:

- `interceptor`
  - Fast, low HP, no armor.
  - Adds pressure and forces tracking accuracy.
- `raider`
  - Basic medium enemy.
  - Light armor.
- `dreadnought`
  - Slow, tough, armored.
  - Punishes low piercing/damage builds.
- `artillery`
  - Stops at range and fires at the core.
  - Forces player to avoid tunneling on nearby tanks.
- `droneLeader`
  - Faster mid-tier threat.

Boss:

- `bossShieldbreaker`
  - First appears on wave 5.
  - Slow, tough, moderate armor.
  - Big core damage if it reaches the core.
  - No ranged attack yet.
  - Uses `assets/ships/boss-shieldbreaker.png`.

Current boss starter values:

```js
bossShieldbreaker: {
  radius: 30,
  hp: 750,
  hpScale: 120,
  armor: 10,
  speed: 22,
  speedScale: 1.2,
  value: 110,
  damage: 32,
  spriteWidth: 176,
  isBoss: true,
  pulseMultiplier: balance.pulse.bossMultiplier
}
```

The first boss uses wave-relative boss scaling, so on wave 5 it starts at the listed `750` HP rather than inheriting four waves of normal scaling.

## Enemy Scaling

Normal enemies scale by wave:

- HP: `(baseHp + waveBoost * hpScale) * (1 + waveBoost * 0.06)`
- Speed: `baseSpeed + waveBoost * speedScale`
- Damage: `baseDamage + floor(waveBoost * 0.55)`
- Armor: `baseArmor + floor(waveBoost / 4)`, except interceptors do not gain armor.
- Artillery shot damage: `baseShotDamage + floor(waveBoost * 0.45)`

Where:

```js
waveBoost = state.wave - 1
```

Boss scaling uses:

```js
waveBoost = Math.max(0, state.wave - balance.bosses.firstBossWave)
```

## Spawning

Each wave starts with:

```js
interceptorBudget = wave * 2
spawnBudget = 10 + wave * 4 + interceptorBudget
```

Interceptors are guaranteed by budget pressure and also mixed in randomly after wave 2.

On wave 5:

- Spawn exactly one Shieldbreaker.
- Set `bossSpawnedThisWave = true`.
- Reduce remaining normal spawn budget by `balance.bosses.firstBossSpawnRelief`.
- Current relief: `9`.

## Scoring

Normal enemy score:

```js
score += Math.round(
  enemy.value * balance.score.valueMultiplier +
  enemy.maxHp * balance.score.hpMultiplier +
  state.wave * balance.score.waveBonus
);
```

Boss score:

```js
score += Math.round(
  enemy.value * balance.score.bossValueMultiplier +
  enemy.maxHp * balance.score.bossHpMultiplier +
  state.wave * balance.score.bossWaveBonus
);
```

Credits:

```js
credits += enemy.value;
```

Boss credits are currently `110`.

## Wave Completion Rewards

On transition to the next wave:

```js
waveCredits = balance.economy.waveBaseCredits +
  state.wave * balance.economy.waveCreditScale;
credits += waveCredits;
```

The game displays a floating toast above the station:

```text
Wave 4 clear  +22 credits
```

The toast is intentionally large and celebratory.

## Emergency Pulse

Pulse radius equals current turret range.

Effects:

- Clears enemy projectiles in range.
- Damages enemies in range with falloff.
- Pushes enemies outward slightly.
- Creates screen flash, shake, particles, and sound.

Damage:

```js
const multiplier = enemy.pulseMultiplier ?? 1;
const damage = balance.pulse.baseDamage *
  multiplier *
  (0.58 + Math.max(0, falloff) * 0.42);
```

Normal enemies default to `pulseMultiplier = 1`.

Bosses use `pulseMultiplier = 0.2`, so Pulse helps but does not erase them.

## Upgrades

Core upgrade set:

- Damage
- Fire Rate
- Range
- Piercing
- Repair Rate
- Core HP
- Add Gun
- Patch Core
- Target AI

Design notes:

- Add Gun is powerful because each gun increases total shots per second.
- Target AI unlocks Focus/Split mode.
- Focus: all guns fire at the priority target.
- Split: guns can pick separate targets.
- Piercing counters armor.
- Patch Core is an immediate heal purchase.

## Tuning Philosophy

Prefer small, visible tuning moves:

- Reduce crowd pressure before gutting boss HP.
- Make rewards visible before increasing them.
- Keep boss resistant to Pulse, but not immune.
- Use centralized constants whenever a number may be tuned again.

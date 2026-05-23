const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  healthBar: document.getElementById("healthBar"),
  pulseButton: document.getElementById("pulseButton"),
  pulseCharge: document.getElementById("pulseCharge"),
  pulseFill: document.getElementById("pulseFill"),
  wave: document.getElementById("wave"),
  credits: document.getElementById("credits"),
  score: document.getElementById("score"),
  overlay: document.getElementById("overlay"),
  overlayMessage: document.getElementById("overlayMessage"),
  runReport: document.getElementById("runReport"),
  startButton: document.getElementById("startButton"),
  pauseButton: document.getElementById("pauseButton"),
  damageLevel: document.getElementById("damageLevel"),
  rateLevel: document.getElementById("rateLevel"),
  rangeLevel: document.getElementById("rangeLevel"),
  splitLevel: document.getElementById("splitLevel"),
  hullLevel: document.getElementById("hullLevel"),
  repairLevel: document.getElementById("repairLevel"),
  patchLevel: document.getElementById("patchLevel"),
  damageCost: document.getElementById("damageCost"),
  rateCost: document.getElementById("rateCost"),
  rangeCost: document.getElementById("rangeCost"),
  splitCost: document.getElementById("splitCost"),
  hullCost: document.getElementById("hullCost"),
  repairCost: document.getElementById("repairCost"),
  patchCost: document.getElementById("patchCost"),
  upgrades: [...document.querySelectorAll(".upgrade")]
};

const state = {
  running: false,
  gameOver: false,
  paused: false,
  width: canvas.width,
  height: canvas.height,
  time: 0,
  last: 0,
  shake: 0,
  health: 100,
  maxHealth: 100,
  repairRate: 0.6,
  wave: 1,
  score: 0,
  credits: 70,
  enemies: [],
  projectiles: [],
  enemyProjectiles: [],
  particles: [],
  pulseCharge: 0,
  pulseMax: 100,
  pulseDamage: 85,
  pulseWave: null,
  pulseFlash: 0,
  runStats: null,
  spawnTimer: 0,
  spawnBudget: 0,
  waveBreak: 1.5,
  upgrades: {
    damage: { level: 1, cost: 40 },
    rate: { level: 1, cost: 50 },
    range: { level: 1, cost: 45 },
    split: { level: 1, cost: 90 },
    hull: { level: 1, cost: 65 },
    repair: { level: 1, cost: 55 },
    patch: { level: "+", cost: 35 }
  },
  tower: {
    angle: 0,
    gunAngles: [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5],
    gunBases: [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5],
    cooldown: 0,
    damage: 16,
    fireDelay: 0.42,
    range: 245,
    split: 1
  }
};

const colors = {
  cyan: "#6ff7ff",
  lime: "#a8ff6f",
  pink: "#ff5fc7",
  amber: "#ffd36a",
  violet: "#b28cff",
  orange: "#ff9f43",
  red: "#ff596f",
  dark: "#05080d"
};

const upgradeLabels = {
  damage: "Damage",
  rate: "Fire Rate",
  range: "Range",
  split: "Add Gun",
  hull: "Core HP",
  repair: "Repair Rate",
  patch: "Patch Core"
};

const bestScoreKey = "neonCoreDefense.bestScore";

const enemySpriteSources = {
  interceptor: "assets/ships/interceptor.png",
  raider: "assets/ships/raider.png",
  dreadnought: "assets/ships/dreadnought.png",
  artillery: "assets/ships/artillery.png",
  droneLeader: "assets/ships/drone-leader.png"
};

const enemySpriteImages = {};
for (const [name, src] of Object.entries(enemySpriteSources)) {
  const image = new Image();
  image.src = src;
  enemySpriteImages[name] = image;
}

const stationSpriteSources = {
  base: "assets/station/station.png",
  gun: "assets/station/gun.png"
};

const stationSpriteImages = {};
for (const [name, src] of Object.entries(stationSpriteSources)) {
  const image = new Image();
  image.src = src;
  stationSpriteImages[name] = image;
}

const soundSources = {
  towerFire: "assets/sounds/tower-fire.wav",
  enemyHit: "assets/sounds/enemy-hit.wav",
  enemyDestroyed: "assets/sounds/enemy-destroyed.wav",
  coreDamaged: "assets/sounds/core-damaged.wav",
  emergencyPulse: "assets/sounds/emergency-pulse.wav",
  upgradePurchase: "assets/sounds/upgrade-purchase.wav",
  waveStart: "assets/sounds/wave-start.wav",
  pauseToggle: "assets/sounds/pause-toggle.wav",
  gameOver: "assets/sounds/game-over.wav"
};

const soundPools = {};
const soundLastPlayed = {};
let audioUnlocked = false;

for (const [name, src] of Object.entries(soundSources)) {
  const count = name === "towerFire" ? 8 : name === "enemyHit" ? 5 : 3;
  soundPools[name] = {
    cursor: 0,
    items: Array.from({ length: count }, () => {
      const audio = new Audio(src);
      audio.preload = "auto";
      return audio;
    })
  };
}

const enemyTypes = {
  interceptor: {
    radius: 10,
    hp: 25,
    hpScale: 5,
    speed: 104,
    speedScale: 5,
    value: 12,
    damage: 6,
    color: colors.pink,
    accent: colors.cyan,
    shape: "needle",
    sprite: "interceptor",
    spriteWidth: 48
  },
  raider: {
    radius: 13,
    hp: 43,
    hpScale: 8,
    speed: 58,
    speedScale: 3,
    value: 16,
    damage: 9,
    color: colors.cyan,
    accent: colors.lime,
    shape: "saucer",
    sprite: "raider",
    spriteWidth: 64
  },
  dreadnought: {
    radius: 20,
    hp: 92,
    hpScale: 15,
    speed: 31,
    speedScale: 2,
    value: 29,
    damage: 16,
    color: colors.amber,
    accent: colors.orange,
    shape: "barge",
    sprite: "dreadnought",
    spriteWidth: 96
  },
  artillery: {
    radius: 16,
    hp: 58,
    hpScale: 10,
    speed: 45,
    speedScale: 2.5,
    value: 24,
    damage: 0,
    color: colors.violet,
    accent: colors.pink,
    shape: "frigate",
    sprite: "artillery",
    spriteWidth: 88,
    stopRange: 285,
    fireDelay: 2.1,
    shotDamage: 7
  },
  droneLeader: {
    radius: 12,
    hp: 36,
    hpScale: 7,
    speed: 76,
    speedScale: 4,
    value: 18,
    damage: 8,
    color: colors.red,
    accent: colors.orange,
    shape: "needle",
    sprite: "droneLeader",
    spriteWidth: 58
  }
};

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * dpr));
  canvas.height = Math.max(420, Math.floor(rect.height * dpr));
  state.width = canvas.width;
  state.height = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function resetGame() {
  state.running = true;
  state.gameOver = false;
  state.paused = false;
  state.time = 0;
  state.last = performance.now();
  state.shake = 0;
  state.health = state.maxHealth;
  state.wave = 1;
  state.score = 0;
  state.credits = 70;
  state.enemies = [];
  state.projectiles = [];
  state.enemyProjectiles = [];
  state.particles = [];
  state.pulseCharge = 0;
  state.pulseWave = null;
  state.pulseFlash = 0;
  state.runStats = {
    enemiesDestroyed: 0,
    pulsesFired: 0,
    upgradesBought: Object.fromEntries(Object.keys(state.upgrades).map((kind) => [kind, 0])),
    lastUpgrade: null
  };
  state.spawnBudget = 10;
  state.spawnTimer = 0.2;
  state.waveBreak = 1.5;
  state.upgrades.damage = { level: 1, cost: 40 };
  state.upgrades.rate = { level: 1, cost: 50 };
  state.upgrades.range = { level: 1, cost: 45 };
  state.upgrades.split = { level: 1, cost: 90 };
  state.upgrades.hull = { level: 1, cost: 65 };
  state.upgrades.repair = { level: 1, cost: 55 };
  state.upgrades.patch = { level: "+", cost: 35 };
  state.maxHealth = 100;
  state.health = state.maxHealth;
  state.repairRate = 0.6;
  state.tower.gunAngles = [...state.tower.gunBases];
  state.tower.damage = 16;
  state.tower.fireDelay = 0.42;
  state.tower.range = 245;
  state.tower.split = 1;
  ui.overlay.classList.add("hidden");
  ui.runReport.classList.add("hidden");
  playSound("waveStart", { volume: 0.42, cooldown: 500 });
  updateUi();
}

function center() {
  return { x: state.width / 2, y: state.height / 2 };
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  const padding = 38;
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = rand(0, state.width);
    y = -padding;
  } else if (side === 1) {
    x = state.width + padding;
    y = rand(0, state.height);
  } else if (side === 2) {
    x = rand(0, state.width);
    y = state.height + padding;
  } else {
    x = -padding;
    y = rand(0, state.height);
  }

  const waveBoost = state.wave - 1;
  const type = chooseEnemyType();
  const template = enemyTypes[type];
  const hp = template.hp + waveBoost * template.hpScale;
  const speed = template.speed + waveBoost * template.speedScale;
  const angleToCore = Math.atan2(state.height / 2 - y, state.width / 2 - x);

  state.enemies.push({
    x,
    y,
    type,
    shape: template.shape,
    radius: template.radius,
    hp,
    maxHp: hp,
    speed,
    value: template.value,
    damage: template.damage,
    color: template.color,
    accent: template.accent,
    sprite: template.sprite,
    spriteWidth: template.spriteWidth,
    angle: angleToCore,
    spin: rand(0, Math.PI * 2),
    strafe: rand(-1, 1),
    cooldown: rand(0.5, 1.8),
    stopRange: template.stopRange || 0,
    fireDelay: template.fireDelay || 0,
    shotDamage: template.shotDamage || 0
  });
}

function chooseEnemyType() {
  const roll = Math.random();
  if (state.wave > 4 && roll > 0.82) return "artillery";
  if (state.wave > 3 && roll > 0.64) return "dreadnought";
  if (state.wave > 2 && roll > 0.44 && roll < 0.58) return "droneLeader";
  if (state.wave > 2 && roll < 0.22) return "interceptor";
  return "raider";
}

function nextWave() {
  state.wave += 1;
  state.spawnBudget = 8 + state.wave * 3;
  state.spawnTimer = 0.4;
  state.waveBreak = 1.4;
  state.credits += 18 + state.wave * 3;
  playSound("waveStart", { volume: 0.42, cooldown: 500 });
  burst(center().x, center().y, colors.lime, 22);
}

function addPulseCharge(amount) {
  if (!state.running || state.gameOver) return;
  state.pulseCharge = Math.min(state.pulseMax, state.pulseCharge + amount);
}

function recordEnemyDestroyed(enemy, options = {}) {
  state.score += Math.round(enemy.value * 10 + state.wave * 8);
  state.credits += enemy.value;
  if (state.runStats) state.runStats.enemiesDestroyed += 1;
  if (options.chargePulse !== false) addPulseCharge(enemy.value * 0.85);
}

function findTarget() {
  const c = center();
  let best = null;
  let bestDist = Infinity;
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - c.x, enemy.y - c.y);
    if (dist < state.tower.range && dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function fireAt(target) {
  const c = center();
  const baseAngle = Math.atan2(target.y - c.y, target.x - c.x);
  const shots = activeGunCount();

  for (let i = 0; i < shots; i += 1) {
    const muzzle = gunMuzzlePoint(i);
    const angle = Math.atan2(target.y - muzzle.y, target.x - muzzle.x);
    state.projectiles.push({
      x: muzzle.x,
      y: muzzle.y,
      vx: Math.cos(angle) * 720,
      vy: Math.sin(angle) * 720,
      damage: state.tower.damage,
      life: 0.75,
      radius: 4.5,
      color: i % 2 ? colors.pink : colors.lime
    });
  }

  state.tower.angle = baseAngle;
  state.tower.cooldown = state.tower.fireDelay;
  const firstMuzzle = gunMuzzlePoint(0);
  burst(firstMuzzle.x, firstMuzzle.y, colors.cyan, 5);
  playSound("towerFire", { volume: 0.32, rate: rand(0.94, 1.06), cooldown: 35 });
}

function angleDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function activeGunCount() {
  return Math.min(state.tower.split, state.tower.gunBases.length);
}

function gunMuzzlePoint(index) {
  const c = center();
  const mountAngle = state.tower.gunBases[index];
  const aimAngle = state.tower.gunAngles[index];
  return {
    x: c.x + Math.cos(mountAngle) * 88 + Math.cos(aimAngle) * 38,
    y: c.y + Math.sin(mountAngle) * 88 + Math.sin(aimAngle) * 38
  };
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  for (const pool of Object.values(soundPools)) {
    const audio = pool.items[pool.items.length - 1];
    audio.muted = true;
    audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  }
}

function playSound(name, options = {}) {
  if (!audioUnlocked) return;

  const pool = soundPools[name];
  if (!pool) return;

  const now = performance.now();
  const cooldown = options.cooldown ?? 0;
  if (cooldown && now - (soundLastPlayed[name] || 0) < cooldown) return;
  soundLastPlayed[name] = now;

  const audio = pool.items[pool.cursor];
  pool.cursor = (pool.cursor + 1) % pool.items.length;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = options.volume ?? 0.55;
  audio.playbackRate = options.rate ?? 1;
  audio.play().catch(() => {});
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(40, 220);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: rand(1.5, 4.5),
      color,
      life: rand(0.25, 0.7),
      maxLife: 0.7
    });
  }
}

function update(dt) {
  if (!state.running || state.paused) return;

  state.time += dt;
  state.shake = Math.max(0, state.shake - dt * 22);
  state.pulseFlash = Math.max(0, state.pulseFlash - dt * 2.8);
  if (state.pulseWave) {
    state.pulseWave.life -= dt;
    if (state.pulseWave.life <= 0) state.pulseWave = null;
  }
  state.tower.cooldown = Math.max(0, state.tower.cooldown - dt);
  state.health = Math.min(state.maxHealth, state.health + state.repairRate * dt);

  if (state.spawnBudget > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy();
      state.spawnBudget -= 1;
      state.spawnTimer = Math.max(0.18, 0.92 - state.wave * 0.035);
    }
  } else if (state.enemies.length === 0) {
    state.waveBreak -= dt;
    if (state.waveBreak <= 0) nextWave();
  }

  const target = findTarget();
  if (target) {
    state.tower.angle = Math.atan2(target.y - center().y, target.x - center().x);
    if (state.tower.cooldown <= 0) fireAt(target);
  }

  updateEnemies(dt);
  updateProjectiles(dt);
  updateEnemyProjectiles(dt);
  updateParticles(dt);
  updateUi();
}

function updateEnemies(dt) {
  const c = center();
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const dist = Math.hypot(enemy.x - c.x, enemy.y - c.y);
    const angle = Math.atan2(c.y - enemy.y, c.x - enemy.x);
    enemy.angle = angle;
    enemy.spin += dt * (enemy.type === "dreadnought" ? 1.3 : 3.2);
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);

    if (enemy.type === "artillery" && dist <= enemy.stopRange) {
      const tangent = angle + Math.PI / 2;
      enemy.x += Math.cos(tangent) * enemy.speed * 0.26 * enemy.strafe * dt;
      enemy.y += Math.sin(tangent) * enemy.speed * 0.26 * enemy.strafe * dt;
      if (enemy.cooldown <= 0) fireEnemyBolt(enemy);
    } else {
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;
    }

    if (Math.hypot(enemy.x - c.x, enemy.y - c.y) < enemy.radius + 34) {
      state.health = Math.max(0, state.health - enemy.damage);
      state.shake = 9;
      playSound("coreDamaged", { volume: 0.62, cooldown: 180 });
      burst(enemy.x, enemy.y, colors.red, 20);
      state.enemies.splice(i, 1);
      if (state.health <= 0) endGame();
    }
  }
}

function fireEnemyBolt(enemy) {
  const c = center();
  const angle = Math.atan2(c.y - enemy.y, c.x - enemy.x);
  enemy.cooldown = enemy.fireDelay;
  state.enemyProjectiles.push({
    x: enemy.x + Math.cos(angle) * enemy.radius,
    y: enemy.y + Math.sin(angle) * enemy.radius,
    vx: Math.cos(angle) * 235,
    vy: Math.sin(angle) * 235,
    damage: enemy.shotDamage,
    life: 2.2,
    radius: 5,
    color: enemy.accent
  });
  burst(enemy.x + Math.cos(angle) * enemy.radius, enemy.y + Math.sin(angle) * enemy.radius, enemy.accent, 5);
}

function activateEmergencyPulse() {
  if (!state.running || state.paused || state.gameOver || state.pulseCharge < state.pulseMax) return;

  const c = center();
  const pulseRadius = state.tower.range;
  state.pulseCharge = 0;
  state.pulseWave = {
    life: 0.55,
    maxLife: 0.55,
    radius: pulseRadius
  };
  state.pulseFlash = 1;
  state.shake = 18;
  if (state.runStats) state.runStats.pulsesFired += 1;
  playSound("emergencyPulse", { volume: 0.78, cooldown: 500 });
  burst(c.x, c.y, colors.cyan, 42);
  burst(c.x, c.y, colors.pink, 28);

  for (let i = state.enemyProjectiles.length - 1; i >= 0; i -= 1) {
    const p = state.enemyProjectiles[i];
    if (Math.hypot(p.x - c.x, p.y - c.y) <= pulseRadius + 40) {
      burst(p.x, p.y, p.color, 6);
      state.enemyProjectiles.splice(i, 1);
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const dist = Math.hypot(enemy.x - c.x, enemy.y - c.y);
    if (dist > pulseRadius + enemy.radius) continue;

    const falloff = 1 - Math.max(0, dist - 60) / Math.max(1, pulseRadius - 60);
    const damage = state.pulseDamage * (0.58 + Math.max(0, falloff) * 0.42);
    enemy.hp -= damage;
    enemy.x += Math.cos(enemy.angle) * -18;
    enemy.y += Math.sin(enemy.angle) * -18;
    burst(enemy.x, enemy.y, colors.cyan, 12);

    if (enemy.hp <= 0) {
      recordEnemyDestroyed(enemy, { chargePulse: false });
      burst(enemy.x, enemy.y, enemy.color, 24);
      state.enemies.splice(i, 1);
    }
  }

  updateUi();
}

function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const p = state.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = state.enemies[j];
      if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < p.radius + enemy.radius) {
        enemy.hp -= p.damage;
        burst(p.x, p.y, p.color, 7);
        hit = true;
        if (enemy.hp <= 0) {
          recordEnemyDestroyed(enemy);
          playSound("enemyDestroyed", { volume: 0.52, rate: rand(0.92, 1.08), cooldown: 55 });
          burst(enemy.x, enemy.y, enemy.color, 24);
          state.enemies.splice(j, 1);
        } else {
          playSound("enemyHit", { volume: 0.36, rate: rand(0.94, 1.1), cooldown: 35 });
        }
        break;
      }
    }

    if (hit || p.life <= 0 || p.x < -50 || p.y < -50 || p.x > state.width + 50 || p.y > state.height + 50) {
      state.projectiles.splice(i, 1);
    }
  }
}

function updateEnemyProjectiles(dt) {
  const c = center();
  for (let i = state.enemyProjectiles.length - 1; i >= 0; i -= 1) {
    const p = state.enemyProjectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (Math.hypot(p.x - c.x, p.y - c.y) < p.radius + 30) {
      state.health = Math.max(0, state.health - p.damage);
      state.shake = 6;
      playSound("coreDamaged", { volume: 0.58, cooldown: 180 });
      burst(p.x, p.y, colors.red, 14);
      state.enemyProjectiles.splice(i, 1);
      if (state.health <= 0) endGame();
      continue;
    }

    if (p.life <= 0 || p.x < -50 || p.y < -50 || p.x > state.width + 50 || p.y > state.height + 50) {
      state.enemyProjectiles.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  updateUi();
  playSound("gameOver", { volume: 0.62, cooldown: 800 });
  showRunReport();
}

function showRunReport() {
  const previousBest = Number(localStorage.getItem(bestScoreKey) || 0);
  const isNewBest = state.score > previousBest;
  const bestScore = isNewBest ? state.score : previousBest;
  if (isNewBest) localStorage.setItem(bestScoreKey, String(state.score));

  const favorite = favoriteUpgrade();
  ui.overlay.classList.remove("hidden");
  ui.overlay.querySelector(".kicker").textContent = "Core Offline";
  ui.overlay.querySelector("h1").textContent = isNewBest ? "New Best!" : "Run Complete";
  ui.overlayMessage.textContent = isNewBest ? `Score ${formatNumber(state.score)} beat your previous best.` : `Score ${formatNumber(state.score)}. Best: ${formatNumber(bestScore)}.`;
  ui.runReport.innerHTML = `
    <div><span>Wave Reached</span><strong>${state.wave}</strong></div>
    <div><span>Enemies Destroyed</span><strong>${formatNumber(state.runStats?.enemiesDestroyed || 0)}</strong></div>
    <div><span>Favorite Upgrade</span><strong>${favorite}</strong></div>
    <div><span>Emergency Pulses</span><strong>${state.runStats?.pulsesFired || 0}</strong></div>
  `;
  ui.runReport.classList.remove("hidden");
  ui.startButton.textContent = "Retry";
}

function favoriteUpgrade() {
  const upgrades = state.runStats?.upgradesBought || {};
  let bestKind = null;
  let bestCount = 0;

  for (const kind of Object.keys(upgradeLabels)) {
    const count = upgrades[kind] || 0;
    if (count > bestCount || (count === bestCount && count > 0 && state.runStats?.lastUpgrade === kind)) {
      bestKind = kind;
      bestCount = count;
    }
  }

  if (!bestKind) return "None";
  return `${upgradeLabels[bestKind]} x${bestCount}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function buyUpgrade(kind) {
  if (!state.running || state.paused) return;
  const upgrade = state.upgrades[kind];
  if (state.credits < upgrade.cost) return;
  if (kind === "patch" && state.health >= state.maxHealth) return;

  state.credits -= upgrade.cost;
  if (kind !== "patch") upgrade.level += 1;
  upgrade.cost = kind === "patch" ? Math.round(upgrade.cost * 1.25 + 8) : Math.round(upgrade.cost * 1.55 + 12);

  if (kind === "damage") state.tower.damage += 7;
  if (kind === "rate") state.tower.fireDelay = Math.max(0.13, state.tower.fireDelay * 0.84);
  if (kind === "range") state.tower.range += 38;
  if (kind === "split") state.tower.split = Math.min(state.tower.gunBases.length, state.tower.split + 1);
  if (kind === "hull") {
    state.maxHealth += 25;
    state.health = Math.min(state.maxHealth, state.health + 35);
  }
  if (kind === "repair") state.repairRate += 0.85;
  if (kind === "patch") state.health = Math.min(state.maxHealth, state.health + 45);

  if (state.runStats) {
    state.runStats.upgradesBought[kind] += 1;
    state.runStats.lastUpgrade = kind;
  }
  playSound("upgradePurchase", { volume: 0.46, cooldown: 80 });
  burst(center().x, center().y, colors.amber, 16);
  updateUi();
}

function togglePause() {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
  playSound("pauseToggle", { volume: 0.4, rate: state.paused ? 0.82 : 1.12, cooldown: 80 });
  state.last = performance.now();
  updateUi();
}

function updateUi() {
  const healthPct = Math.max(0, state.health / state.maxHealth) * 100;
  ui.healthBar.style.width = `${healthPct}%`;
  const pulsePct = Math.max(0, Math.min(100, (state.pulseCharge / state.pulseMax) * 100));
  ui.pulseCharge.textContent = state.pulseCharge >= state.pulseMax ? "Ready" : `${Math.floor(pulsePct)}%`;
  ui.pulseFill.style.width = `${pulsePct}%`;
  ui.pulseButton.disabled = !state.running || state.paused || state.gameOver || state.pulseCharge < state.pulseMax;
  ui.pulseButton.classList.toggle("ready", state.running && !state.paused && !state.gameOver && state.pulseCharge >= state.pulseMax);
  ui.wave.textContent = state.wave;
  ui.credits.textContent = state.credits;
  ui.score.textContent = state.score;
  ui.pauseButton.disabled = !state.running || state.gameOver;
  ui.pauseButton.textContent = state.paused ? "Resume" : "Pause";

  for (const kind of Object.keys(state.upgrades)) {
    ui[`${kind}Level`].textContent = state.upgrades[kind].level;
    ui[`${kind}Cost`].textContent = `Cost ${state.upgrades[kind].cost}`;
  }

  ui.upgrades.forEach((button) => {
    const kind = button.dataset.upgrade;
    button.disabled = !state.running || state.paused || state.credits < state.upgrades[kind].cost || (kind === "split" && state.tower.split >= state.tower.gunBases.length) || (kind === "patch" && state.health >= state.maxHealth);
  });
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, state.width, state.height);

  if (state.shake > 0) {
    ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
  }

  drawArena();
  drawRange();
  drawPulseWave();
  drawEnemies();
  drawProjectiles();
  drawEnemyProjectiles();
  drawTower();
  drawParticles();
  ctx.restore();
  drawPulseFlash();
}

function drawPulseFlash() {
  if (state.pulseFlash <= 0) return;
  ctx.save();
  ctx.globalAlpha = state.pulseFlash * 0.3;
  ctx.fillStyle = "#dffbff";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = state.pulseFlash * 0.28;
  ctx.fillStyle = colors.pink;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

function drawArena() {
  const c = center();
  const grid = 48;
  ctx.fillStyle = colors.dark;
  ctx.fillRect(0, 0, state.width, state.height);

  const vignette = ctx.createRadialGradient(c.x, c.y, 80, c.x, c.y, Math.max(state.width, state.height) * 0.72);
  vignette.addColorStop(0, "rgba(5, 22, 32, 0.25)");
  vignette.addColorStop(0.72, "rgba(4, 7, 13, 0.25)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.72)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.strokeStyle = "rgba(111, 247, 255, 0.09)";
  ctx.lineWidth = 1;
  for (let x = (state.time * 10) % grid; x < state.width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.height);
    ctx.stroke();
  }
  for (let y = (state.time * 10) % grid; y < state.height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.width, y);
    ctx.stroke();
  }

  const pulse = 0.5 + Math.sin(state.time * 3) * 0.5;
  const glow = ctx.createRadialGradient(c.x, c.y, 20, c.x, c.y, Math.min(state.width, state.height) * 0.52);
  glow.addColorStop(0, `rgba(111, 247, 255, ${0.18 + pulse * 0.08})`);
  glow.addColorStop(0.5, "rgba(111, 247, 255, 0.035)");
  glow.addColorStop(1, "rgba(111, 247, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.strokeStyle = "rgba(255, 95, 199, 0.28)";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, state.width - 32, state.height - 32);
  drawArenaHardware();
}

function drawArenaHardware() {
  const w = state.width;
  const h = state.height;
  const glow = 0.35 + Math.sin(state.time * 3) * 0.15;

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = colors.pink;
  ctx.strokeStyle = `rgba(255, 52, 127, ${0.55 + glow})`;
  ctx.lineWidth = 3;

  const gates = [
    [[w * 0.42, 11], [w * 0.58, 11]],
    [[w * 0.42, h - 11], [w * 0.58, h - 11]],
    [[11, h * 0.38], [11, h * 0.62]],
    [[w - 11, h * 0.38], [w - 11, h * 0.62]]
  ];
  for (const gate of gates) {
    ctx.beginPath();
    ctx.moveTo(gate[0][0], gate[0][1]);
    ctx.lineTo(gate[1][0], gate[1][1]);
    ctx.stroke();
  }

  drawGateTriangle(w / 2, 18, Math.PI / 2);
  drawGateTriangle(w / 2, h - 18, -Math.PI / 2);
  drawGateTriangle(18, h / 2, 0);
  drawGateTriangle(w - 18, h / 2, Math.PI);
  ctx.restore();
}

function drawGateTriangle(x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(13, 11);
  ctx.lineTo(-13, 11);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 52, 127, 0.74)";
  ctx.fill();
  ctx.restore();
}

function drawPulseWave() {
  if (!state.pulseWave) return;
  const c = center();
  const progress = 1 - state.pulseWave.life / state.pulseWave.maxLife;
  const radius = state.pulseWave.radius * (0.18 + progress * 0.82);
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = `rgba(111, 247, 255, ${0.9 * alpha})`;
  ctx.lineWidth = 8 * alpha + 2;
  ctx.beginPath();
  ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowColor = colors.pink;
  ctx.shadowBlur = 24;
  ctx.strokeStyle = `rgba(255, 95, 199, ${0.55 * alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c.x, c.y, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawRange() {
  const c = center();
  ctx.beginPath();
  ctx.arc(c.x, c.y, state.tower.range, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(168, 255, 111, 0.12)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTower() {
  const c = center();
  ctx.save();
  ctx.translate(c.x, c.y);

  const ringPulse = Math.sin(state.time * 2.4) * 0.5 + 0.5;
  if (!drawStationBaseSprite()) {
    drawProceduralStationBase();
  }

  for (let i = 0; i < activeGunCount(); i += 1) {
    const current = state.tower.gunAngles[i];
    const base = state.tower.gunBases[i];
    const mountX = c.x + Math.cos(base) * 88;
    const mountY = c.y + Math.sin(base) * 88;
    const targetAngle = Math.atan2(
      c.y + Math.sin(state.tower.angle) * state.tower.range - mountY,
      c.x + Math.cos(state.tower.angle) * state.tower.range - mountX
    );
    const targetDiff = angleDifference(targetAngle, base);
    const localLimit = activeGunCount() === 1 ? Math.PI : Math.PI * 0.23;
    const localAim = Math.max(-localLimit, Math.min(localLimit, targetDiff));
    const limitedTargetAngle = base + localAim;
    if (!state.paused) {
      state.tower.gunAngles[i] = current + angleDifference(limitedTargetAngle, current) * 0.18;
    }
    drawStationGun(base, state.tower.gunAngles[i]);
  }

  ctx.beginPath();
  ctx.arc(0, 0, 33 + ringPulse * 2, 0, Math.PI * 2);
  ctx.strokeStyle = colors.lime;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  ctx.beginPath();
  ctx.arc(c.x, c.y, 29 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(111, 247, 255, 0.2)";
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.strokeStyle = colors.cyan;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawStationBaseSprite() {
  const image = stationSpriteImages.base;
  if (!image || !image.complete || !image.naturalWidth) return false;

  const width = 214;
  const height = width * (image.naturalHeight / image.naturalWidth);
  ctx.save();
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 30;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
}

function drawProceduralStationBase() {
  ctx.rotate(state.time * 0.06);
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 34;
  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.arc(0, 0, 40, 0, Math.PI * 2, true);
  const stationHull = ctx.createRadialGradient(0, 0, 18, 0, 0, 94);
  stationHull.addColorStop(0, "rgba(111, 247, 255, 0.3)");
  stationHull.addColorStop(0.42, "rgba(28, 42, 49, 0.98)");
  stationHull.addColorStop(0.72, "rgba(124, 132, 129, 0.78)");
  stationHull.addColorStop(1, "rgba(7, 10, 13, 0.98)");
  ctx.fillStyle = stationHull;
  ctx.fill();
  ctx.strokeStyle = "rgba(216, 251, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.shadowBlur = 0;
  for (let i = 0; i < 24; i += 1) {
    const angle = (Math.PI * 2 * i) / 24 + state.time * 0.08;
    const inner = i % 3 === 0 ? 42 : 52;
    const outer = i % 2 ? 78 : 92;
    ctx.strokeStyle = i % 4 === 0 ? colors.amber : "rgba(111, 247, 255, 0.55)";
    ctx.lineWidth = i % 4 === 0 ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 ? "rgba(216, 251, 255, 0.2)" : "rgba(255, 211, 106, 0.25)";
    ctx.fillRect(58, -5, 22, 10);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.strokeRect(58, -5, 22, 10);
    ctx.restore();
  }

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(6, 11, 16, 0.9)";
    ctx.strokeStyle = "rgba(111, 247, 255, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(70, -8, 18, 16, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate(-state.time * 0.06);
}

function drawStationGun(mountAngle, aimAngle) {
  ctx.save();
  ctx.rotate(mountAngle);
  ctx.translate(88, 0);
  ctx.rotate(angleDifference(aimAngle, mountAngle));
  const image = stationSpriteImages.gun;
  if (image && image.complete && image.naturalWidth) {
    const width = 62;
    const height = width * (image.naturalHeight / image.naturalWidth);
    ctx.shadowColor = colors.cyan;
    ctx.shadowBlur = 12;
    ctx.drawImage(image, -25, -height / 2, width, height);
    ctx.restore();
    return;
  }

  ctx.fillStyle = "rgba(9, 13, 20, 0.97)";
  ctx.strokeStyle = colors.cyan;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(-11, -8, 22, 16, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 211, 106, 0.65)";
  ctx.fillRect(-7, -5, 6, 10);
  ctx.fillStyle = "#dffbff";
  ctx.fillRect(5, -3.5, 34, 7);
  ctx.fillStyle = colors.pink;
  ctx.fillRect(33, -2.5, 11, 5);
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    drawShipHull(enemy);
    ctx.restore();

    if (enemy.hp < enemy.maxHp) {
      const hpPct = enemy.hp / enemy.maxHp;
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2, 4);
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2 * hpPct, 4);
    }
  }
}

function drawShipHull(enemy) {
  if (drawEnemySprite(enemy)) return;

  ctx.scale(1.22, 1.22);
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 13;
  ctx.lineWidth = 1.9;
  ctx.strokeStyle = enemy.color;
  const hull = ctx.createLinearGradient(-enemy.radius * 1.8, -enemy.radius, enemy.radius * 1.8, enemy.radius);
  hull.addColorStop(0, "rgba(8, 12, 18, 0.98)");
  hull.addColorStop(0.35, "rgba(54, 64, 72, 0.96)");
  hull.addColorStop(0.68, "rgba(174, 188, 190, 0.42)");
  hull.addColorStop(1, "rgba(6, 9, 14, 0.98)");
  ctx.fillStyle = hull;

  if (enemy.shape === "needle") drawNeedleShip(enemy);
  if (enemy.shape === "saucer") drawSaucerShip(enemy);
  if (enemy.shape === "barge") drawBargeShip(enemy);
  if (enemy.shape === "frigate") drawFrigateShip(enemy);

  ctx.shadowBlur = 0;
}

function drawEnemySprite(enemy) {
  const image = enemySpriteImages[enemy.sprite];
  if (!image || !image.complete || !image.naturalWidth) return false;

  const width = enemy.spriteWidth;
  const height = width * (image.naturalHeight / image.naturalWidth);
  ctx.save();
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 12;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.shadowBlur = 0;

  ctx.globalCompositeOperation = "screen";
  const pulse = 0.25 + Math.sin(state.time * 8 + enemy.spin) * 0.08;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = enemy.accent;
  ctx.beginPath();
  ctx.ellipse(-width * 0.42, 0, width * 0.2, height * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  return true;
}

function drawNeedleShip(enemy) {
  const r = enemy.radius;
  ctx.beginPath();
  ctx.moveTo(r * 1.8, 0);
  ctx.lineTo(-r * 0.8, -r * 0.55);
  ctx.lineTo(-r * 0.35, 0);
  ctx.lineTo(-r * 0.8, r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(216, 251, 255, 0.18)";
  ctx.fillRect(-r * 0.35, -r * 0.18, r * 0.95, r * 0.36);
  drawShipRivets(r, 4, -0.2, 0.42);
  ctx.strokeStyle = enemy.accent;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(r * 1.15, 0);
  ctx.lineTo(-r * 0.3, 0);
  ctx.moveTo(-r * 0.95, -r * 0.35);
  ctx.lineTo(-r * 1.45, -r * 0.85);
  ctx.moveTo(-r * 0.95, r * 0.35);
  ctx.lineTo(-r * 1.45, r * 0.85);
  ctx.stroke();
  drawCockpit(r * 0.55, 0, r * 0.22, enemy.accent);
  drawEngineFlare(-r * 1.05, 0, enemy.accent);
}

function drawSaucerShip(enemy) {
  const r = enemy.radius;
  ctx.save();
  ctx.scale(1.35, 0.72);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(216, 251, 255, 0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(6, 10, 15, 0.55)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, 0, r * 0.62, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  drawShipRivets(r, 5, -0.72, 0.36);
  ctx.strokeStyle = enemy.accent;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(r * 1.4, 0);
  ctx.lineTo(r * 0.45, 0);
  ctx.moveTo(-r * 0.85, -r * 0.35);
  ctx.lineTo(-r * 1.55, -r * 0.55);
  ctx.moveTo(-r * 0.85, r * 0.35);
  ctx.lineTo(-r * 1.55, r * 0.55);
  ctx.stroke();
  drawCockpit(r * 0.18, 0, r * 0.28, enemy.accent);
  drawEngineFlare(-r * 1.25, 0, enemy.accent);
}

function drawBargeShip(enemy) {
  const r = enemy.radius;
  ctx.beginPath();
  ctx.moveTo(r * 1.35, 0);
  ctx.lineTo(r * 0.52, -r * 0.78);
  ctx.lineTo(-r * 1.25, -r * 0.62);
  ctx.lineTo(-r * 1.45, 0);
  ctx.lineTo(-r * 1.25, r * 0.62);
  ctx.lineTo(r * 0.52, r * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(216, 251, 255, 0.14)";
  ctx.fillRect(-r * 0.55, -r * 0.34, r * 1.02, r * 0.22);
  ctx.fillRect(-r * 0.55, r * 0.12, r * 1.02, r * 0.22);
  ctx.fillStyle = "rgba(255, 211, 106, 0.22)";
  ctx.fillRect(r * 0.22, -r * 0.52, r * 0.22, r * 1.04);
  ctx.strokeStyle = enemy.accent;
  ctx.lineWidth = 1.25;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, i * r * 0.35);
    ctx.lineTo(r * 0.65, i * r * 0.22);
    ctx.stroke();
  }
  drawArmorPlates(r);
  drawCockpit(r * 0.6, 0, r * 0.18, enemy.accent);
  drawEngineFlare(-r * 1.48, -r * 0.3, enemy.accent);
  drawEngineFlare(-r * 1.48, r * 0.3, enemy.accent);
}

function drawFrigateShip(enemy) {
  const r = enemy.radius;
  ctx.beginPath();
  ctx.moveTo(r * 1.55, 0);
  ctx.lineTo(r * 0.25, -r * 0.62);
  ctx.lineTo(-r * 1.3, -r * 0.28);
  ctx.lineTo(-r * 1.52, 0);
  ctx.lineTo(-r * 1.3, r * 0.28);
  ctx.lineTo(r * 0.25, r * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(216, 251, 255, 0.14)";
  ctx.fillRect(-r * 0.6, -r * 0.15, r * 1.12, r * 0.3);
  ctx.fillStyle = "rgba(178, 140, 255, 0.18)";
  ctx.fillRect(-r * 0.96, -r * 0.24, r * 0.48, r * 0.48);
  drawShipRivets(r, 4, -0.88, 0.4);
  ctx.strokeStyle = enemy.accent;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(r * 0.2, 0);
  ctx.lineTo(r * 1.85, 0);
  ctx.moveTo(-r * 0.45, -r * 0.75);
  ctx.lineTo(-r * 1.1, -r * 1.05);
  ctx.moveTo(-r * 0.45, r * 0.75);
  ctx.lineTo(-r * 1.1, r * 1.05);
  ctx.stroke();
  drawCockpit(r * 0.58, 0, r * 0.2, enemy.accent);
  drawEngineFlare(-r * 1.45, 0, enemy.accent);
}

function drawCockpit(x, y, radius, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawShipRivets(r, count, startX, spread) {
  ctx.save();
  ctx.fillStyle = "rgba(216, 251, 255, 0.38)";
  for (let i = 0; i < count; i += 1) {
    const x = r * (startX + i * spread);
    ctx.beginPath();
    ctx.arc(x, -r * 0.32, Math.max(1, r * 0.08), 0, Math.PI * 2);
    ctx.arc(x, r * 0.32, Math.max(1, r * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawArmorPlates(r) {
  ctx.strokeStyle = "rgba(216, 251, 255, 0.45)";
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, i * r * 0.48);
    ctx.lineTo(r * 0.2, i * r * 0.54);
    ctx.stroke();
  }
}

function drawEngineFlare(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(-12 - Math.sin(state.time * 16) * 4, 0);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.65;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawProjectiles() {
  for (const p of state.projectiles) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
    ctx.lineTo(p.x + p.vx * 0.008, p.y + p.vy * 0.008);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemyProjectiles() {
  for (const p of state.enemyProjectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function loop(now) {
  const dt = Math.min(0.033, (now - state.last) / 1000 || 0);
  state.last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

ui.startButton.addEventListener("click", () => {
  unlockAudio();
  ui.overlay.querySelector(".kicker").textContent = "Single Tower Defense";
  ui.overlay.querySelector("h1").textContent = "Neon Core Defense";
  ui.overlayMessage.textContent = "Hold the center reactor against edge-born drones. Your turret aims and fires automatically.";
  ui.runReport.classList.add("hidden");
  ui.runReport.innerHTML = "";
  ui.startButton.textContent = "Start Defense";
  resetGame();
});

ui.pauseButton.addEventListener("click", togglePause);
ui.pulseButton.addEventListener("click", activateEmergencyPulse);

ui.upgrades.forEach((button) => {
  button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
});

window.addEventListener("resize", resize);
resize();
updateUi();
requestAnimationFrame(loop);

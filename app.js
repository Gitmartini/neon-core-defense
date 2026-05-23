const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  healthBar: document.getElementById("healthBar"),
  wave: document.getElementById("wave"),
  credits: document.getElementById("credits"),
  score: document.getElementById("score"),
  overlay: document.getElementById("overlay"),
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
    shape: "needle"
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
    shape: "saucer"
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
    shape: "barge"
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
    stopRange: 285,
    fireDelay: 2.1,
    shotDamage: 7
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
  if (state.wave > 2 && roll < 0.22) return "interceptor";
  return "raider";
}

function nextWave() {
  state.wave += 1;
  state.spawnBudget = 8 + state.wave * 3;
  state.spawnTimer = 0.4;
  state.waveBreak = 1.4;
  state.credits += 18 + state.wave * 3;
  burst(center().x, center().y, colors.lime, 22);
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
    x: c.x + Math.cos(mountAngle) * 47 + Math.cos(aimAngle) * 24,
    y: c.y + Math.sin(mountAngle) * 47 + Math.sin(aimAngle) * 24
  };
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
          state.score += Math.round(enemy.value * 10 + state.wave * 8);
          state.credits += enemy.value;
          burst(enemy.x, enemy.y, enemy.color, 24);
          state.enemies.splice(j, 1);
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
  ui.overlay.classList.remove("hidden");
  ui.overlay.querySelector(".kicker").textContent = "Core Offline";
  ui.overlay.querySelector("h1").textContent = "Defense Broken";
  ui.overlay.querySelector("p").textContent = `Wave ${state.wave} reached. Final score: ${state.score}.`;
  ui.startButton.textContent = "Restart";
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

  burst(center().x, center().y, colors.amber, 16);
  updateUi();
}

function togglePause() {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
  state.last = performance.now();
  updateUi();
}

function updateUi() {
  const healthPct = Math.max(0, state.health / state.maxHealth) * 100;
  ui.healthBar.style.width = `${healthPct}%`;
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
  drawEnemies();
  drawProjectiles();
  drawEnemyProjectiles();
  drawTower();
  drawParticles();
  ctx.restore();
}

function drawArena() {
  const c = center();
  const grid = 48;
  ctx.fillStyle = colors.dark;
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
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.arc(0, 0, 25, 0, Math.PI * 2, true);
  ctx.fillStyle = "rgba(111, 247, 255, 0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(216, 251, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.shadowBlur = 0;
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16 + state.time * 0.08;
    const inner = 27;
    const outer = i % 2 ? 44 : 49;
    ctx.strokeStyle = i % 4 === 0 ? colors.lime : "rgba(111, 247, 255, 0.55)";
    ctx.lineWidth = i % 4 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  for (let i = 0; i < activeGunCount(); i += 1) {
    const current = state.tower.gunAngles[i];
    const base = state.tower.gunBases[i];
    const mountX = c.x + Math.cos(base) * 47;
    const mountY = c.y + Math.sin(base) * 47;
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
  ctx.arc(0, 0, 18 + ringPulse * 2, 0, Math.PI * 2);
  ctx.strokeStyle = colors.lime;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  ctx.beginPath();
  ctx.arc(c.x, c.y, 11 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2);
  ctx.fillStyle = colors.lime;
  ctx.shadowColor = colors.lime;
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawStationGun(mountAngle, aimAngle) {
  ctx.save();
  ctx.rotate(mountAngle);
  ctx.translate(47, 0);
  ctx.rotate(angleDifference(aimAngle, mountAngle));
  ctx.fillStyle = "rgba(9, 13, 20, 0.95)";
  ctx.strokeStyle = colors.cyan;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(-5, -5, 12, 10, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#dffbff";
  ctx.fillRect(4, -2.5, 18, 5);
  ctx.fillStyle = colors.pink;
  ctx.fillRect(18, -1.5, 6, 3);
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
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 13;
  ctx.lineWidth = 2.3;
  ctx.strokeStyle = enemy.color;
  const hull = ctx.createLinearGradient(-enemy.radius * 1.8, -enemy.radius, enemy.radius * 1.8, enemy.radius);
  hull.addColorStop(0, "rgba(216, 251, 255, 0.05)");
  hull.addColorStop(0.45, "rgba(216, 251, 255, 0.16)");
  hull.addColorStop(1, "rgba(9, 13, 20, 0.68)");
  ctx.fillStyle = hull;

  if (enemy.shape === "needle") drawNeedleShip(enemy);
  if (enemy.shape === "saucer") drawSaucerShip(enemy);
  if (enemy.shape === "barge") drawBargeShip(enemy);
  if (enemy.shape === "frigate") drawFrigateShip(enemy);

  ctx.shadowBlur = 0;
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
  ctx.strokeStyle = enemy.accent;
  ctx.beginPath();
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
  ctx.strokeStyle = enemy.accent;
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
  ctx.strokeStyle = enemy.accent;
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
  ctx.strokeStyle = enemy.accent;
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
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
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
  ui.overlay.querySelector(".kicker").textContent = "Single Tower Defense";
  ui.overlay.querySelector("h1").textContent = "Neon Core Defense";
  ui.startButton.textContent = "Start Defense";
  resetGame();
});

ui.pauseButton.addEventListener("click", togglePause);

ui.upgrades.forEach((button) => {
  button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
});

window.addEventListener("resize", resize);
resize();
updateUi();
requestAnimationFrame(loop);

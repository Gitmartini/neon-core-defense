const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  healthBar: document.getElementById("healthBar"),
  wave: document.getElementById("wave"),
  credits: document.getElementById("credits"),
  score: document.getElementById("score"),
  overlay: document.getElementById("overlay"),
  startButton: document.getElementById("startButton"),
  damageLevel: document.getElementById("damageLevel"),
  rateLevel: document.getElementById("rateLevel"),
  rangeLevel: document.getElementById("rangeLevel"),
  splitLevel: document.getElementById("splitLevel"),
  damageCost: document.getElementById("damageCost"),
  rateCost: document.getElementById("rateCost"),
  rangeCost: document.getElementById("rangeCost"),
  splitCost: document.getElementById("splitCost"),
  upgrades: [...document.querySelectorAll(".upgrade")]
};

const state = {
  running: false,
  gameOver: false,
  width: canvas.width,
  height: canvas.height,
  time: 0,
  last: 0,
  shake: 0,
  health: 100,
  maxHealth: 100,
  wave: 1,
  score: 0,
  credits: 70,
  enemies: [],
  projectiles: [],
  particles: [],
  spawnTimer: 0,
  spawnBudget: 0,
  waveBreak: 1.5,
  upgrades: {
    damage: { level: 1, cost: 40 },
    rate: { level: 1, cost: 50 },
    range: { level: 1, cost: 45 },
    split: { level: 1, cost: 90 }
  },
  tower: {
    angle: 0,
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
  red: "#ff596f",
  dark: "#05080d"
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
  state.time = 0;
  state.last = performance.now();
  state.shake = 0;
  state.health = state.maxHealth;
  state.wave = 1;
  state.score = 0;
  state.credits = 70;
  state.enemies = [];
  state.projectiles = [];
  state.particles = [];
  state.spawnBudget = 10;
  state.spawnTimer = 0.2;
  state.waveBreak = 1.5;
  state.upgrades.damage = { level: 1, cost: 40 };
  state.upgrades.rate = { level: 1, cost: 50 };
  state.upgrades.range = { level: 1, cost: 45 };
  state.upgrades.split = { level: 1, cost: 90 };
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
  const typeRoll = Math.random();
  const isTank = state.wave > 3 && typeRoll > 0.78;
  const isRunner = state.wave > 2 && typeRoll < 0.18;
  const radius = isTank ? 18 : isRunner ? 9 : 13;
  const hp = isTank ? 75 + waveBoost * 12 : isRunner ? 24 + waveBoost * 5 : 40 + waveBoost * 8;
  const speed = isTank ? 32 + waveBoost * 2 : isRunner ? 96 + waveBoost * 5 : 56 + waveBoost * 3;

  state.enemies.push({
    x,
    y,
    radius,
    hp,
    maxHp: hp,
    speed,
    value: isTank ? 24 : isRunner ? 11 : 15,
    damage: isTank ? 14 : isRunner ? 6 : 9,
    color: isTank ? colors.amber : isRunner ? colors.pink : colors.cyan,
    spin: rand(0, Math.PI * 2)
  });
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
  const shots = state.tower.split;
  const spread = shots === 1 ? 0 : 0.16;

  for (let i = 0; i < shots; i += 1) {
    const offset = (i - (shots - 1) / 2) * spread;
    const angle = baseAngle + offset;
    state.projectiles.push({
      x: c.x + Math.cos(angle) * 28,
      y: c.y + Math.sin(angle) * 28,
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
  burst(c.x + Math.cos(baseAngle) * 36, c.y + Math.sin(baseAngle) * 36, colors.cyan, 5);
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
  if (!state.running) return;

  state.time += dt;
  state.shake = Math.max(0, state.shake - dt * 22);
  state.tower.cooldown = Math.max(0, state.tower.cooldown - dt);

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
  updateParticles(dt);
  updateUi();
}

function updateEnemies(dt) {
  const c = center();
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const angle = Math.atan2(c.y - enemy.y, c.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed * dt;
    enemy.y += Math.sin(angle) * enemy.speed * dt;
    enemy.spin += dt * 4;

    if (Math.hypot(enemy.x - c.x, enemy.y - c.y) < enemy.radius + 29) {
      state.health = Math.max(0, state.health - enemy.damage);
      state.shake = 9;
      burst(enemy.x, enemy.y, colors.red, 20);
      state.enemies.splice(i, 1);
      if (state.health <= 0) endGame();
    }
  }
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
  if (!state.running) return;
  const upgrade = state.upgrades[kind];
  if (state.credits < upgrade.cost) return;

  state.credits -= upgrade.cost;
  upgrade.level += 1;
  upgrade.cost = Math.round(upgrade.cost * 1.55 + 12);

  if (kind === "damage") state.tower.damage += 7;
  if (kind === "rate") state.tower.fireDelay = Math.max(0.13, state.tower.fireDelay * 0.84);
  if (kind === "range") state.tower.range += 38;
  if (kind === "split") state.tower.split = Math.min(5, state.tower.split + 1);

  burst(center().x, center().y, colors.amber, 16);
  updateUi();
}

function updateUi() {
  const healthPct = Math.max(0, state.health / state.maxHealth) * 100;
  ui.healthBar.style.width = `${healthPct}%`;
  ui.wave.textContent = state.wave;
  ui.credits.textContent = state.credits;
  ui.score.textContent = state.score;

  for (const kind of Object.keys(state.upgrades)) {
    ui[`${kind}Level`].textContent = state.upgrades[kind].level;
    ui[`${kind}Cost`].textContent = `Cost ${state.upgrades[kind].cost}`;
  }

  ui.upgrades.forEach((button) => {
    const kind = button.dataset.upgrade;
    button.disabled = !state.running || state.credits < state.upgrades[kind].cost || (kind === "split" && state.tower.split >= 5);
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

  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(111, 247, 255, 0.16)";
  ctx.fill();
  ctx.strokeStyle = colors.cyan;
  ctx.lineWidth = 3;
  ctx.shadowColor = colors.cyan;
  ctx.shadowBlur = 18;
  ctx.stroke();

  ctx.rotate(state.tower.angle);
  ctx.fillStyle = "#dffbff";
  ctx.shadowColor = colors.lime;
  ctx.shadowBlur = 18;
  ctx.fillRect(8, -6, 44, 12);
  ctx.fillStyle = colors.pink;
  ctx.fillRect(38, -3, 14, 6);

  ctx.restore();

  ctx.beginPath();
  ctx.arc(c.x, c.y, 14 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2);
  ctx.fillStyle = colors.lime;
  ctx.shadowColor = colors.lime;
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.spin);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const r = i % 2 ? enemy.radius * 0.78 : enemy.radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const hpPct = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2, 4);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2 * hpPct, 4);
  }
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

ui.upgrades.forEach((button) => {
  button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
});

window.addEventListener("resize", resize);
resize();
updateUi();
requestAnimationFrame(loop);

const fs = require("node:fs");
const path = require("node:path");

const sampleRate = 44100;
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets", "sounds");
fs.mkdirSync(outDir, { recursive: true });

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function envelope(t, duration, attack = 0.01, release = 0.08) {
  const fadeIn = Math.min(1, t / attack);
  const fadeOut = Math.min(1, (duration - t) / release);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function sine(freq, t) {
  return Math.sin(Math.PI * 2 * freq * t);
}

function square(freq, t) {
  return sine(freq, t) >= 0 ? 1 : -1;
}

function noise(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function render(duration, generator) {
  const count = Math.ceil(duration * sampleRate);
  const data = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    data[i] = clamp(generator(t, i) * envelope(t, duration));
  }
  return data;
}

function writeWav(fileName, samples) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(outDir, fileName), buffer);
}

const sounds = [
  {
    file: "tower-fire.wav",
    label: "Tower Fire",
    attachesTo: "Each turret shot",
    samples: render(0.24, (t, i) => {
      const muzzleCrack = noise(i * 3.7) * Math.exp(-t * 80);
      const pressure = sine(105 - t * 180, t) * Math.exp(-t * 16);
      const railSnap = square(720 - t * 1800, t) * Math.exp(-t * 28);
      const servoTail = sine(220 + t * 120, t) * Math.exp(-t * 11);
      return 0.52 * muzzleCrack + 0.5 * pressure + 0.24 * railSnap + 0.18 * servoTail;
    })
  },
  {
    file: "enemy-hit.wav",
    label: "Enemy Hit",
    attachesTo: "Projectile damages an enemy",
    samples: render(0.12, (t, i) => {
      return 0.4 * noise(i) * (1 - t * 5) + 0.25 * sine(220 - t * 600, t);
    })
  },
  {
    file: "enemy-destroyed.wav",
    label: "Enemy Destroyed",
    attachesTo: "Enemy explodes and awards credits",
    samples: render(0.45, (t, i) => {
      const boom = sine(120 - t * 100, t) * Math.exp(-t * 5);
      const sparks = noise(i * 1.7) * Math.exp(-t * 8);
      return 0.55 * boom + 0.32 * sparks;
    })
  },
  {
    file: "core-damaged.wav",
    label: "Core Damaged",
    attachesTo: "Enemy or artillery shot hurts the core",
    samples: render(0.5, (t) => {
      const alarm = sine(180, t) * Math.exp(-t * 2.5);
      const crunch = square(72, t) * Math.exp(-t * 7);
      return 0.32 * alarm + 0.34 * crunch;
    })
  },
  {
    file: "emergency-pulse.wav",
    label: "Emergency Pulse",
    attachesTo: "Full-charge pulse button",
    samples: render(0.88, (t, i) => {
      const subHit = sine(58 - t * 22, t) * Math.exp(-t * 4.2);
      const shockRing = sine(180 + t * 520, t) * Math.exp(-t * 3.4);
      const shimmer = sine(900 + t * 1400, t) * Math.exp(-t * 5.6);
      const crackle = noise(i * 2.1) * Math.exp(-t * 11);
      const gate = t < 0.08 ? 1 : Math.max(0, Math.sin((t - 0.08) * Math.PI * 8));
      return 0.62 * subHit + 0.28 * shockRing + 0.14 * shimmer * gate + 0.18 * crackle;
    })
  },
  {
    file: "upgrade-purchase.wav",
    label: "Upgrade Purchase",
    attachesTo: "Successful upgrade button tap",
    samples: render(0.42, (t) => {
      const step = t < 0.14 ? 420 : t < 0.28 ? 630 : 920;
      return 0.36 * sine(step, t) + 0.18 * sine(step * 2, t);
    })
  },
  {
    file: "wave-start.wav",
    label: "Wave Start",
    attachesTo: "New wave begins",
    samples: render(0.72, (t) => {
      const rise = 180 + t * 620;
      const pulse = Math.sin(t * Math.PI * 10) > 0 ? 1 : 0.35;
      return 0.34 * sine(rise, t) * pulse + 0.16 * sine(rise * 1.5, t);
    })
  },
  {
    file: "pause-toggle.wav",
    label: "Pause Toggle",
    attachesTo: "Pause/resume button",
    samples: render(0.18, (t) => 0.36 * sine(520 - t * 900, t) + 0.16 * square(260, t))
  },
  {
    file: "game-over.wav",
    label: "Game Over",
    attachesTo: "Core destroyed",
    samples: render(1.1, (t, i) => {
      const fall = 320 - t * 190;
      return 0.36 * sine(fall, t) * Math.exp(-t * 0.9) + 0.16 * noise(i) * Math.exp(-t * 4);
    })
  }
];

for (const sound of sounds) {
  writeWav(sound.file, sound.samples);
}

const previewHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Neon Core Defense Sound Preview</title>
    <style>
      body { margin: 0; padding: 24px; background: #070a10; color: #edf8ff; font-family: "Segoe UI", system-ui, sans-serif; }
      h1 { margin: 0 0 18px; color: #6ff7ff; }
      .grid { display: grid; gap: 12px; max-width: 860px; }
      .sound { display: grid; grid-template-columns: minmax(160px, 0.9fr) minmax(220px, 1.1fr) minmax(260px, 1.5fr); gap: 12px; align-items: center; padding: 12px; border: 1px solid rgba(111, 247, 255, 0.28); background: linear-gradient(135deg, rgba(111, 247, 255, 0.1), rgba(255, 95, 199, 0.08)); }
      strong { color: #a8ff6f; }
      span { color: #9eb5c5; }
      audio { width: 100%; }
      @media (max-width: 760px) { .sound { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <h1>Neon Core Defense Sound Preview</h1>
    <div class="grid">
      ${sounds.map((sound) => `
      <div class="sound">
        <strong>${sound.label}</strong>
        <span>${sound.attachesTo}</span>
        <audio controls src="assets/sounds/${sound.file}"></audio>
      </div>`).join("")}
    </div>
  </body>
</html>
`;

fs.writeFileSync(path.join(root, "sound-preview.html"), previewHtml);

for (const sound of sounds) {
  console.log(`${sound.label}: assets/sounds/${sound.file} -> ${sound.attachesTo}`);
}
console.log("Preview: sound-preview.html");

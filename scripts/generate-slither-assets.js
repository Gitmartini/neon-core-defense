const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const root = path.resolve(__dirname, "..");
const shipDir = path.join(root, "assets", "ships");
const stationDir = path.join(root, "assets", "station");
const sourceDir = path.join(root, "assets", "source");
fs.mkdirSync(shipDir, { recursive: true });
fs.mkdirSync(stationDir, { recursive: true });
fs.mkdirSync(sourceDir, { recursive: true });

function makePng(width, height) {
  return new PNG({ width, height });
}

function rgba(hex, alpha = 255) {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    alpha
  ];
}

function noise(x, y, seed = 1) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function blend(png, x, y, color) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= png.width || yi >= png.height) return;
  const offset = (yi * png.width + xi) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  png.data[offset] = Math.round(color[0] * alpha + png.data[offset] * inverse);
  png.data[offset + 1] = Math.round(color[1] * alpha + png.data[offset + 1] * inverse);
  png.data[offset + 2] = Math.round(color[2] * alpha + png.data[offset + 2] * inverse);
  png.data[offset + 3] = Math.min(255, Math.round(color[3] + png.data[offset + 3] * inverse));
}

function speckle(png, color, threshold = 0.9, seed = 1) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (png.data[offset + 3] > 18 && noise(x, y, seed) > threshold) {
        blend(png, x, y, [color[0], color[1], color[2], Math.round(color[3] * noise(y, x, seed + 3))]);
      }
    }
  }
}

function ellipse(png, cx, cy, rx, ry, color, rotation = 0) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y += 1) {
    for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      const d = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry);
      if (d <= 1) {
        const edge = Math.max(0.25, 1 - d);
        blend(png, x, y, [color[0], color[1], color[2], Math.round(color[3] * Math.min(1, edge * 2.8))]);
      }
    }
  }
}

function glow(png, cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d <= 1) blend(png, x, y, [color[0], color[1], color[2], Math.round(color[3] * (1 - d) * (1 - d))]);
    }
  }
}

function line(png, x1, y1, x2, y2, color, width = 2) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.5));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    ellipse(png, x, y, width, width, color);
  }
}

function polygon(png, points, color) {
  const minY = Math.floor(Math.min(...points.map((p) => p[1])));
  const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    for (let i = 0; i < points.length; i += 1) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 < y && y2 >= y) || (y2 < y && y1 >= y)) nodes.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    nodes.sort((a, b) => a - b);
    for (let i = 0; i < nodes.length; i += 2) {
      for (let x = Math.floor(nodes[i]); x <= Math.ceil(nodes[i + 1]); x += 1) blend(png, x, y, color);
    }
  }
}

function write(name, png, dir = shipDir) {
  fs.writeFileSync(path.join(dir, name), PNG.sync.write(png));
}

function skitterling() {
  const png = makePng(220, 150);
  glow(png, 110, 76, 62, rgba("9dff66", 55));
  ellipse(png, 110, 76, 56, 24, rgba("11180f", 245), -0.05);
  ellipse(png, 136, 70, 30, 17, rgba("d5f0c2", 170), -0.2);
  for (let i = 0; i < 8; i += 1) {
    const y = 48 + i * 11;
    line(png, 96, y, 48, y - 23 + i * 7, rgba("b8d2a9", 190), 1.7);
    line(png, 116, y, 172, y - 26 + i * 7, rgba("b8d2a9", 190), 1.7);
    ellipse(png, 43, y - 23 + i * 7, 3, 3, rgba("d5f0c2", 120));
    ellipse(png, 177, y - 26 + i * 7, 3, 3, rgba("d5f0c2", 120));
  }
  for (let i = 0; i < 7; i += 1) line(png, 78 + i * 10, 56, 84 + i * 10, 96, rgba("2b3a22", 170), 1);
  ellipse(png, 148, 69, 5, 4, rgba("f5ffe6", 230));
  ellipse(png, 149, 84, 4, 3, rgba("f5ffe6", 210));
  speckle(png, rgba("a8e693", 100), 0.9, 11);
  return png;
}

function graveSlime() {
  const png = makePng(240, 180);
  glow(png, 122, 92, 78, rgba("84f0ad", 75));
  ellipse(png, 116, 96, 70, 42, rgba("0f2518", 220));
  ellipse(png, 136, 78, 42, 31, rgba("3a6c4a", 150));
  ellipse(png, 76, 114, 28, 16, rgba("1e3d28", 180), 0.25);
  ellipse(png, 170, 112, 32, 18, rgba("10271b", 190), -0.2);
  ellipse(png, 100, 105, 19, 6, rgba("d9e1c7", 155), 0.35);
  ellipse(png, 142, 102, 10, 23, rgba("d9e1c7", 125), -0.45);
  for (const p of [[122, 79], [132, 92], [151, 80], [165, 94], [92, 98]]) {
    ellipse(png, p[0], p[1], 6, 5, rgba("dbff77", 185));
    ellipse(png, p[0] + 1, p[1], 2, 2, rgba("11180f", 220));
  }
  for (let i = 0; i < 11; i += 1) ellipse(png, 66 + i * 13, 128 + Math.sin(i) * 7, 4, 7, rgba("d9e1c7", 105), i * 0.4);
  speckle(png, rgba("84f0ad", 90), 0.88, 21);
  return png;
}

function gallopingCrud() {
  const png = makePng(300, 220);
  glow(png, 154, 112, 94, rgba("e0bc6d", 58));
  ellipse(png, 142, 118, 90, 53, rgba("2a2118", 235), 0.06);
  ellipse(png, 176, 95, 58, 40, rgba("5a4229", 210), -0.2);
  for (const p of [[92, 92], [134, 73], [176, 133], [213, 102], [116, 145], [158, 103], [199, 148]]) {
    polygon(png, [[p[0] - 17, p[1] - 9], [p[0] + 18, p[1] - 13], [p[0] + 14, p[1] + 12], [p[0] - 13, p[1] + 15]], rgba("9b8360", 180));
    line(png, p[0] - 13, p[1] - 8, p[0] + 13, p[1] + 9, rgba("2f261d", 150), 1.1);
  }
  for (let i = 0; i < 7; i += 1) line(png, 86 + i * 25, 158 + Math.sin(i) * 8, 70 + i * 28, 196, rgba("b98245", 180), 3);
  for (let i = 0; i < 8; i += 1) ellipse(png, 82 + i * 23, 80 + Math.sin(i * 2) * 18, 5, 8, rgba("e1d2b0", 130), i);
  ellipse(png, 219, 91, 8, 6, rgba("f1d181", 230));
  speckle(png, rgba("d6b56d", 85), 0.87, 31);
  return png;
}

function gloomTerror() {
  const png = makePng(250, 170);
  glow(png, 132, 86, 76, rgba("c47cff", 80));
  for (let i = 0; i < 16; i += 1) {
    ellipse(png, 72 + i * 7, 78 + Math.sin(i) * 20, 38 - i * 0.8, 22, rgba("0d0c0f", 105));
  }
  for (let i = 0; i < 7; i += 1) line(png, 130, 88, 74 + i * 22, 38 + Math.sin(i) * 55, rgba("2e213d", 90), 2);
  ellipse(png, 148, 86, 18, 13, rgba("2e213d", 210));
  ellipse(png, 154, 86, 6, 5, rgba("e2b7ff", 235));
  line(png, 162, 86, 215, 70, rgba("c47cff", 185), 2);
  speckle(png, rgba("c47cff", 95), 0.915, 42);
  return png;
}

function oculusHorror() {
  const png = makePng(230, 190);
  glow(png, 118, 94, 78, rgba("d37b73", 72));
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2;
    line(png, 118, 96, 118 + Math.cos(a) * (72 + noise(i, 2) * 18), 96 + Math.sin(a) * (48 + noise(i, 4) * 18), rgba("6f3d3a", 165), 2.2);
  }
  ellipse(png, 118, 94, 55, 41, rgba("4a2d2a", 235));
  ellipse(png, 130, 94, 31, 25, rgba("efd3b3", 230));
  for (let i = 0; i < 10; i += 1) line(png, 103 + i * 5, 75, 94 + i * 8, 58 + Math.sin(i) * 7, rgba("b45150", 125), 1);
  ellipse(png, 138, 95, 13, 13, rgba("1c120f", 245));
  ellipse(png, 142, 91, 4, 4, rgba("ffffff", 220));
  speckle(png, rgba("d37b73", 70), 0.91, 51);
  return png;
}

function seal() {
  const png = makePng(520, 520);
  const c = 260;
  glow(png, c, c, 190, rgba("b6ff78", 52));
  glow(png, c, c, 115, rgba("8dffd5", 62));
  for (let i = 0; i < 44; i += 1) {
    const a = noise(i, 1) * Math.PI * 2;
    const r = 92 + noise(i, 3) * 118;
    ellipse(png, c + Math.cos(a) * r, c + Math.sin(a) * r, 8 + noise(i, 4) * 16, 5 + noise(i, 5) * 14, rgba("2a2118", 105), a);
  }
  for (let r = 70; r <= 172; r += 28) {
    for (let a = 0; a < Math.PI * 2; a += 0.015) {
      const wobble = Math.sin(a * 7 + r) * 3;
      blend(png, c + Math.cos(a) * (r + wobble), c + Math.sin(a) * (r + wobble), rgba("6a5641", 205));
      if (a % 0.09 < 0.02) blend(png, c + Math.cos(a) * (r + 5), c + Math.sin(a) * (r + 5), rgba("b6ff78", 125));
    }
  }
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2;
    line(png, c + Math.cos(a) * 82, c + Math.sin(a) * 82, c + Math.cos(a) * 176, c + Math.sin(a) * 176, rgba("3d3329", 210), 4);
  }
  for (let i = 0; i < 26; i += 1) {
    const a = noise(i, 8) * Math.PI * 2;
    const r1 = 62 + noise(i, 9) * 140;
    const r2 = r1 + 26 + noise(i, 10) * 54;
    line(png, c + Math.cos(a) * r1, c + Math.sin(a) * r1, c + Math.cos(a + noise(i, 11) * 0.4 - 0.2) * r2, c + Math.sin(a + noise(i, 12) * 0.4 - 0.2) * r2, rgba("15120e", 145), 2);
  }
  for (let a = 0; a < Math.PI * 5.4; a += 0.016) {
    const r = 10 + a * 8.2;
    blend(png, c + Math.cos(a) * r, c + Math.sin(a) * r, rgba("8dffd5", 230));
    blend(png, c + Math.cos(a) * (r + 2), c + Math.sin(a) * (r + 2), rgba("b6ff78", 140));
  }
  ellipse(png, c, c, 42, 42, rgba("14190f", 210));
  glow(png, c, c, 58, rgba("b6ff78", 110));
  speckle(png, rgba("a1bf80", 62), 0.89, 61);
  return png;
}

function ward() {
  const png = makePng(180, 120);
  glow(png, 86, 60, 55, rgba("c47cff", 84));
  ellipse(png, 83, 60, 30, 21, rgba("0d0c0f", 225));
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2;
    line(png, 83, 60, 83 + Math.cos(a) * (46 + noise(i, 7) * 12), 60 + Math.sin(a) * (30 + noise(i, 8) * 9), rgba("8dffd5", 140), 1.7);
  }
  ellipse(png, 103, 60, 12, 9, rgba("b6ff78", 210));
  line(png, 111, 60, 160, 60, rgba("b6ff78", 165), 3);
  return png;
}

write("interceptor.png", skitterling());
write("raider.png", graveSlime());
write("dreadnought.png", gallopingCrud());
write("artillery.png", gloomTerror());
write("drone-leader.png", oculusHorror());
write("station.png", seal(), stationDir);
write("gun.png", ward(), stationDir);
write("slither-source.png", seal(), sourceDir);

console.log("Slither sprites generated.");

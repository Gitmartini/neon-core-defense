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

function outline(png, color = rgba("050604", 210)) {
  const source = Buffer.from(png.data);
  for (let y = 1; y < png.height - 1; y += 1) {
    for (let x = 1; x < png.width - 1; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (source[offset + 3] > 20) continue;
      let near = false;
      for (let yy = -2; yy <= 2; yy += 1) {
        for (let xx = -2; xx <= 2; xx += 1) {
          const ni = ((y + yy) * png.width + x + xx) * 4;
          if (source[ni + 3] > 80) near = true;
        }
      }
      if (near) blend(png, x, y, color);
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
  outline(png);
  fs.writeFileSync(path.join(dir, name), PNG.sync.write(png));
}

function skitterling() {
  const png = makePng(250, 170);
  glow(png, 124, 86, 62, rgba("9dff66", 34));
  ellipse(png, 116, 87, 72, 31, rgba("060b06", 255), -0.05);
  ellipse(png, 154, 79, 39, 21, rgba("b8d1a8", 205), -0.2);
  ellipse(png, 96, 96, 42, 17, rgba("2a3521", 220), 0.2);
  for (let i = 0; i < 10; i += 1) {
    const y = 48 + i * 11;
    const legAlpha = i % 2 === 0 ? 220 : 150;
    line(png, 100, y, 44, y - 22 + i * 7, rgba("bacfae", legAlpha), 1.8);
    line(png, 130, y, 202, y - 26 + i * 7, rgba("bacfae", legAlpha), 1.8);
    ellipse(png, 40, y - 22 + i * 7, 3, 3, rgba("d8e8ca", 120));
    ellipse(png, 206, y - 26 + i * 7, 3, 3, rgba("d8e8ca", 120));
  }
  for (let i = 0; i < 9; i += 1) line(png, 76 + i * 12, 60, 84 + i * 12, 108, rgba("414f32", 190), 1.3);
  for (const p of [[88, 78], [105, 66], [123, 70], [139, 91]]) {
    ellipse(png, p[0], p[1], 10, 7, rgba("526042", 185), noise(p[0], p[1]) * 0.9);
  }
  ellipse(png, 166, 77, 6, 5, rgba("f5ffe6", 245));
  ellipse(png, 167, 96, 5, 4, rgba("f5ffe6", 230));
  ellipse(png, 168, 78, 2, 2, rgba("050604", 240));
  ellipse(png, 168, 96, 2, 2, rgba("050604", 240));
  speckle(png, rgba("a8e693", 125), 0.86, 11);
  return png;
}

function graveSlime() {
  const png = makePng(270, 200);
  glow(png, 136, 104, 86, rgba("84f0ad", 58));
  ellipse(png, 126, 107, 82, 50, rgba("07150d", 240));
  ellipse(png, 152, 85, 50, 35, rgba("3a6c4a", 170));
  ellipse(png, 82, 128, 34, 18, rgba("1e3d28", 200), 0.25);
  ellipse(png, 196, 126, 40, 20, rgba("10271b", 210), -0.2);
  ellipse(png, 112, 116, 25, 7, rgba("d9e1c7", 170), 0.35);
  ellipse(png, 160, 114, 13, 27, rgba("d9e1c7", 145), -0.45);
  for (const p of [[122, 79], [132, 92], [151, 80], [165, 94], [92, 98]]) {
    ellipse(png, p[0], p[1], 6, 5, rgba("dbff77", 185));
    ellipse(png, p[0] + 1, p[1], 2, 2, rgba("11180f", 220));
  }
  for (let i = 0; i < 14; i += 1) ellipse(png, 70 + i * 14, 146 + Math.sin(i) * 8, 4, 8, rgba("d9e1c7", 130), i * 0.4);
  speckle(png, rgba("84f0ad", 125), 0.84, 21);
  return png;
}

function gallopingCrud() {
  const png = makePng(340, 240);
  glow(png, 176, 122, 92, rgba("e0bc6d", 34));
  ellipse(png, 156, 128, 112, 66, rgba("110d0a", 255), 0.06);
  ellipse(png, 207, 102, 70, 48, rgba("47331f", 240), -0.2);
  ellipse(png, 102, 116, 55, 42, rgba("281d14", 245), 0.3);
  ellipse(png, 170, 118, 80, 38, rgba("3a2b1d", 220), -0.15);
  for (const p of [[82, 93], [124, 76], [166, 137], [211, 104], [112, 149], [154, 105], [203, 151], [246, 122]]) {
    polygon(png, [[p[0] - 20, p[1] - 11], [p[0] + 20, p[1] - 14], [p[0] + 16, p[1] + 14], [p[0] - 15, p[1] + 16]], rgba("7f6d50", 170));
    line(png, p[0] - 14, p[1] - 9, p[0] + 14, p[1] + 10, rgba("211911", 165), 1.2);
  }
  for (let i = 0; i < 8; i += 1) line(png, 88 + i * 27, 174 + Math.sin(i) * 8, 74 + i * 30, 218, rgba("8a6238", 230), 4);
  for (let i = 0; i < 10; i += 1) ellipse(png, 74 + i * 23, 78 + Math.sin(i * 2) * 18, 5, 9, rgba("c7b992", 135), i);
  ellipse(png, 249, 96, 10, 8, rgba("f1d181", 240));
  ellipse(png, 252, 96, 3, 3, rgba("060604", 230));
  for (let i = 0; i < 9; i += 1) {
    line(png, 218 + i * 5, 122 + Math.sin(i) * 5, 230 + i * 6, 139 + Math.sin(i) * 7, rgba("d8ccb0", 150), 1.4);
  }
  speckle(png, rgba("d6b56d", 95), 0.86, 31);
  return png;
}

function gloomTerror() {
  const png = makePng(285, 200);
  glow(png, 150, 100, 86, rgba("c47cff", 70));
  for (let i = 0; i < 21; i += 1) {
    ellipse(png, 72 + i * 7, 92 + Math.sin(i) * 24, 46 - i * 0.75, 27, rgba("030304", 130));
  }
  for (let i = 0; i < 10; i += 1) line(png, 148, 103, 70 + i * 22, 42 + Math.sin(i) * 68, rgba("2e213d", 110), 2.4);
  ellipse(png, 166, 100, 23, 16, rgba("2e213d", 230));
  ellipse(png, 174, 100, 8, 6, rgba("e2b7ff", 245));
  line(png, 184, 100, 255, 80, rgba("c47cff", 205), 2.5);
  speckle(png, rgba("c47cff", 130), 0.88, 42);
  return png;
}

function oculusHorror() {
  const png = makePng(270, 220);
  glow(png, 136, 110, 88, rgba("d37b73", 60));
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2;
    line(png, 136, 110, 136 + Math.cos(a) * (86 + noise(i, 2) * 22), 110 + Math.sin(a) * (60 + noise(i, 4) * 22), rgba("6f3d3a", 185), 2.6);
  }
  ellipse(png, 136, 108, 66, 49, rgba("4a2d2a", 245));
  ellipse(png, 151, 108, 38, 29, rgba("efd3b3", 240));
  for (let i = 0; i < 13; i += 1) line(png, 112 + i * 6, 86, 94 + i * 10, 64 + Math.sin(i) * 10, rgba("b45150", 145), 1.2);
  ellipse(png, 161, 109, 16, 16, rgba("1c120f", 250));
  ellipse(png, 166, 103, 5, 5, rgba("ffffff", 230));
  speckle(png, rgba("d37b73", 100), 0.87, 51);
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

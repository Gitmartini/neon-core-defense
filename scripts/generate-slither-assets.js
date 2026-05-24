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
  ellipse(png, 112, 76, 52, 22, rgba("172019", 235), -0.05);
  ellipse(png, 136, 70, 24, 15, rgba("d5f0c2", 165), -0.2);
  for (let i = 0; i < 6; i += 1) {
    const y = 48 + i * 11;
    line(png, 104, y, 56, y - 20 + i * 8, rgba("b8d2a9", 190), 2);
    line(png, 116, y, 164, y - 24 + i * 8, rgba("b8d2a9", 190), 2);
  }
  ellipse(png, 148, 69, 5, 4, rgba("f5ffe6", 230));
  ellipse(png, 149, 84, 4, 3, rgba("f5ffe6", 210));
  return png;
}

function graveSlime() {
  const png = makePng(240, 180);
  glow(png, 122, 92, 78, rgba("84f0ad", 75));
  ellipse(png, 116, 96, 70, 42, rgba("0f2518", 220));
  ellipse(png, 136, 78, 42, 31, rgba("3a6c4a", 150));
  ellipse(png, 100, 105, 19, 6, rgba("d9e1c7", 155), 0.35);
  ellipse(png, 142, 102, 10, 23, rgba("d9e1c7", 125), -0.45);
  ellipse(png, 151, 80, 7, 5, rgba("dbff77", 220));
  ellipse(png, 165, 94, 5, 4, rgba("dbff77", 190));
  return png;
}

function gallopingCrud() {
  const png = makePng(300, 220);
  glow(png, 154, 112, 94, rgba("e0bc6d", 58));
  ellipse(png, 142, 118, 90, 53, rgba("2a2118", 235), 0.06);
  ellipse(png, 176, 95, 58, 40, rgba("5a4229", 210), -0.2);
  for (const p of [[92, 92], [134, 73], [176, 133], [213, 102], [116, 145]]) {
    polygon(png, [[p[0] - 17, p[1] - 9], [p[0] + 18, p[1] - 13], [p[0] + 14, p[1] + 12], [p[0] - 13, p[1] + 15]], rgba("9b8360", 180));
  }
  for (let i = 0; i < 5; i += 1) line(png, 100 + i * 28, 160, 86 + i * 30, 188, rgba("b98245", 180), 3);
  ellipse(png, 219, 91, 8, 6, rgba("f1d181", 230));
  return png;
}

function gloomTerror() {
  const png = makePng(250, 170);
  glow(png, 132, 86, 76, rgba("c47cff", 80));
  for (let i = 0; i < 11; i += 1) {
    ellipse(png, 88 + i * 8, 78 + Math.sin(i) * 18, 34 - i, 22, rgba("141018", 118));
  }
  ellipse(png, 148, 86, 18, 13, rgba("2e213d", 210));
  ellipse(png, 154, 86, 6, 5, rgba("e2b7ff", 235));
  line(png, 162, 86, 215, 70, rgba("c47cff", 150), 2);
  return png;
}

function oculusHorror() {
  const png = makePng(230, 190);
  glow(png, 118, 94, 78, rgba("d37b73", 72));
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    line(png, 118, 96, 118 + Math.cos(a) * 76, 96 + Math.sin(a) * 54, rgba("6f3d3a", 165), 3);
  }
  ellipse(png, 118, 94, 55, 41, rgba("4a2d2a", 235));
  ellipse(png, 130, 94, 31, 25, rgba("efd3b3", 230));
  ellipse(png, 138, 95, 13, 13, rgba("1c120f", 245));
  ellipse(png, 142, 91, 4, 4, rgba("ffffff", 220));
  return png;
}

function seal() {
  const png = makePng(520, 520);
  const c = 260;
  glow(png, c, c, 190, rgba("b6ff78", 52));
  glow(png, c, c, 115, rgba("8dffd5", 62));
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
  for (let a = 0; a < Math.PI * 5.4; a += 0.016) {
    const r = 10 + a * 8.2;
    blend(png, c + Math.cos(a) * r, c + Math.sin(a) * r, rgba("8dffd5", 230));
    blend(png, c + Math.cos(a) * (r + 2), c + Math.sin(a) * (r + 2), rgba("b6ff78", 140));
  }
  ellipse(png, c, c, 42, 42, rgba("14190f", 210));
  glow(png, c, c, 58, rgba("b6ff78", 110));
  return png;
}

function ward() {
  const png = makePng(180, 120);
  glow(png, 86, 60, 55, rgba("c47cff", 84));
  ellipse(png, 83, 60, 27, 19, rgba("141018", 220));
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    line(png, 83, 60, 83 + Math.cos(a) * 47, 60 + Math.sin(a) * 30, rgba("8dffd5", 150), 2);
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

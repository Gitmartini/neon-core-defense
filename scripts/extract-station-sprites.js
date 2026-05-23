const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/extract-station-sprites.js <station-sheet.png>");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets", "station");
const sourceDir = path.join(root, "assets", "source");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(sourceDir, { recursive: true });

const sheet = PNG.sync.read(fs.readFileSync(sourcePath));
fs.copyFileSync(sourcePath, path.join(sourceDir, "station-sheet-source.png"));

function offset(png, x, y) {
  return (png.width * y + x) * 4;
}

function isGreenKey(r, g, b, a) {
  return a > 10 && g > 150 && r < 80 && b < 100 && g > r * 2.2 && g > b * 1.8;
}

function isSubject(png, x, y) {
  const i = offset(png, x, y);
  return !isGreenKey(png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]);
}

function cropPng(source, x, y, width, height) {
  const out = new PNG({ width, height });
  for (let row = 0; row < height; row += 1) {
    const sourceStart = offset(source, x, y + row);
    const outStart = offset(out, 0, row);
    source.data.copy(out.data, outStart, sourceStart, sourceStart + width * 4);
  }
  return out;
}

function removeGreenKey(png) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = offset(png, x, y);
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      const a = png.data[i + 3];
      if (isGreenKey(r, g, b, a)) {
        png.data[i + 3] = 0;
      }
    }
  }
}

function boundsForRegion(minX, maxX, padding = 12) {
  let minY = sheet.height;
  let maxY = -1;
  let foundMinX = sheet.width;
  let foundMaxX = -1;

  for (let y = 0; y < sheet.height; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (isSubject(sheet, x, y)) {
        foundMinX = Math.min(foundMinX, x);
        foundMaxX = Math.max(foundMaxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  foundMinX = Math.max(0, foundMinX - padding);
  minY = Math.max(0, minY - padding);
  foundMaxX = Math.min(sheet.width - 1, foundMaxX + padding);
  maxY = Math.min(sheet.height - 1, maxY + padding);

  return {
    x: foundMinX,
    y: minY,
    width: foundMaxX - foundMinX + 1,
    height: maxY - minY + 1
  };
}

const regions = {
  station: boundsForRegion(0, Math.floor(sheet.width * 0.68), 16),
  gun: boundsForRegion(Math.floor(sheet.width * 0.68), sheet.width - 1, 16)
};

for (const [name, bounds] of Object.entries(regions)) {
  const crop = cropPng(sheet, bounds.x, bounds.y, bounds.width, bounds.height);
  removeGreenKey(crop);
  fs.writeFileSync(path.join(outDir, `${name}.png`), PNG.sync.write(crop));
  console.log(`${name}: ${crop.width}x${crop.height}`);
}

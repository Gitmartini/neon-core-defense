const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/extract-ship-sprites.js <ship-sheet.png>");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets", "ships");
const sourceDir = path.join(root, "assets", "source");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(sourceDir, { recursive: true });

const sheet = PNG.sync.read(fs.readFileSync(sourcePath));
fs.copyFileSync(sourcePath, path.join(sourceDir, "ship-sheet-source.png"));

const sprites = [
  { name: "interceptor", x: 48, y: 258, width: 235, height: 150 },
  { name: "raider", x: 315, y: 175, width: 365, height: 410 },
  { name: "dreadnought", x: 688, y: 158, width: 500, height: 440 },
  { name: "artillery", x: 1200, y: 225, width: 470, height: 285 },
  { name: "drone-leader", x: 1670, y: 250, width: 275, height: 230 }
];

function pixelOffset(png, x, y) {
  return (png.width * y + x) * 4;
}

function isBackgroundLike(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const blueGrid = b > r + 12 && b > g - 4 && max < 92;
  const darkBackdrop = max < 54 && b >= r && g >= r - 8;
  const faintGrid = max < 75 && max - min < 34 && b >= r + 2;
  return darkBackdrop || blueGrid || faintGrid;
}

function removeConnectedBackdrop(crop) {
  const seen = new Uint8Array(crop.width * crop.height);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= crop.width || y >= crop.height) return;
    const index = y * crop.width + x;
    if (seen[index]) return;
    const offset = pixelOffset(crop, x, y);
    if (!isBackgroundLike(crop.data[offset], crop.data[offset + 1], crop.data[offset + 2], crop.data[offset + 3])) return;
    seen[index] = 1;
    queue.push([x, y]);
  }

  for (let x = 0; x < crop.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, crop.height - 1);
  }
  for (let y = 0; y < crop.height; y += 1) {
    enqueue(0, y);
    enqueue(crop.width - 1, y);
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    const offset = pixelOffset(crop, x, y);
    crop.data[offset + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const offset = pixelOffset(crop, x, y);
      const r = crop.data[offset];
      const g = crop.data[offset + 1];
      const b = crop.data[offset + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const dimBlueGrid = max < 88 && b >= r + 4 && g >= r - 10;
      const dimNeutralBackdrop = max < 46 && max - min < 28;
      if (dimBlueGrid || dimNeutralBackdrop) {
        crop.data[offset + 3] = 0;
      }
    }
  }
}

function trimTransparent(png, padding = 8) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[pixelOffset(png, x, y) + 3] > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < 0) return png;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(png.width - 1, maxX + padding);
  maxY = Math.min(png.height - 1, maxY + padding);

  return cropPng(png, minX, minY, maxX - minX + 1, maxY - minY + 1);
}

function cropPng(source, x, y, width, height) {
  const out = new PNG({ width, height });
  for (let row = 0; row < height; row += 1) {
    const sourceStart = pixelOffset(source, x, y + row);
    const outStart = pixelOffset(out, 0, row);
    source.data.copy(out.data, outStart, sourceStart, sourceStart + width * 4);
  }
  return out;
}

for (const sprite of sprites) {
  const crop = cropPng(sheet, sprite.x, sprite.y, sprite.width, sprite.height);
  removeConnectedBackdrop(crop);
  const trimmed = trimTransparent(crop);
  const outPath = path.join(outDir, `${sprite.name}.png`);
  fs.writeFileSync(outPath, PNG.sync.write(trimmed));
  console.log(`${sprite.name}: ${trimmed.width}x${trimmed.height}`);
}

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "screenshot-phone-preview.png");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

function serveFile(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.join(root, decodeURIComponent(requestPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  });
}

async function main() {
  const server = http.createServer(serveFile);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load" });
    const beginButton = page.getByRole("button", { name: "Begin" });
    if (await beginButton.isVisible()) {
      await beginButton.click();
    }
    await page.getByRole("button", { name: "Start Defense" }).click();
    await page.waitForTimeout(4500);
    await page.screenshot({ path: outputPath });
    console.log(outputPath);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

async function build() {
  console.log("Starting build...");

  // Ensure dist directories
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  // Copy manifest and popup static files
  copyFile("src/manifest.json", "dist/manifest.json");
  copyFile("src/popup/index.html", "dist/popup/index.html");
  copyFile("src/popup/popup.css", "dist/popup/popup.css");

  // Bundle entry points with esbuild
  const entryPoints = [
    { in: "src/popup/popup.ts", out: "popup/popup" },
    { in: "src/content/quizizz.ts", out: "content/quizizz" },
    { in: "src/content/crawler.ts", out: "content/crawler" },
    { in: "src/background/service-worker.ts", out: "background/service-worker" },
  ];

  await esbuild.build({
    entryPoints: entryPoints.map((e) => ({ in: e.in, out: e.out })),
    outdir: "dist",
    bundle: true,
    minify: false,
    sourcemap: true,
    target: ["chrome100"],
    format: "iife",
    logLevel: "info",
  });

  console.log("Build completed successfully!");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

// File: electron/prepare-package.js

const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} PathConfig
 * @property {string} rootDir - Root directory of the project
 * @property {string} standaloneDir - Standalone output directory
 * @property {string} staticSource - Source directory for static files
 * @property {string} staticDest - Destination directory for static files
 * @property {string} publicSource - Source directory for public files
 * @property {string} publicDest - Destination directory for public files
 */

console.log("[Prepare] Preparing standalone package for Electron...\n");

const rootDir = path.join(__dirname, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");

// Ensure Next.js standalone output includes installed packages and server (fail early if not)
const standaloneNodeModules = path.join(standaloneDir, "node_modules");
const standaloneServerJs = path.join(standaloneDir, "server.js");
if (!fs.existsSync(standaloneNodeModules) || !fs.existsSync(standaloneServerJs)) {
  console.error("[Prepare] ERROR: .next/standalone is incomplete. Required: node_modules and server.js.");
  console.error("[Prepare] Run 'next build' with ELECTRON_BUILD=true first. Standalone dir:", standaloneDir);
  process.exit(1);
}
console.log("[Prepare] Verified .next/standalone has node_modules and server.js\n");
const staticSource = path.join(rootDir, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSource = path.join(rootDir, "public");
const publicDest = path.join(standaloneDir, "public");
const certsSource = path.join(rootDir, "certs");
const certsDest = path.join(standaloneDir, "certs");

/**
 * Helper function to copy directory recursively
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 * @returns {void}
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[Prepare] Warning: Source directory not found: ${src}`);
    return;
  }

    fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
    console.log("[Prepare] Copying .next/static...");
  copyDir(staticSource, staticDest);
  console.log("[Prepare] ✓ Static files copied");

    console.log("[Prepare] Copying public...");
  copyDir(publicSource, publicDest);
  console.log("[Prepare] ✓ Public files copied");

    console.log("[Prepare] Generating database CA certificate...");
  const caCertPath = path.join(rootDir, "certs", "ca.pem");

  if (process.env.DB_SSL_CA) {
        fs.mkdirSync(path.join(rootDir, "certs"), { recursive: true });

        fs.writeFileSync(caCertPath, process.env.DB_SSL_CA);
    console.log("[Prepare] ✓ Generated ca.pem from DB_SSL_CA environment variable");
  } else if (!fs.existsSync(caCertPath)) {
    console.warn("[Prepare] ⚠️  Warning: DB_SSL_CA not set and certs/ca.pem doesn't exist");
    console.warn("[Prepare] ⚠️  Database SSL connections may fail in packaged app");
  } else {
    console.log("[Prepare] ✓ Using existing certs/ca.pem");
  }

    console.log("[Prepare] Copying certs to standalone directory...");
  copyDir(certsSource, certsDest);
  console.log("[Prepare] ✓ Certificate files copied to standalone");

    const envLocalSource = path.join(rootDir, ".env.local");
  const envLocalDest = path.join(standaloneDir, ".env.local");

  if (fs.existsSync(envLocalSource)) {
    console.log("[Prepare] Copying .env.local...");
    fs.copyFileSync(envLocalSource, envLocalDest);
    console.log("[Prepare] ✓ Environment configuration copied");
  } else {
    console.warn("[Prepare] ⚠️  Warning: .env.local not found - packaged app will use system environment variables");
  }

  if (process.env.ELECTRON_DEV_TOOLS === "true") {
    console.log("[Prepare] Adding dev tools flag to .env.local...");
    const envContent = fs.readFileSync(envLocalDest, "utf8");
    if (!envContent.includes("ELECTRON_DEV_TOOLS=true")) {
      fs.appendFileSync(envLocalDest, "ELECTRON_DEV_TOOLS=true\n");
      console.log("[Prepare] ✓ Added ELECTRON_DEV_TOOLS=true");
    } else {
      console.log("[Prepare] ✓ ELECTRON_DEV_TOOLS already present");
    }
  }

  console.log("\n[Prepare] Package preparation complete!\n");
} catch (error) {
  console.error("[Prepare] Error preparing package:", error);
  process.exit(1);
}

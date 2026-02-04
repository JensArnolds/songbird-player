const fs = require("fs");
const path = require("path");

/**
 * electron-builder afterPack hook.
 *
 * Ensures Next.js standalone output is shipped exactly as emitted by Next,
 * including `.next/standalone/node_modules`, which electron-builder may
 * otherwise exclude when copying `extraResources`.
 *
 * @param {import("electron-builder").AfterPackContext} context
 */
module.exports = async function afterPack(context) {
  const projectDir = context?.packager?.info?.projectDir;
  const appOutDir = context?.appOutDir;

  if (!projectDir || !appOutDir) return;

  const srcStandalone = path.join(projectDir, ".next", "standalone");
  const destStandalone = path.join(appOutDir, "resources", ".next", "standalone");

  if (!fs.existsSync(srcStandalone)) {
    // eslint-disable-next-line no-console
    console.warn("[afterPack] Next standalone output missing:", srcStandalone);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("[afterPack] Copying Next standalone output to:", destStandalone);

  fs.rmSync(destStandalone, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destStandalone), { recursive: true });
  fs.cpSync(srcStandalone, destStandalone, { recursive: true, dereference: true });
};


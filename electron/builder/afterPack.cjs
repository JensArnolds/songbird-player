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
  // Ship standalone next to the app (extraFiles) so NSIS installer includes it
  // including node_modules. extraResources can omit files in the installed app.
  const destStandalone = path.join(appOutDir, ".next", "standalone");

  if (!fs.existsSync(srcStandalone)) {
     
    console.warn("[afterPack] Next standalone output missing:", srcStandalone);
    return;
  }

   
  console.log("[afterPack] Copying Next standalone output to:", destStandalone);

  fs.rmSync(destStandalone, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destStandalone), { recursive: true });
  fs.cpSync(srcStandalone, destStandalone, { recursive: true, dereference: true });

  // Ensure installed packages (standalone node_modules) and server are delivered in the built app
  const destNodeModules = path.join(destStandalone, "node_modules");
  const destServerJs = path.join(destStandalone, "server.js");
  const missing = [];
  if (!fs.existsSync(destNodeModules)) missing.push("node_modules");
  if (!fs.existsSync(destServerJs)) missing.push("server.js");
  if (missing.length > 0) {
    const msg = `[afterPack] Packaged app missing required standalone files: ${missing.join(", ")}. Installer would be broken.`;
     
    console.error(msg);
    throw new Error(msg);
  }
   
  console.log("[afterPack] Verified standalone node_modules and server.js are present in packaged app.");

  // Ensure bundled Node.js runtime is present so the installed app can run the server without system Node
  const resourcesNode = path.join(appOutDir, "resources", "node");
  const nodeBinary = path.join(
    resourcesNode,
    process.platform === "win32" ? "node.exe" : "bin/node",
  );
  if (!fs.existsSync(nodeBinary)) {
    const msg = `[afterPack] Bundled Node.js not found at ${nodeBinary}. Run "npm run electron:download-node" before building.`;
     
    console.error(msg);
    throw new Error(msg);
  }
   
  console.log("[afterPack] Verified bundled Node.js runtime is present in packaged app.");
};


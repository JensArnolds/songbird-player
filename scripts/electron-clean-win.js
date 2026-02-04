#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

if (!fs.existsSync(distDir)) {
  process.exit(0);
  return;
}

try {
  fs.rmSync(distDir, { recursive: true, force: true });
} catch (err) {
  const code = err?.code ?? "";
  const msg = err?.message ?? String(err);
  console.error("");
  console.error("electron-clean:win: Could not remove dist/");
  console.error("  " + (code ? code + ": " : "") + msg);
  console.error("");
  console.error("Close Starchild (Starchild.exe) and any process using dist\\win-unpacked");
  console.error("(e.g. Task Manager, Explorer, or a terminal in that folder), then run:");
  console.error("  npm run electron:build:win");
  console.error("");
  process.exit(1);
}

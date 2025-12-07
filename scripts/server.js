#!/usr/bin/env node
/**
 * Custom Next.js server wrapper
 * Provides centralized logging and startup configuration with chalk
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// ENVIRONMENT LOADING
// ============================================
// Load .env first (base config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment-specific file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.development') });
} else if (nodeEnv === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
}

// Load .env.local last (overrides everything, never commit this file)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================
// CONFIGURATION
// ============================================
const isDev = nodeEnv === 'development';
const port = process.env.PORT || (isDev ? 3412 : 3222);
const hostname = process.env.HOSTNAME || 'localhost';

// ============================================
// CENTRALIZED LOGGING
// ============================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function log(message, color = colors.cyan) {
  const timestamp = new Date().toISOString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// ============================================
// STARTUP BANNER
// ============================================
function printStartupBanner() {
  logSection('🎵 Starchild Music Frontend Server');

  log(`Environment:     ${colors.bright}${nodeEnv}${colors.reset}`, colors.green);
  log(`Port:            ${colors.bright}${port}${colors.reset}`, colors.green);
  log(`Hostname:        ${colors.bright}${hostname}${colors.reset}`, colors.green);
  log(`Mode:            ${colors.bright}${isDev ? 'Development (Turbo)' : 'Production'}${colors.reset}`, colors.green);
  log(`Process ID:      ${colors.bright}${process.pid}${colors.reset}`, colors.green);
  log(`Node Version:    ${colors.bright}${process.version}${colors.reset}`, colors.green);

  if (isDev) {
    log(`\n${colors.yellow}⚡ Running in development mode with Turbopack${colors.reset}`);
  }

  console.log('');
}

// ============================================
// START SERVER
// ============================================
function startServer() {
  printStartupBanner();

  const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
  const command = isDev ? 'dev' : 'start';
  const args = [
    nextBin,
    command,
    '--port', port.toString(),
    '--hostname', hostname,
  ];

  // Add turbo flag only in development
  if (isDev) {
    args.push('--turbo');
  }

  log(`Starting Next.js server...`, colors.blue);
  log(`Command: node ${args.join(' ')}`, colors.dim);

  const serverProcess = spawn('node', args, {
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      PORT: port.toString(),
      HOSTNAME: hostname,
    },
    stdio: 'inherit',
  });

  serverProcess.on('error', (error) => {
    console.error(`\n${colors.red}❌ Server Error:${colors.reset}`, error);
    process.exit(1);
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`\n${colors.red}❌ Server exited with code ${code}${colors.reset}`);
      if (signal) {
        console.error(`${colors.red}   Signal: ${signal}${colors.reset}`);
      }
      process.exit(code || 1);
    } else {
      log(`Server stopped gracefully`, colors.green);
      process.exit(0);
    }
  });

  // Handle graceful shutdown
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      log(`\nReceived ${signal}, shutting down gracefully...`, colors.yellow);
      const singalInt = parseInt(signal === 'SIGINT' ? '2' : signal === 'SIGTERM' ? '15' : '12', 10);
      serverProcess.kill(singalInt);
    });
  });

  // Log when server is ready (capture Next.js output)
  // Note: Next.js will still print its own messages
  setTimeout(() => {
    logSection('🚀 Server Ready');
    log(`Local:           ${colors.bright}${colors.green}http://${hostname}:${port}${colors.reset}`, colors.green);
    log(`Network:         ${colors.bright}Use --hostname 0.0.0.0 to expose${colors.reset}`, colors.dim);

    if (isDev) {
      log(`\n${colors.cyan}Ready for changes. Press Ctrl+C to stop.${colors.reset}`);
    }
    console.log('');
  }, 2000);
}

// ============================================
// RUN
// ============================================
try {
  startServer();
} catch (error) {
  console.error(`\n${colors.red}❌ Failed to start server:${colors.reset}`, error);
  process.exit(1);
}

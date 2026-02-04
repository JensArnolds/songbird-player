const path = require("path");
const fs = require("fs");

const bufferedLogLines = [];

const formatLogArg = (arg) => {
  if (arg instanceof Error) return arg.stack || arg.message;
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean" || arg == null) {
    return String(arg);
  }
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
};

/**
 * Log before the file logger is initialized. Buffers output for later flush.
 * @param  {...any} args
 */
const bootLog = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(formatLogArg).join(" ");
  bufferedLogLines.push(`[${timestamp}] [Electron] ${message}`);
  try {
    console.log("[Electron]", ...args);
  } catch {
        }
};

try {
  const dotenv = require("dotenv");

  const candidateEnvPaths = [
    process.env.STARCHILD_ENV_FILE,
    path.join(path.dirname(process.execPath), ".env.local"),
    path.join(process.cwd(), ".env.local"),
    process.resourcesPath
      ? path.join(process.resourcesPath, ".next", "standalone", ".env.local")
      : undefined,
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.next/standalone/.env.local"),
  ].filter(Boolean);

  let loaded = false;
  for (const envPath of candidateEnvPaths) {
    if (envPath && fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      bootLog("Loaded env from:", envPath);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    bootLog("No .env.local found - using system environment variables");
  }
} catch (err) {
  bootLog("dotenv not available (using system environment variables)", err);
}

bootLog("Environment check:");
bootLog("  NODE_ENV:", process.env.NODE_ENV || "not set");
bootLog("  PORT:", process.env.PORT || "not set");
bootLog(
  "  AUTH_SECRET:",
  process.env.AUTH_SECRET
    ? "✓ set (" + process.env.AUTH_SECRET.length + " chars)"
    : "✗ MISSING",
);
bootLog(
  "  AUTH_DISCORD_ID:",
  process.env.AUTH_DISCORD_ID ? "✓ set" : "✗ MISSING",
);
bootLog(
  "  AUTH_DISCORD_SECRET:",
  process.env.AUTH_DISCORD_SECRET ? "✓ set" : "✗ MISSING",
);
bootLog("  DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ MISSING");
bootLog(
  "  NEXTAUTH_URL:",
  process.env.NEXTAUTH_URL || "not set (using default)",
);

const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  dialog,
  screen,
  session,
  shell,
} = require("electron");
const { spawn } = require("child_process");
const http = require("http");

const isDev = !app.isPackaged && process.env.ELECTRON_PROD !== "true";
const enableDevTools = isDev || process.env.ELECTRON_DEV_TOOLS === "true";
const port = parseInt(process.env.PORT || "3222", 10);

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;

const windowStateFile = path.join(app.getPath("userData"), "window-state.json");

const logDir = path.join(app.getPath("userData"), "logs");
const logFile = path.join(logDir, "electron-main.log");

const appendLogLine = (line) => {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, `${line}\n`, "utf8");
  } catch {
        }
};

for (const line of bufferedLogLines) {
  appendLogLine(line);
}
bufferedLogLines.length = 0;

/**
 * @param {...any} args
 */
const log = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(formatLogArg).join(" ");
  appendLogLine(`[${timestamp}] [Electron] ${message}`);
  console.log("[Electron]", ...args);
};

const getIconPath = () => {
  const candidates = [
    app.isPackaged
      ? path.join(app.getAppPath(), ".next", "standalone", "public", "icon.png")
      : undefined,
    process.resourcesPath
      ? path.join(
          process.resourcesPath,
          ".next",
          "standalone",
          "public",
          "icon.png",
        )
      : undefined,
    path.join(__dirname, "..", "public", "icon.png"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  return undefined;
};

/**
 * Ensure the restored window bounds are on a visible display.
 * If the window would be off-screen (e.g. monitor removed), reset position.
 * @param {{width: number, height: number, x?: number, y?: number, isMaximized: boolean}} state
 */
const ensureWindowStateIsVisible = (state) => {
  if (typeof state.x !== "number" || typeof state.y !== "number") return state;

  try {
    const bounds = {
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
    };

    const isVisible = screen.getAllDisplays().some((display) => {
      const wa = display.workArea;
      return (
        bounds.x < wa.x + wa.width &&
        bounds.x + bounds.width > wa.x &&
        bounds.y < wa.y + wa.height &&
        bounds.y + bounds.height > wa.y
      );
    });

    if (isVisible) return state;
  } catch (err) {
    log("Failed to validate window bounds:", err);
    return state;
  }

  log("Window state was off-screen; resetting position");
  return {
    width: state.width,
    height: state.height,
    isMaximized: false,
  };
};

/**
 * Load saved window state
 * @returns {{width: number, height: number, x?: number, y?: number, isMaximized: boolean}}
 */
const loadWindowState = () => {
  try {
    if (fs.existsSync(windowStateFile)) {
      const data = fs.readFileSync(windowStateFile, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    log("Failed to load window state:", err);
  }

    return {
    width: 1200,
    height: 800,
    isMaximized: false,
  };
};

/**
 * Save current window state
 * @param {BrowserWindow} window
 */
const saveWindowState = (window) => {
  try {
    const bounds = window.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized(),
    };
    fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2));
    log("Window state saved");
  } catch (err) {
    log("Failed to save window state:", err);
  }
};

/**
 * @param {number} startPort
 * @returns {Promise<number>}
 */
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const address = server.address();
      const port =
        typeof address === "object" && address !== null
          ? address.port
          : startPort;
      server.close(() => {
        log(`Found available port: ${port}`);
        resolve(port);
      });
    });
    server.on("error", () => {
      log(`Port ${startPort} in use, trying ${startPort + 1}`);
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

/**
 * @param {number} port
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
const waitForServer = (port, maxAttempts = 30) => {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkServer = () => {
      log(
        `Checking server on port ${port} (attempt ${attempts + 1}/${maxAttempts})`,
      );
      http
        .get(`http://localhost:${port}`, (/** @type {import('http').IncomingMessage} */ res) => {
          log(`Server responded with status: ${res.statusCode}`);
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve(true);
          } else {
            retry();
          }
        })
        .on(
          "error",
          /**
           * @param {Error} err
           */
          (err) => {
            log(`Server check error: ${err?.message ?? String(err)}`);
            retry();
          },
        );
    };

    const retry = () => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkServer, 1000);
      } else {
        log("Server failed to start after max attempts");
        resolve(false);
      }
    };

    checkServer();
  });
};

const startServer = async () => {
  const serverPort = await findAvailablePort(port);

  // When packaged, standalone lives next to the exe (extraFiles) so NSIS installer
  // includes it; resources/.next/standalone can omit node_modules in installed app.
  const standaloneDir = app.isPackaged
    ? path.join(app.getAppPath(), ".next", "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  const serverPath = path.join(standaloneDir, "server.js");

  log("Paths:");
  log("  Standalone dir:", standaloneDir);
  log("  Server:", serverPath);
  log("  isPackaged:", app.isPackaged);

  if (!fs.existsSync(serverPath)) {
    const error = `Server file not found: ${serverPath}`;
    log("ERROR:", error);
    dialog.showErrorBox("Server Error", error);
    throw new Error(error);
  }

  log("Server file exists, starting...");

  let nodeExecutable = "node";

  if (app.isPackaged) {

    const bundledNodePath = path.join(process.resourcesPath, "node", "node.exe");

    if (fs.existsSync(bundledNodePath)) {
      nodeExecutable = bundledNodePath;
      log("Using bundled Node.js:", bundledNodePath);
    } else {
            try {
        require("child_process").execSync("node --version", { stdio: "ignore" });
        log("Using system Node.js from PATH");
      } catch (err) {
        const error = "Node.js not found. Please install Node.js from https://nodejs.org/";
        log("ERROR:", error);
        dialog.showErrorBox(
          "Node.js Required",
          "This application requires Node.js to be installed.\n\nPlease download and install Node.js from:\nhttps://nodejs.org/\n\nThen restart the application."
        );
        throw new Error(error);
      }
    }
  } else {
    log("Using Node.js from development environment");
  }

  return new Promise((resolve, reject) => {
    const standaloneNodeModules = path.join(standaloneDir, "node_modules");
    /** @type {import('child_process').ChildProcess | null} */
    serverProcess = spawn(nodeExecutable, [serverPath], {
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        HOSTNAME: "localhost",
        NODE_ENV: "production",
        ELECTRON_BUILD: "true",
        NODE_PATH: standaloneNodeModules,
      },
      /** @type {string} */
      cwd: standaloneDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProcess?.stdout?.on("data", (data) => {
      log("[Server STDOUT]:", data.toString().trim());
    });

    serverProcess?.stderr?.on("data", (data) => {
      log("[Server STDERR]:", data.toString().trim());
    });

    serverProcess?.on("error", (/** @type {Error} */ err) => {
      log("[Server ERROR]:", err);
      reject(err);
    });

    serverProcess?.on("exit", (code, signal) => {
      log(`[Server EXIT] Code: ${code}, Signal: ${signal}`);
    });

    waitForServer(serverPort).then((ready) => {
      if (ready) {
        log(`Server started successfully on port ${serverPort}`);
        resolve(serverPort);
      } else {
        const error = "Server failed to respond after 30 seconds";
        log("ERROR:", error);
        reject(new Error(error));
      }
    });
  });
};

const createWindow = async () => {
  log("Creating window...");
  log(`Mode: ${isDev ? "Development" : "Production"}`);
  log(`Packaged: ${app.isPackaged}`);
  log(`ELECTRON_PROD: ${process.env.ELECTRON_PROD}`);
  log(`Dev Tools Enabled: ${enableDevTools}`);
  let serverUrl = "";

  if (isDev) {
    log("Development mode - connecting to dev server");
    serverUrl = `http://localhost:${port}`;
  } else {
    log("Production mode - starting bundled server");
    try {
      const serverPort = await startServer();
      serverUrl = `http://localhost:${serverPort}`;
      log(`Will load URL: ${serverUrl}`);
    } catch (err) {
      log("FATAL ERROR starting server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      dialog.showErrorBox(
        "Server Start Failed",
        `Failed to start the application server:\n\n${errorMessage}\n\nCheck the console for details.`,
      );
      app.quit();
      return;
    }
  }

    const windowState = ensureWindowStateIsVisible(loadWindowState());

  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: enableDevTools,
            partition: "persist:darkfloor-art",
    },
    ...(iconPath ? { icon: iconPath } : {}),
    backgroundColor: "#000000",
    show: false,
  });

    if (windowState.isMaximized) {
    mainWindow.maximize();
  }

    mainWindow.on("resize", () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("move", () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("maximize", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(
    /**
     * @param {import('electron').HandlerDetails} details
     */
    ({ url }) => {
      log("Window open handler triggered for URL:", url);

    if (url.includes("discord.com/oauth2") || url.includes("discord.com/api/oauth2")) {
      log("Opening Discord OAuth in same window");
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        },
      };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on(
    "will-navigate",
    /**
     * @param {import('electron').Event} event
     * @param {string} url
     */
    (event, url) => {
      log("Navigation requested to:", url);

      const parsedUrl = new URL(url);
      const appUrl = new URL(serverUrl);

      if (parsedUrl.origin === appUrl.origin) {
        log("Allowing same-origin navigation");
        return;
      }

      if (url.includes("discord.com/oauth2") || url.includes("discord.com/api/oauth2")) {
        log("Allowing Discord OAuth navigation");
        return;
      }

      log("Preventing navigation to external site, opening in browser instead");
      event.preventDefault();
      shell.openExternal(url);
    });

  mainWindow.webContents.on("did-navigate", (
    /** @type {import('electron').Event} */ _event,
    /** @type {string} */ url,
  ) => {
    log("Navigated to:", url);
  });

  mainWindow.webContents.on("did-start-loading", () => {
    log("Page started loading");
  });

  mainWindow.webContents.on("did-finish-load", () => {
    log("Page finished loading");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    /**
     * @param {import('electron').Event} event
     * @param {number} errorCode
     * @param {string} errorDescription
     */
    (event, errorCode, errorDescription) => {
      log("Page failed to load:", errorCode, errorDescription);
    },
  );

  mainWindow.once("ready-to-show", () => {
    log("Window ready to show");
    mainWindow?.show();
    if (enableDevTools) {
      mainWindow?.webContents.openDevTools();
    }
  });

  log(`Loading URL: ${serverUrl}`);
  mainWindow.loadURL(serverUrl);

  mainWindow.on("close", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("closed", () => {
    log("Window closed");
    mainWindow = null;
  });

  registerMediaKeys();
};

const registerMediaKeys = () => {
  try {
    globalShortcut.register("MediaPlayPause", () => {
      mainWindow?.webContents.send("media-key", "play-pause");
    });

    globalShortcut.register("MediaNextTrack", () => {
      mainWindow?.webContents.send("media-key", "next");
    });

    globalShortcut.register("MediaPreviousTrack", () => {
      mainWindow?.webContents.send("media-key", "previous");
    });
    log("Media keys registered");
  } catch (err) {
    log("Failed to register media keys:", err);
  }
};

app.whenReady().then(() => {
  log("App ready");

  const ses = session.defaultSession;

  const userDataPath = app.getPath("userData");
  log("User data path:", userDataPath);

  log("Storage path:", ses.getStoragePath());

  ses.cookies.on("changed", (
    /** @type {import('electron').Event} */ _event,
    /** @type {import('electron').Cookie} */ cookie,
    /** @type {string} */ cause,
    /** @type {boolean} */ removed,
  ) => {
    if (!removed && isDev) {
      log(`Cookie set: ${cookie.name} (${cause})`);
    }
  });

  ses.cookies.flushStore().then(() => {
    log("Session configured with persistent storage");
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Gracefully shutdown the server process
 * @returns {Promise<void>}
 */
const shutdownServer = () => {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }

    log("Shutting down server gracefully...");

    serverProcess.kill("SIGTERM");

    const killTimeout = setTimeout(() => {
      if (serverProcess) {
        log("Force killing server process");
        serverProcess.kill("SIGKILL");
      }
    }, 5000);

    serverProcess.on("exit", () => {
      clearTimeout(killTimeout);
      log("Server process terminated");
      serverProcess = null;
      resolve();
    });
  });
};

app.on("window-all-closed", async () => {
  log("All windows closed");
  await shutdownServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", async (/** @type {import('electron').Event} */ event) => {
  log("App will quit");
  event.preventDefault();

  globalShortcut.unregisterAll();

  try {
    await session.defaultSession.cookies.flushStore();
    log("Cookies flushed to disk");
  } catch (err) {
    log("Error flushing cookies:", err);
  }

  await shutdownServer();

  app.exit(0);
});

if (!isDev) {
  Menu.setApplicationMenu(null);
}

process.on("uncaughtException", (/** @type {Error} */ err) => {
  log("Uncaught exception:", err);
});

process.on("unhandledRejection", (/** @type {unknown} */ err) => {
  log("Unhandled rejection:", err);
});

const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const CaptionProcessor = require("./services/captionProcessor");
const ConfigManager = require("./services/configManager");

require("electron-reload")(__dirname, {
  electron: path.join(
    __dirname,
    "..",
    "..",
    "node_modules",
    ".bin",
    "electron"
  ),
  hardResetMethod: "exit",
});

let mainWindow;
let overlayWindow;
let settingsWindow;
let captionProcessor;
let configManager;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 345,
    height: 320,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // This is important for using Node.js in the renderer process
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  // Initialize services
  configManager = new ConfigManager();
  await configManager.loadConfig();

  captionProcessor = new CaptionProcessor();
  await captionProcessor.initialize();

  // Configure translation based on saved settings
  const config = configManager.getConfig();
  if (config.translationProvider === "google" && config.googleApiKey) {
    captionProcessor.configureTranslation("google", config.googleApiKey);
  } else if (config.translationProvider === "deepl" && config.deeplApiKey) {
    captionProcessor.configureTranslation("deepl", config.deeplApiKey);
  } else {
    captionProcessor.configureTranslation("free");
  }
};

const createOverlayWindow = (bounds) => {
  if (overlayWindow) {
    overlayWindow.destroy();
  }

  overlayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  overlayWindow.loadFile(
    path.join(__dirname, "../renderer/windows/overlay/overlay.html")
  );

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
};

const createSettingsWindow = () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    resizable: false,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  settingsWindow.loadFile(
    path.join(__dirname, "../renderer/windows/settings/settings.html")
  );

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
};

const createSelectionWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const selectionWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  selectionWindow.loadFile(
    path.join(__dirname, "../renderer/windows/selection/selection.html")
  );

  return selectionWindow;
};

// IPC handlers
ipcMain.handle("start-selection", async () => {
  const selectionWindow = createSelectionWindow();

  return new Promise((resolve) => {
    ipcMain.once("selection-complete", (event, bounds) => {
      selectionWindow.destroy();
      resolve(bounds);
    });

    ipcMain.once("selection-cancelled", () => {
      selectionWindow.destroy();
      resolve(null);
    });
  });
});

ipcMain.handle("create-overlay", async (event, bounds) => {
  createOverlayWindow(bounds);

  // Start caption processing
  if (captionProcessor) {
    await captionProcessor.startMonitoring(bounds, (textData) => {
      // Send translation updates to the overlay window
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send("text-update", textData);
      }
    });
  }

  return true;
});

ipcMain.handle("destroy-overlay", async () => {
  // Stop caption processing
  if (captionProcessor) {
    captionProcessor.stopMonitoring();
  }

  if (overlayWindow) {
    overlayWindow.destroy();
    overlayWindow = null;
  }
  return true;
});

// Handle translation configuration
ipcMain.handle("configure-translation", async (event, provider, apiKey) => {
  if (captionProcessor) {
    captionProcessor.configureTranslation(provider, apiKey);
  }
  return true;
});

// Handle capture interval changes
ipcMain.handle("set-capture-interval", async (event, interval) => {
  if (captionProcessor) {
    captionProcessor.setCaptureInterval(interval);
  }
  return true;
});

// Handle settings window
ipcMain.handle("open-settings", async () => {
  createSettingsWindow();
  return true;
});

// Handle configuration
ipcMain.handle("get-config", async () => {
  return configManager ? configManager.getConfig() : {};
});

ipcMain.handle("update-config", async (event, updates) => {
  if (configManager) {
    const config = await configManager.updateConfig(updates);

    // Update caption processor with new settings
    if (captionProcessor) {
      if (config.translationProvider === "google" && config.googleApiKey) {
        captionProcessor.configureTranslation("google", config.googleApiKey);
      } else if (config.translationProvider === "deepl" && config.deeplApiKey) {
        captionProcessor.configureTranslation("deepl", config.deeplApiKey);
      } else {
        captionProcessor.configureTranslation("free");
      }

      if (config.captureInterval) {
        captionProcessor.setCaptureInterval(config.captureInterval);
      }
    }

    return config;
  }
  return {};
});

ipcMain.handle("test-translation", async (event, testText) => {
  if (captionProcessor && captionProcessor.translationService) {
    return await captionProcessor.translationService.translateText(testText);
  }
  return "Translation service not available";
});

app.whenReady().then(createWindow);

app.on("before-quit", async () => {
  if (captionProcessor) {
    await captionProcessor.cleanup();
  }
});

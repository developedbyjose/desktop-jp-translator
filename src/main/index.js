const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

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

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 345,
    height: 270,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // This is important for using Node.js in the renderer process
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
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
    path.join(__dirname, "../renderer/pages/overlay.html")
  );

  overlayWindow.on("closed", () => {
    overlayWindow = null;
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
    path.join(__dirname, "../renderer/pages/selection.html")
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
  return true;
});

ipcMain.handle("destroy-overlay", async () => {
  if (overlayWindow) {
    overlayWindow.destroy();
    overlayWindow = null;
  }
  return true;
});

app.whenReady().then(createWindow);

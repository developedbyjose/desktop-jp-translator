const { app, BrowserWindow } = require("electron");
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

const createWindow = () => {
  const mainWindow = new BrowserWindow({
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

app.whenReady().then(createWindow);

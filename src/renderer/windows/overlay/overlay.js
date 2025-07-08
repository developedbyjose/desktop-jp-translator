const { ipcRenderer } = require("electron");

const originalText = document.getElementById("originalText");
const translatedText = document.getElementById("translatedText");
const statusText = document.getElementById("statusText");

document.getElementById("closeBtn").addEventListener("click", () => {
  ipcRenderer.invoke("destroy-overlay");
});

// Listen for text updates from the main process
ipcRenderer.on("text-update", (event, data) => {
  originalText.textContent = data.original;
  translatedText.textContent = data.translated;
  statusText.textContent = `Updated: ${new Date(
    data.timestamp
  ).toLocaleTimeString()}`;
});

// Prevent the window from being dragged
document.addEventListener("mousedown", (e) => {
  e.preventDefault();
});

// Prevent context menu
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Initial monitoring indicator
let dots = 0;
const monitoringInterval = setInterval(() => {
  if (translatedText.textContent.includes("monitoring")) {
    dots = (dots + 1) % 4;
    const dotsText = ".".repeat(dots);
    translatedText.textContent = `Caption area selected - monitoring for text${dotsText}`;
  } else {
    clearInterval(monitoringInterval);
  }
}, 500);

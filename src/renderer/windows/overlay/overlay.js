const { ipcRenderer } = require("electron");

const originalText = document.getElementById("originalText");
const translatedText = document.getElementById("translatedText");
const statusText = document.getElementById("statusText");
const overlayContent = document.querySelector(".overlay-content");

let selectionBounds = null;

// Listen for selection bounds to determine arrow positioning
ipcRenderer.on("set-selection-bounds", (event, bounds) => {
  selectionBounds = bounds;
  updateArrowDirection();
});

// Update arrow direction based on overlay position relative to selection
function updateArrowDirection() {
  if (!selectionBounds) return;

  const currentWindow =
    require("electron").remote?.getCurrentWindow() ||
    require("@electron/remote")?.getCurrentWindow();

  if (currentWindow) {
    const overlayPosition = currentWindow.getBounds();

    // If overlay is below the selection, add 'below' class
    if (overlayPosition.y > selectionBounds.y + selectionBounds.height) {
      overlayContent.classList.add("below");
    } else {
      overlayContent.classList.remove("below");
    }
  }
}

// Listen for text updates from the main process
ipcRenderer.on("text-update", (event, data) => {
  originalText.textContent = data.original;
  translatedText.textContent = data.translated;

  // Show confidence if available
  const confidenceText = data.confidence
    ? ` (Confidence: ${Math.round(data.confidence)}%)`
    : "";

  statusText.textContent = `Updated: ${new Date(
    data.timestamp
  ).toLocaleTimeString()}${confidenceText}`;

  // Clear the monitoring interval since we have real text
  clearInterval(monitoringInterval);
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
    translatedText.textContent = `Monitoring selected area${dotsText}`;
  } else {
    clearInterval(monitoringInterval);
  }
}, 500);

// Set initial status
translatedText.textContent = "Monitoring selected area...";
statusText.textContent = "Waiting for text detection";

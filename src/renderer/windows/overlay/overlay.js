const { ipcRenderer } = require("electron");

const originalText = document.getElementById("originalText");
const translatedText = document.getElementById("translatedText");
const statusText = document.getElementById("statusText");
const overlayContent = document.querySelector(".overlay-content");
const dragHandle = document.getElementById("dragHandle");

let selectionBounds = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

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

// Drag functionality for the entire overlay
overlayContent.addEventListener("mousedown", (e) => {
  isDragging = true;
  const rect = overlayContent.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  // Add visual feedback
  overlayContent.style.opacity = "0.8";
  document.body.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  // Calculate new window position
  const newX = e.screenX - dragOffset.x;
  const newY = e.screenY - dragOffset.y;

  // Move the window via IPC
  ipcRenderer.invoke("move-overlay-window", { x: newX, y: newY });
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    overlayContent.style.opacity = "1";
    document.body.style.cursor = "default";
  }
});

// Prevent default drag behavior on other elements
document.addEventListener("dragstart", (e) => {
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

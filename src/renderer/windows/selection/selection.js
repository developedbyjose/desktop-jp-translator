const { ipcRenderer } = require("electron");

let isSelecting = false;
let startX, startY;
const selectionRect = document.getElementById("selectionRect");
const overlay = document.querySelector(".selection-overlay");

overlay.addEventListener("mousedown", (e) => {
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;

  selectionRect.style.left = startX + "px";
  selectionRect.style.top = startY + "px";
  selectionRect.style.width = "0px";
  selectionRect.style.height = "0px";
  selectionRect.style.display = "block";
});

overlay.addEventListener("mousemove", (e) => {
  if (!isSelecting) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);

  selectionRect.style.left = left + "px";
  selectionRect.style.top = top + "px";
  selectionRect.style.width = width + "px";
  selectionRect.style.height = height + "px";
});

overlay.addEventListener("mouseup", (e) => {
  if (!isSelecting) return;

  isSelecting = false;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);

  // Only proceed if the selection has a reasonable size
  if (width > 10 && height > 10) {
    const bounds = {
      x: Math.round(left + window.screenX),
      y: Math.round(top + window.screenY),
      width: Math.round(width),
      height: Math.round(height),
    };

    ipcRenderer.send("selection-complete", bounds);
  } else {
    ipcRenderer.send("selection-cancelled");
  }
});

// Handle ESC key to cancel selection
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    ipcRenderer.send("selection-cancelled");
  }
});

// Prevent context menu
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

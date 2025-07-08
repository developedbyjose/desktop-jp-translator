const { ipcRenderer } = require("electron");

// DOM elements
const translationProvider = document.getElementById("translationProvider");
const googleApiKey = document.getElementById("googleApiKey");
const deeplApiKey = document.getElementById("deeplApiKey");
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");
const captureInterval = document.getElementById("captureInterval");
const saveButton = document.getElementById("saveButton");
const testButton = document.getElementById("testButton");
const cancelButton = document.getElementById("cancelButton");
const status = document.getElementById("status");

// Show/hide API key inputs based on provider
translationProvider.addEventListener("change", () => {
  const provider = translationProvider.value;
  document.getElementById("googleApiKeyGroup").className =
    provider === "google" ? "api-key-group visible" : "api-key-group";
  document.getElementById("deeplApiKeyGroup").className =
    provider === "deepl" ? "api-key-group visible" : "api-key-group";
});

// Load current settings
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const config = await ipcRenderer.invoke("get-config");
    translationProvider.value = config.translationProvider || "free";
    googleApiKey.value = config.googleApiKey || "";
    deeplApiKey.value = config.deeplApiKey || "";
    sourceLanguage.value = config.sourceLanguage || "ja";
    targetLanguage.value = config.targetLanguage || "en";
    captureInterval.value = (config.captureInterval || 2000) / 1000;

    // Trigger provider change to show correct API key field
    translationProvider.dispatchEvent(new Event("change"));
  } catch (error) {
    showStatus("Failed to load settings", "error");
  }
});

// Save settings
saveButton.addEventListener("click", async () => {
  try {
    const config = {
      translationProvider: translationProvider.value,
      googleApiKey: googleApiKey.value,
      deeplApiKey: deeplApiKey.value,
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value,
      captureInterval: parseInt(captureInterval.value * 1000),
    };

    await ipcRenderer.invoke("update-config", config);
    showStatus("Settings saved successfully!", "success");

    // Close the settings window after a short delay
    setTimeout(() => {
      window.close();
    }, 1500);
  } catch (error) {
    showStatus("Failed to save settings", "error");
  }
});

// Cancel button - close without saving
cancelButton.addEventListener("click", () => {
  window.close();
});

// Handle ESC key to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.close();
  }
});

// Test translation
testButton.addEventListener("click", async () => {
  try {
    showStatus("Testing translation...", "success");
    const result = await ipcRenderer.invoke("test-translation", "こんにちは");
    showStatus(`Test successful: ${result}`, "success");
  } catch (error) {
    showStatus("Translation test failed", "error");
  }
});

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
}

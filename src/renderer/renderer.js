const { TITLE, BUTTON_LABELS } = require("../shared/constant");
const { ipcRenderer } = require("electron");

let isSelectionMode = false;
let overlayActive = false;

window.addEventListener("DOMContentLoaded", () => {
  const appTitle = document.getElementById("jp-title");
  appTitle.textContent = TITLE.APP_TITLE;

  // button
  const btnStartTranslationLabel = document.getElementById(
    "btn-start-translation"
  );
  btnStartTranslationLabel.textContent = BUTTON_LABELS.START_TRANSLATION;

  const btnStartTranslation = document.getElementById("btn-start-translation");
  const btnSettings = document.getElementById("btn-settings");

  btnSettings.addEventListener("click", () => {
    ipcRenderer.invoke("open-settings");
  });
  btnStartTranslation.addEventListener("click", async () => {
    if (!isSelectionMode && !overlayActive) {
      // Start selection mode
      jpStatus.textContent = "Click to select caption area...";
      btnStartTranslationLabel.textContent = "Select Caption Area";
      btnStartTranslation.className = "selection-mode";
      isSelectionMode = true;

      try {
        const bounds = await ipcRenderer.invoke("start-selection");

        if (bounds) {
          // Selection was successful, create overlay
          await ipcRenderer.invoke("create-overlay", bounds);
          overlayActive = true;
          btnStartTranslationLabel.textContent = "Stop Translation";
          btnStartTranslation.className = "stop-mode";
          jpStatus.textContent = "Monitoring caption area";
        } else {
          // Selection was cancelled
          resetToInitialState();
        }
      } catch (error) {
        console.error("Selection failed:", error);
        resetToInitialState();
      }

      isSelectionMode = false;
    } else if (overlayActive) {
      // Stop translation and destroy overlay
      await ipcRenderer.invoke("destroy-overlay");
      resetToInitialState();
    }
  });

  // status
  const jpStatus = document.getElementById("jp-status");

  function resetToInitialState() {
    isSelectionMode = false;
    overlayActive = false;
    btnStartTranslationLabel.textContent = BUTTON_LABELS.START_TRANSLATION;
    btnStartTranslation.className = "";
    jpStatus.textContent = "";
  }

  // footer
  const footerDescription = document.querySelector(".footer-description");
  footerDescription.textContent = TITLE.APP_DESCRIPTION;

  const footerVersion = document.getElementById("version-number");
  footerVersion.textContent = TITLE.APP_VERSION;

  const footerAuthor = document.getElementById("author-name");
  footerAuthor.textContent = TITLE.APP_AUTHOR;
});

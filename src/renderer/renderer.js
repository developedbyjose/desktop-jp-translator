const { TITLE, BUTTON_LABELS } = require("../shared/constant");

window.addEventListener("DOMContentLoaded", () => {
  const appTitle = document.getElementById("jp-title");
  appTitle.textContent = TITLE.APP_TITLE;

  // button
  const btnStartTranslationLabel = document.getElementById(
    "btn-start-translation"
  );
  btnStartTranslationLabel.textContent = BUTTON_LABELS.START_TRANSLATION;

  const btnStartTranslation = document.getElementById("btn-start-translation");
  btnStartTranslation.addEventListener("click", () => {
    jpStatus.textContent = "Translation started!";
    // Here you would typically call a function to start the translation process
  });

  // status
  const jpStatus = document.getElementById("jp-status");

  // footer
  const footerDescription = document.querySelector(".footer-description");
  footerDescription.textContent = TITLE.APP_DESCRIPTION;

  const footerVersion = document.getElementById("version-number");
  footerVersion.textContent = TITLE.APP_VERSION;

  const footerAuthor = document.getElementById("author-name");
  footerAuthor.textContent = TITLE.APP_AUTHOR;
});

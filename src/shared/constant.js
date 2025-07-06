const TITLE = {
  APP_TITLE: "JP Caption Translator",
  APP_DESCRIPTION: "A simple app to translate Japanese captions to English.",
  APP_VERSION: "1.0.0",
  APP_AUTHOR: "developedbyjose",
};

const MESSAGES = {
  TRANSLATION_STARTED: "Translation started!",
  TRANSLATION_IN_PROGRESS: "Translation in progress...",
  TRANSLATION_COMPLETED: "Translation completed!",
};
const STATUS_MESSAGES = {
  INITIALIZING: "Initializing...",
  READY: "Ready to start translation.",
  ERROR: "An error occurred. Please try again.",
};
const BUTTON_LABELS = {
  START_TRANSLATION: "Start Translation",
  STOP_TRANSLATION: "Stop Translation",
  SELECT_CAPTION_AREA: "Select Caption Area",
  RESET: "Reset",
};
const DIALOG_TITLES = {
  CONFIRMATION: "Confirmation",
  ERROR: "Error",
  SUCCESS: "Success",
};
const DIALOG_MESSAGES = {
  CONFIRM_START: "Are you sure you want to start the translation?",
  CONFIRM_STOP: "Are you sure you want to stop the translation?",
  ERROR_OCCURRED: "An error occurred. Please check the console for details.",
  SUCCESS: "Operation completed successfully!",
};

// const API_ENDPOINTS = {
//   START_TRANSLATION: "/api/start-translation",
//   STOP_TRANSLATION: "/api/stop-translation",
//   GET_STATUS: "/api/get-status",
// };
// const CONFIG = {
//   MAX_RETRIES: 3,
//   RETRY_DELAY: 2000, // in milliseconds
//   TIMEOUT: 5000, // in milliseconds
//   BASE_URL: "http://localhost:3000",
//   LOG_LEVEL: "info", // options: 'debug', 'info', 'warn', 'error'
// };

// for future features
// const THEMES = {
//   LIGHT: "light",
//   DARK: "dark",
//   SYSTEM: "system",
// };
// const LOCAL_STORAGE_KEYS = {
//   THEME: "app_theme",
// };

module.exports = {
  TITLE,
  MESSAGES,
  STATUS_MESSAGES,
  BUTTON_LABELS,
  DIALOG_TITLES,
  DIALOG_MESSAGES,
  // API_ENDPOINTS,
  // CONFIG,
  // THEMES,
  // LOCAL_STORAGE_KEYS,
};

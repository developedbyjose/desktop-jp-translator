const OCRService = require("./ocrService");
const TranslationService = require("./translationService");
const CaptureService = require("./captureService");

class CaptionProcessor {
  constructor() {
    this.ocrService = new OCRService();
    this.translationService = new TranslationService();
    this.captureService = CaptureService;
    this.isRunning = false;
    this.intervalId = null;
    this.lastCapturedText = "";
    this.captureInterval = 2000; // Capture every 2 seconds
    this.bounds = null;
    this.onTextUpdate = null; // Callback for text updates
  }

  async initialize() {
    await this.ocrService.initialize();
  }

  async startMonitoring(bounds, onTextUpdate) {
    if (this.isRunning) {
      this.stopMonitoring();
    }

    this.bounds = bounds;
    this.onTextUpdate = onTextUpdate;
    this.isRunning = true;
    this.lastCapturedText = "";

    console.log("Starting caption monitoring...");

    // Start the monitoring loop
    this.intervalId = setInterval(async () => {
      await this.processCaption();
    }, this.captureInterval);

    // Process immediately
    await this.processCaption();
  }

  async processCaption() {
    if (!this.isRunning || !this.bounds) return;

    try {
      // Small delay to ensure overlay is positioned and stable
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 1. Capture only the selected area
      const croppedImageBuffer = await this.captureService.captureSelectedArea(
        this.bounds
      );

      // 2. Extract text from the cropped image
      const ocrResult = await this.ocrService.extractText(croppedImageBuffer);

      if (!ocrResult.success || !ocrResult.text) {
        console.log("No text found in selected area");
        return;
      }

      // Only process if text has changed significantly
      if (this.hasTextChanged(ocrResult.text)) {
        console.log("New text detected:", ocrResult.text);

        // 3. Translate the text
        const translatedText = await this.translationService.translateText(
          ocrResult.text
        );

        // Update the last captured text
        this.lastCapturedText = ocrResult.text;

        // Send update to the UI
        if (this.onTextUpdate) {
          this.onTextUpdate({
            original: ocrResult.text,
            translated: translatedText,
            confidence: ocrResult.confidence,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Caption processing failed:", error);
      // Continue monitoring even if one iteration fails
    }
  }

  hasTextChanged(newText) {
    if (!newText || newText.trim().length === 0) {
      return false;
    }

    // Simple similarity check - you might want to use a more sophisticated algorithm
    const similarity = this.calculateSimilarity(this.lastCapturedText, newText);
    return similarity < 0.8; // Consider text changed if less than 80% similar
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.bounds = null;
    this.onTextUpdate = null;
    console.log("Caption monitoring stopped");
  }

  setCaptureInterval(interval) {
    this.captureInterval = interval;
    if (this.isRunning) {
      // Restart monitoring with new interval
      const bounds = this.bounds;
      const callback = this.onTextUpdate;
      this.stopMonitoring();
      this.startMonitoring(bounds, callback);
    }
  }

  // Configure translation settings
  configureTranslation(provider, apiKey = null) {
    switch (provider) {
      case "google":
        if (apiKey) {
          this.translationService.initializeGoogleTranslate(apiKey);
        }
        break;
      case "deepl":
        if (apiKey) {
          this.translationService.initializeDeepL(apiKey);
        }
        break;
      case "free":
        this.translationService.setProvider("free");
        break;
    }
  }

  async cleanup() {
    this.stopMonitoring();
    await this.ocrService.terminate();
  }
}

module.exports = CaptionProcessor;

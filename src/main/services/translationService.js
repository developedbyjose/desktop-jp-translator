const { Translate } = require("@google-cloud/translate").v2;
const { translate } = require("@vitalets/google-translate-api");
const deepl = require("deepl-node");

class TranslationService {
  constructor() {
    this.googleTranslate = null;
    this.deeplTranslator = null;
    this.currentProvider = "free"; // 'google', 'deepl', 'free'
  }

  // Initialize paid services (require API keys)
  initializeGoogleTranslate(apiKey) {
    try {
      this.googleTranslate = new Translate({
        key: apiKey,
      });
      this.currentProvider = "google";
      console.log("Google Translate initialized");
    } catch (error) {
      console.error("Failed to initialize Google Translate:", error);
    }
  }

  initializeDeepL(apiKey) {
    try {
      this.deeplTranslator = new deepl.Translator(apiKey);
      this.currentProvider = "deepl";
      console.log("DeepL initialized");
    } catch (error) {
      console.error("Failed to initialize DeepL:", error);
    }
  }

  async translateText(text, targetLanguage = "en", sourceLanguage = "ja") {
    if (!text || text.trim().length === 0) {
      return "";
    }

    try {
      switch (this.currentProvider) {
        case "google":
          return await this.translateWithGoogle(
            text,
            targetLanguage,
            sourceLanguage
          );
        case "deepl":
          return await this.translateWithDeepL(
            text,
            targetLanguage,
            sourceLanguage
          );
        case "free":
        default:
          return await this.translateWithFreeAPI(
            text,
            targetLanguage,
            sourceLanguage
          );
      }
    } catch (error) {
      console.error("Translation failed:", error);
      // Fallback to free API if paid service fails
      try {
        return await this.translateWithFreeAPI(
          text,
          targetLanguage,
          sourceLanguage
        );
      } catch (fallbackError) {
        console.error("Fallback translation also failed:", fallbackError);
        return `Translation failed: ${text}`;
      }
    }
  }

  async translateWithGoogle(text, targetLanguage, sourceLanguage) {
    const [translation] = await this.googleTranslate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });
    return translation;
  }

  async translateWithDeepL(text, targetLanguage, sourceLanguage) {
    const result = await this.deeplTranslator.translateText(
      text,
      sourceLanguage,
      targetLanguage
    );
    return result.text;
  }

  async translateWithFreeAPI(text, targetLanguage, sourceLanguage) {
    const result = await translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });
    return result.text;
  }

  // Detect language of the text
  async detectLanguage(text) {
    try {
      if (this.currentProvider === "google" && this.googleTranslate) {
        const [detection] = await this.googleTranslate.detect(text);
        return detection.language;
      } else {
        // Use free API for language detection
        const result = await translate(text, { to: "en" });
        return result.from.language.iso;
      }
    } catch (error) {
      console.error("Language detection failed:", error);
      return "ja"; // Default to Japanese
    }
  }

  // Set translation provider
  setProvider(provider) {
    if (["google", "deepl", "free"].includes(provider)) {
      this.currentProvider = provider;
    }
  }

  getCurrentProvider() {
    return this.currentProvider;
  }
}

module.exports = TranslationService;

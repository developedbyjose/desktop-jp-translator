const fs = require("fs").promises;
const path = require("path");
const { app } = require("electron");

class ConfigManager {
  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json");
    this.config = {
      translationProvider: "free", // 'google', 'deepl', 'free'
      googleApiKey: "",
      deeplApiKey: "",
      captureInterval: 2000,
      targetLanguage: "en",
      sourceLanguage: "ja",
      autoDetectLanguage: true,
    };
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, "utf8");
      this.config = { ...this.config, ...JSON.parse(configData) };
    } catch (error) {
      // Config file doesn't exist, use defaults
      await this.saveConfig();
    }
    return this.config;
  }

  async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  async updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    return this.config;
  }

  getConfig() {
    return this.config;
  }

  async setApiKey(provider, apiKey) {
    const updates = {};
    if (provider === "google") {
      updates.googleApiKey = apiKey;
      updates.translationProvider = "google";
    } else if (provider === "deepl") {
      updates.deeplApiKey = apiKey;
      updates.translationProvider = "deepl";
    }
    return await this.updateConfig(updates);
  }

  async setTranslationProvider(provider) {
    return await this.updateConfig({ translationProvider: provider });
  }

  async setCaptureInterval(interval) {
    return await this.updateConfig({ captureInterval: interval });
  }

  async setLanguages(sourceLanguage, targetLanguage) {
    return await this.updateConfig({
      sourceLanguage,
      targetLanguage,
    });
  }
}

module.exports = ConfigManager;

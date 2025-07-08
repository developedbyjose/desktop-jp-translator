const { createWorker } = require('tesseract.js');
const screenshot = require('screenshot-desktop');
const fs = require('fs').promises;
const path = require('path');

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('Initializing OCR worker...');
    this.worker = await createWorker('jpn+eng');
    this.isInitialized = true;
    console.log('OCR worker initialized');
  }

  async captureAndExtractText(bounds) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Take a screenshot of the specified area
      const screenshotPath = await this.captureScreenArea(bounds);
      
      // Extract text using OCR
      const { data: { text } } = await this.worker.recognize(screenshotPath);
      
      // Clean up the screenshot file
      await fs.unlink(screenshotPath);
      
      // Clean and return the extracted text
      return this.cleanExtractedText(text);
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw error;
    }
  }

  async captureScreenArea(bounds) {
    try {
      // Get full screenshot first
      const fullScreenshot = await screenshot({ format: 'png' });
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../../../temp');
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (err) {
        // Directory might already exist, ignore error
      }
      
      const screenshotPath = path.join(tempDir, `capture_${Date.now()}.png`);
      await fs.writeFile(screenshotPath, fullScreenshot);
      
      // TODO: Crop the image to the specified bounds
      // For now, return the full screenshot path
      // You might want to use a library like 'sharp' or 'jimp' for cropping
      
      return screenshotPath;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  }

  cleanExtractedText(text) {
    // Remove extra whitespace and clean up the text
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
      .trim();
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

module.exports = OCRService;

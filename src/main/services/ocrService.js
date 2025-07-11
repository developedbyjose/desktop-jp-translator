const { createWorker } = require("tesseract.js");
const fs = require("fs").promises;
const path = require("path");

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log("Initializing OCR worker...");
    this.worker = await createWorker("jpn+eng", 1, {
      logger: (m) => console.log("OCR:", m),
    });

    await this.worker.setParameters({
      tessedit_pageseg_mode: 6, // Assume uniform block of text
      tessedit_char_whitelist: "",
      preserve_interword_spaces: "1",
    });

    this.isInitialized = true;
    console.log("OCR worker initialized");
  }

  async extractText(imageBuffer, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log("=== OCR PROCESSING ===");
      console.log("Processing image buffer size:", imageBuffer.length);

      // Get image dimensions to confirm we're processing only the selected area
      const sharp = require("sharp");
      const metadata = await sharp(imageBuffer).metadata();
      console.log(
        `OCR Input Image Size: ${metadata.width}x${metadata.height} - THIS IS THE SELECTED AREA ONLY`
      );

      // Enhance image before OCR processing
      const enhancedImageBuffer = await this.enhanceImageForOCR(imageBuffer);

      // Save the enhanced image for debugging
      if (process.env.NODE_ENV === "development") {
        const tempPath = path.join(__dirname, "../../../temp");
        await fs.mkdir(tempPath, { recursive: true });

        const timestamp = Date.now();
        await fs.writeFile(
          path.join(tempPath, `ocr-input-${timestamp}.png`),
          imageBuffer
        );
        await fs.writeFile(
          path.join(tempPath, `ocr-enhanced-${timestamp}.png`),
          enhancedImageBuffer
        );
        console.log(
          `Debug OCR images saved: ocr-input-${timestamp}.png and ocr-enhanced-${timestamp}.png`
        );
      }

      // Process the enhanced image with OCR
      const {
        data: { text, confidence },
      } = await this.worker.recognize(enhancedImageBuffer, {
        rectangle: options.rectangle,
      });

      // Clean up the extracted text
      const cleanedText = this.cleanText(text);

      console.log("Raw extracted text:", text);
      console.log("Cleaned extracted text:", cleanedText);
      console.log("OCR Confidence:", confidence);

      return {
        text: cleanedText,
        confidence: confidence,
        success: cleanedText.length > 0,
      };
    } catch (error) {
      console.error("OCR extraction failed:", error);
      return {
        text: "",
        confidence: 0,
        success: false,
        error: error.message,
      };
    }
  }

  cleanText(text) {
    return text
      .replace(/\n+/g, " ") // Replace multiple newlines with space
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, " ") // Keep only words, spaces, and Japanese characters
      .trim(); // Remove leading/trailing whitespace
  }

  // Legacy method for backward compatibility
  async captureAndExtractText(bounds) {
    const captureService = require("./captureService");

    try {
      // Use the new capture service to get cropped image
      const croppedImageBuffer = await captureService.captureSelectedArea(
        bounds
      );

      // Extract text from the cropped image
      const result = await this.extractText(croppedImageBuffer);

      return result.text;
    } catch (error) {
      console.error("OCR extraction failed:", error);
      throw error;
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  async enhanceImageForOCR(imageBuffer) {
    try {
      const sharp = require("sharp");

      // Enhance the image for better OCR results
      const enhancedBuffer = await sharp(imageBuffer)
        // Resize if too small (minimum 300px width for good OCR)
        .resize(null, null, {
          width: 300,
          withoutEnlargement: false,
        })
        // Convert to grayscale for better text recognition
        .greyscale()
        // Increase contrast
        .linear(1.5, -128 * 1.5 + 128)
        // Sharpen the image
        .sharpen()
        .png()
        .toBuffer();

      return enhancedBuffer;
    } catch (error) {
      console.error("Error enhancing image:", error);
      // Return original buffer if enhancement fails
      return imageBuffer;
    }
  }
}

module.exports = OCRService;

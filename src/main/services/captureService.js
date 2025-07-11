const { screen, desktopCapturer } = require("electron");
const fs = require("fs").promises;
const path = require("path");
const screenshot = require("screenshot-desktop");

class CaptureService {
  async captureSelectedArea(bounds) {
    try {
      console.log("=== CAPTURE SELECTED AREA ===");
      console.log("Selected bounds:", bounds);

      // Get display information
      const displays = screen.getAllDisplays();
      const primaryDisplay =
        displays.find((d) => d.id === screen.getPrimaryDisplay().id) ||
        displays[0];

      console.log("Primary display info:", {
        bounds: primaryDisplay.bounds,
        scaleFactor: primaryDisplay.scaleFactor,
        size: primaryDisplay.size,
        workArea: primaryDisplay.workArea,
      });

      // Capture full screen first
      const fullScreenBuffer = await this.captureFullScreen();

      // Get actual image dimensions
      const sharp = require("sharp");
      const metadata = await sharp(fullScreenBuffer).metadata();
      console.log(
        "Full screen image size:",
        metadata.width,
        "x",
        metadata.height
      );

      // Calculate actual scale ratio between image and screen
      const scaleX = metadata.width / primaryDisplay.bounds.width;
      const scaleY = metadata.height / primaryDisplay.bounds.height;

      console.log("Scale ratios - X:", scaleX, "Y:", scaleY);

      // Convert selection bounds to image coordinates
      const imageBounds = {
        x: Math.round(bounds.x * scaleX),
        y: Math.round(bounds.y * scaleY),
        width: Math.round(bounds.width * scaleX),
        height: Math.round(bounds.height * scaleY),
      };

      console.log("Image coordinates:", imageBounds);

      // Validate bounds
      imageBounds.x = Math.max(0, Math.min(imageBounds.x, metadata.width - 1));
      imageBounds.y = Math.max(0, Math.min(imageBounds.y, metadata.height - 1));
      imageBounds.width = Math.min(
        imageBounds.width,
        metadata.width - imageBounds.x
      );
      imageBounds.height = Math.min(
        imageBounds.height,
        metadata.height - imageBounds.y
      );

      console.log("Final bounds after validation:", imageBounds);

      if (imageBounds.width < 10 || imageBounds.height < 10) {
        throw new Error(
          `Selected area too small: ${imageBounds.width}x${imageBounds.height}`
        );
      }

      // Crop to selected area only
      const croppedBuffer = await sharp(fullScreenBuffer)
        .extract({
          left: imageBounds.x,
          top: imageBounds.y,
          width: imageBounds.width,
          height: imageBounds.height,
        })
        .png()
        .toBuffer();

      console.log(
        `Cropped image size: ${imageBounds.width}x${imageBounds.height} from full screen ${metadata.width}x${metadata.height}`
      );

      // Save debug images if in development
      await this.saveDebugImages(
        fullScreenBuffer,
        croppedBuffer,
        bounds,
        imageBounds
      );

      console.log(
        "Successfully cropped image to selected area - ONLY THE SELECTED AREA IS BEING PROCESSED"
      );
      return croppedBuffer;
    } catch (error) {
      console.error("Error capturing selected area:", error);
      throw error;
    }
  }

  async saveDebugImages(
    fullScreenBuffer,
    croppedBuffer,
    originalBounds,
    imageBounds
  ) {
    try {
      const tempDir = path.join(__dirname, "../../../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const timestamp = Date.now();

      // Save full screen
      await fs.writeFile(
        path.join(tempDir, `full-screen-${timestamp}.png`),
        fullScreenBuffer
      );

      // Save cropped area
      await fs.writeFile(
        path.join(tempDir, `selected-area-${timestamp}.png`),
        croppedBuffer
      );

      // Save bounds info
      const boundsInfo = {
        originalBounds,
        imageBounds,
        timestamp: new Date().toISOString(),
      };

      await fs.writeFile(
        path.join(tempDir, `bounds-info-${timestamp}.json`),
        JSON.stringify(boundsInfo, null, 2)
      );

      console.log(`Debug files saved with timestamp: ${timestamp}`);
    } catch (error) {
      console.error("Error saving debug images:", error);
    }
  }

  async captureFullScreen() {
    try {
      // Use screenshot-desktop for reliable full screen capture
      return await screenshot({ format: "png" });
    } catch (error) {
      console.error(
        "Screenshot-desktop failed, trying desktopCapturer:",
        error
      );
      // Fallback to desktopCapturer
      return await this.captureWithDesktopCapturer();
    }
  }

  async captureWithDesktopCapturer() {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: 1920 * 2, // Support high-res displays
        height: 1080 * 2,
      },
    });

    if (sources.length === 0) {
      throw new Error("No screen sources available");
    }

    // Get the primary screen source
    const source = sources[0];
    return source.thumbnail.toPNG();
  }
}

module.exports = new CaptureService();

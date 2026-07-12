const cloudinary = require("cloudinary").v2;
const env = require("./env");

/**
 * Configure and initialize Cloudinary instance.
 * Ensures the instance is globally configured with secure transport.
 */
try {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true
  });
  console.log("✅ Cloudinary storage initialized successfully.");
} catch (error) {
  console.error("❌ Cloudinary initialization error:", error.message);
  process.exit(1);
}

module.exports = cloudinary;

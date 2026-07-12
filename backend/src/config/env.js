/**
 * Environment configuration validator and registry.
 * Ensures the application fails fast during startup if required variables are missing.
 */

// Load dotenv just in case it hasn't been loaded in server.js yet
require("dotenv").config();

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "COOKIE_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GOOGLE_USER",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "EMAIL_FROM",
  "FRONTEND_URL"
];

const missing = [];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error("==========================================================");
  console.error("FATAL ERROR: MISSING ENVIRONMENT VARIABLES IN .env");
  console.error("==========================================================");
  missing.forEach((variable) => {
    console.error(`❌ Missing: ${variable}`);
  });
  console.error("==========================================================");
  console.error("The application cannot start. Please check your .env file.");
  console.error("==========================================================");
  process.exit(1);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieSecret: process.env.COOKIE_SECRET,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    url: process.env.CLOUDINARY_URL
  },
  email: {
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    from: process.env.EMAIL_FROM
  },
  frontendUrl: process.env.FRONTEND_URL
};

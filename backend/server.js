/**
 * EcoSphere Platform Server Entry Point.
 * Orchestrates application bootstrap: config validation, db connection, external services check, and server start.
 */

// Set IPv4 preference for DNS resolution (solves IPv6 ENETUNREACH on deployment environments like Render)
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// Step 1: Load environment variables and validate env schema
const env = require("./src/config/env");

// Step 2: Load database connection module
const connectDB = require("./src/config/db");

// Step 3: Load and verify Cloudinary configuration
const cloudinary = require("./src/config/cloudinary");

// Step 4: Load mail transporter verification module
const { verifyMailTransport } = require("./src/config/nodemailer");

// Load the fully configured express application
const app = require("./src/app");

/**
 * Bootstrap the entire server application.
 */
const bootstrap = async () => {
  try {
    console.log("🔄 Bootstrapping backend infrastructure...");

    // 1. Establish database connection
    await connectDB();

    // 2. Confirm mail transporter can communicate with Gmail SMTP server
    try {
      await verifyMailTransport();
    } catch (mailError) {
      console.warn("⚠️ Warning: Mail transport verification failed. Transactional emails will not be sent.");
      console.warn(`Details: ${mailError.message}`);
    }

    // 3. Start the server
    const PORT = env.port;
    app.listen(PORT, () => {
      console.log(`🚀 EcoSphere Platform Backend initialized successfully!`);
      console.log(`📡 Server status: Active`);
      console.log(`💻 Environment: ${env.nodeEnv}`);
      console.log(`🔌 Listening on port: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Critical bootstrap failure:", error.message);
    process.exit(1);
  }
};

// Start bootstrapping process
bootstrap();

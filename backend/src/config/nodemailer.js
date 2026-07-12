const nodemailer = require("nodemailer");
const env = require("./env");

/**
 * Configure Nodemailer transport using Gmail OAuth2 credentials.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: env.email.user,
    clientId: env.email.clientId,
    clientSecret: env.email.clientSecret,
    refreshToken: env.email.refreshToken
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

/**
 * Verifies the connection config with Gmail SMTP server.
 * Invoked during application startup flow.
 */
const verifyMailTransport = async () => {
  try {
    await transporter.verify();
    console.log("✅ Mail transport verified successfully (Gmail OAuth2).");
  } catch (error) {
    console.error("❌ Mail transport verification failed:", error.message);
    throw error; // Propagated to stop the startup sequence if desired
  }
};

module.exports = {
  transporter,
  verifyMailTransport
};

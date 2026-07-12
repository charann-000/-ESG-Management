const mongoose = require("mongoose");
const env = require("./env");

/**
 * Connect to MongoDB Atlas.
 * Configured with automatic error handling and startup termination upon failure.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("✅ MongoDB connected successfully to Atlas cluster.");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

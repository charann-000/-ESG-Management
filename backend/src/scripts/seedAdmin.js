const User = require("../models/User");
const connectDB = require("../config/db");

/**
 * Seed script to initialize the first Administrator account.
 */
const seedAdmin = async () => {
  try {
    console.log("🔄 Connecting to database for admin seeding...");
    await connectDB();

    const adminEmail = "admin@ecosphere.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("ℹ️ Admin account already exists. Seeding skipped.");
      process.exit(0);
    }

    const adminData = {
      name: "System Administrator",
      email: adminEmail,
      password: "AdminEcoSphere2026!", // Strong default password meeting security rules
      role: "Admin",
      status: "Active",
      isPasswordChangeRequired: false, // Seeded admin is ready to log in directly
    };

    await User.create(adminData);
    console.log("==========================================================");
    console.log("✅ SUCCESS: Administrator account seeded successfully!");
    console.log("==========================================================");
    console.log(`📧 Email:    ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
    console.log("==========================================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Seeding administrator failed:", error);
    process.exit(1);
  }
};

// Execute seeding
seedAdmin();

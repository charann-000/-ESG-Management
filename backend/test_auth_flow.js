const connectDB = require("./src/config/db");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./src/models/User");
const Department = require("./src/models/Department");
const authService = require("./src/services/authService");

/**
 * End-to-End Integration Testing for Authentication Module
 */
const runTests = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Authentication Module Integration Tests");
    console.log("==========================================================");

    // Establish DB Connection
    await connectDB();

    // 1. Admin Login test
    console.log("\n⚡ Test 1: Admin Login using seeded credentials...");
    const adminLoginResult = await authService.login(
      "admin@ecosphere.com",
      "AdminEcoSphere2026!",
      "127.0.0.1",
      "Integration-Test-Agent"
    );
    console.log("✅ Admin Login Succeeded. JWT generated.");
    console.log("Response user state:", adminLoginResult.user);

    // Decode token and fetch profile
    const decoded = jwt.decode(adminLoginResult.token);
    console.log("\n⚡ Test 2: Fetch Admin profile via getCurrentUser...");
    const adminMe = await authService.getCurrentUser(decoded.id);
    console.log("✅ Profile retrieved:", {
      id: adminMe.id,
      name: adminMe.name,
      email: adminMe.email,
      role: adminMe.role,
      status: adminMe.status,
    });

    // 2. Setup mock environment for role-specific password change requirements
    console.log("\n⚡ Preparing testing records for Department Manager...");
    // Find or create temporary Department for Managers validation requirement
    let dept = await Department.findOne({ code: "TST" });
    if (!dept) {
      dept = await Department.create({
        name: "Test Department",
        code: "TST",
        description: "Used for integration testing",
        createdBy: adminMe.id,
        location: "Test Location"
      });
      console.log("Created temporary Department:", dept.name);
    }

    const managerEmail = "integration_test_manager@ecosphere.com";
    // Delete if already exists
    await User.deleteOne({ email: managerEmail });

    // Create Manager with isPasswordChangeRequired = true
    const manager = await User.create({
      name: "Alice Manager",
      email: managerEmail,
      password: "TempPassword123!",
      role: "Department Manager",
      department: dept._id,
      status: "Active",
      isPasswordChangeRequired: true,
    });
    console.log("✅ Created mock Manager user. Forced password reset = true.");

    // 3. Manager Login with temporary password
    console.log("\n⚡ Test 3: Log in as newly created Manager using temp password...");
    const managerLoginResult = await authService.login(
      managerEmail,
      "TempPassword123!",
      "127.0.0.1",
      "Integration-Test-Agent"
    );
    console.log("✅ Login successful.");
    console.log("Response user state:", managerLoginResult.user);
    // Assert isPasswordChangeRequired is indeed true
    if (!managerLoginResult.user.isPasswordChangeRequired) {
      throw new Error("Assert failed: isPasswordChangeRequired should be true on first login.");
    }

    // 4. Update password
    console.log("\n⚡ Test 4: Change password to clear the forced reset requirement...");
    const managerDecoded = jwt.decode(managerLoginResult.token);
    const managerUserRecord = await User.findById(managerDecoded.id);
    
    await authService.changePassword(
      managerUserRecord,
      "TempPassword123!",
      "NewSecurePassword123!",
      "127.0.0.1",
      "Integration-Test-Agent"
    );
    console.log("✅ Password successfully changed to 'NewSecurePassword123!'");

    // Fetch user from DB and assert requirement is false
    const updatedManagerRecord = await User.findById(manager._id);
    console.log("Asserting isPasswordChangeRequired in Database:", updatedManagerRecord.isPasswordChangeRequired);
    if (updatedManagerRecord.isPasswordChangeRequired) {
      throw new Error("Assert failed: isPasswordChangeRequired should now be false.");
    }
    console.log("✅ Assertion passed: isPasswordChangeRequired is false.");

    // 5. Test status blocking (Inactive/Suspended check)
    console.log("\n⚡ Test 5: Suspend Manager and verify login failure...");
    updatedManagerRecord.status = "Suspended";
    await updatedManagerRecord.save();
    
    try {
      await authService.login(
        managerEmail,
        "NewSecurePassword123!",
        "127.0.0.1",
        "Integration-Test-Agent"
      );
      throw new Error("Assert failed: Suspended account should not be allowed to log in.");
    } catch (loginError) {
      console.log("✅ Suspended account login successfully blocked as expected.");
      console.log("Blocked message:", loginError.message);
    }

    // Cleanup test records
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteOne({ email: managerEmail });
    await Department.deleteOne({ _id: dept._id });
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ INTEGRATION TESTS FAILED:", error);
    process.exit(1);
  }
};

runTests();

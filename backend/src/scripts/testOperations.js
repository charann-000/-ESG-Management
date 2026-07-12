const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const EmissionFactor = require("../models/EmissionFactor");
const Operation = require("../models/Operation");

/**
 * Helper to perform HTTP requests against the local Express server.
 */
const request = async (url, options = {}) => {
  const response = await fetch(`http://localhost:5000/api${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    data = text;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
};

/**
 * Operations & Carbon Service Integration Test Runner
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Operations & Carbon Service Integration Tests");
    console.log("==========================================================");

    // Initialize db connection
    await connectDB();

    const managerEmail = "op_test_manager@ecosphere.com";
    const deptCode = "OPS-TST";
    const factorName = "TEST Grid Power 2026";

    // Pre-test cleanup
    await User.deleteOne({ email: managerEmail });
    await Department.deleteOne({ code: deptCode });
    await EmissionFactor.deleteMany({ name: factorName });
    await Operation.deleteMany({ description: "TEST Operation Log" });

    // 1. Admin login to obtain credentials
    console.log("\n⚡ Step 1: Logging in as Admin...");
    const adminLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@ecosphere.com",
        password: "AdminEcoSphere2026!",
      }),
    });

    if (adminLoginResult.status !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginResult.data)}`);
    }

    const adminCookie = adminLoginResult.headers.get("set-cookie");
    const adminToken = adminCookie ? adminCookie.match(/token=([^;]+)/)[1] : null;
    const adminHeaders = { Cookie: `token=${adminToken}` };
    console.log("✅ Admin logged in.");

    // 2. Setup testing Department
    console.log("\n⚡ Step 2: Creating a testing department...");
    const deptResult = await request("/departments", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Operations Testing Dept",
        code: deptCode,
        description: "Department for operations tests",
        location: "Building C, Floor 3",
      }),
    });

    if (deptResult.status !== 201) {
      throw new Error(`Failed to create test department: ${JSON.stringify(deptResult.data)}`);
    }
    const deptId = deptResult.data.data._id;
    console.log("✅ Test department created successfully. ID:", deptId);

    // 3. Create Manager User
    console.log("\n⚡ Step 3: Registering a Department Manager user...");
    const managerResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Charlie Manager Test",
        email: managerEmail,
        role: "Department Manager",
        department: deptId,
      }),
    });

    if (managerResult.status !== 201) {
      throw new Error(`Failed to create manager: ${JSON.stringify(managerResult.data)}`);
    }
    const managerUserId = managerResult.data.data._id;
    console.log("✅ Manager user registered successfully.");

    // Override manager password to a known text and clear change requirement directly in DB
    const managerRecord = await User.findById(managerUserId);
    const testPassword = "ManagerPassword123!";
    managerRecord.password = testPassword;
    managerRecord.isPasswordChangeRequired = false;
    await managerRecord.save();
    console.log("✅ Manager password set. Forced password change requirements bypassed for E2E tests.");

    // 4. Create Emission Factor
    console.log("\n⚡ Step 4: Registering a standard Emission Factor...");
    const factorResult = await request("/emission-factors", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: factorName,
        activityType: "Electricity",
        factor: 0.50, // 0.50 kg CO2e per kwh
        unit: "kwh",
        source: "EPA emission factors manual 2026",
      }),
    });

    if (factorResult.status !== 201) {
      throw new Error(`Failed to create Emission Factor: ${JSON.stringify(factorResult.data)}`);
    }
    const emissionFactorId = factorResult.data.data._id;
    console.log("✅ Emission Factor created successfully. Factor:", factorResult.data.data.factor);

    // 5. Login as Manager
    console.log("\n⚡ Step 5: Logging in as Department Manager...");
    const managerLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: managerEmail,
        password: testPassword,
      }),
    });

    if (managerLoginResult.status !== 200) {
      throw new Error(`Manager login failed: ${JSON.stringify(managerLoginResult.data)}`);
    }

    const managerCookie = managerLoginResult.headers.get("set-cookie");
    const managerToken = managerCookie ? managerCookie.match(/token=([^;]+)/)[1] : null;
    const managerHeaders = { Cookie: `token=${managerToken}` };
    console.log("✅ Manager logged in.");

    // 6. Record Operation (Electricity)
    console.log("\n⚡ Step 6: Logging an Electricity consumption operation record...");
    const opPayload = {
      type: "Electricity",
      quantity: 2500, // 2500 kwh
      unit: "kwh",
      emissionFactor: emissionFactorId,
      evidenceFiles: ["http://cloudinary.com/evidence/invoice123.jpg"],
      description: "TEST Operation Log",
    };

    const opResult = await request("/operations", {
      method: "POST",
      headers: managerHeaders,
      body: JSON.stringify(opPayload),
    });

    if (opResult.status !== 201) {
      throw new Error(`Failed to create operational record: ${JSON.stringify(opResult.data)}`);
    }
    const operationId = opResult.data.data._id;
    console.log("✅ Operation logged successfully.");
    console.log("Computed Carbon Emissions (kg CO2e):", opResult.data.data.carbonEmission); // 2500 * 0.50 = 1250 kg

    if (opResult.data.data.carbonEmission !== 1250) {
      throw new Error(`Assert failed: Carbon emissions should be 1250 but got ${opResult.data.data.carbonEmission}`);
    }

    // 7. Verify Department ESG score is updated
    console.log("\n⚡ Step 7: Verifying department ESG score update...");
    const updatedDept = await Department.findById(deptId);
    console.log("Updated Department Scores -> Environmental:", updatedDept.environmentalScore, "Overall ESG:", updatedDept.overallEsgScore);
    // Environmental score deduction check: 100 - (1250 / 1000) = 100 - 1.25 = 98.75
    if (updatedDept.environmentalScore !== 98.75) {
      throw new Error(`Assert failed: Environmental score should be 98.75 but got ${updatedDept.environmentalScore}`);
    }
    // Overall ESG check: round((98.75 + 0 + 0) / 3) = round(32.916) = 33
    if (updatedDept.overallEsgScore !== 33) {
      throw new Error(`Assert failed: Overall ESG score should be 33 but got ${updatedDept.overallEsgScore}`);
    }
    console.log("✅ ESG Dynamic calculation assertions passed!");

    // 8. Update Operation
    console.log("\n⚡ Step 8: Adjusting operation quantity to 5000 kwh...");
    const updateResult = await request(`/operations/${operationId}`, {
      method: "PATCH",
      headers: managerHeaders,
      body: JSON.stringify({
        quantity: 5000, // should double the emission to 2500 kg
      }),
    });

    if (updateResult.status !== 200) {
      throw new Error(`Failed to update operation: ${JSON.stringify(updateResult.data)}`);
    }
    console.log("✅ Operation updated successfully. New emissions:", updateResult.data.data.carbonEmission); // 2500 kg

    const updatedDept2 = await Department.findById(deptId);
    console.log("Recalculated Scores -> Environmental:", updatedDept2.environmentalScore); // 100 - (2500 / 1000) = 97.5
    if (updatedDept2.environmentalScore !== 97.5) {
      throw new Error(`Assert failed: Environmental score should be 97.5 but got ${updatedDept2.environmentalScore}`);
    }
    console.log("✅ Dynamic score adjustment verified.");

    // 9. Soft-delete operation
    console.log("\n⚡ Step 9: Soft-deleting operational record...");
    const deleteResult = await request(`/operations/${operationId}`, {
      method: "DELETE",
      headers: managerHeaders,
    });

    if (deleteResult.status !== 200) {
      throw new Error(`Failed to delete operation: ${JSON.stringify(deleteResult.data)}`);
    }
    console.log("✅ Soft-delete successful.");

    const updatedDept3 = await Department.findById(deptId);
    console.log("Final Department scores post-deletion -> Environmental:", updatedDept3.environmentalScore); // should return to 100
    if (updatedDept3.environmentalScore !== 100) {
      throw new Error(`Assert failed: Environmental score should return to 100 but got ${updatedDept3.environmentalScore}`);
    }
    console.log("✅ Department ESG scores returned to 100 post-deletion successfully.");

    // Clean up
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteOne({ email: managerEmail });
    await Department.deleteOne({ _id: deptId });
    await EmissionFactor.deleteMany({ name: factorName });
    await Operation.deleteMany({ description: "TEST Operation Log" });
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL OPERATIONS & CARBON TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ OPERATIONS & CARBON TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

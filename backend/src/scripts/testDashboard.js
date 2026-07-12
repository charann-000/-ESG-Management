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
 * Dashboard Aggregation APIs Integration Test Runner
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Dashboard Aggregation Module Integration Tests");
    console.log("==========================================================");

    await connectDB();

    const managerEmail = "dash_test_manager@ecosphere.com";
    const deptCode = "DSH-TST";
    const factorName = "TEST Dash Power 2026";

    // Pre-test cleanup
    await User.deleteOne({ email: managerEmail });
    await Department.deleteOne({ code: deptCode });
    await EmissionFactor.deleteMany({ name: factorName });
    await Operation.deleteMany({ description: "TEST Dash Log" });

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

    // 2. Setup testing Department & Manager
    console.log("\n⚡ Step 2: Creating test department & manager...");
    const deptResult = await request("/departments", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Dashboard Testing Dept",
        code: deptCode,
        description: "Department for dashboard tests",
        location: "Building D, Floor 4",
      }),
    });

    if (deptResult.status !== 201) {
      throw new Error(`Failed to create test department: ${JSON.stringify(deptResult.data)}`);
    }
    const deptId = deptResult.data.data._id;

    const managerResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Devon Manager Test",
        email: managerEmail,
        role: "Department Manager",
        department: deptId,
      }),
    });

    if (managerResult.status !== 201) {
      throw new Error(`Failed to create manager: ${JSON.stringify(managerResult.data)}`);
    }
    const managerUserId = managerResult.data.data._id;

    const managerRecord = await User.findById(managerUserId);
    const testPassword = "ManagerPassword123!";
    managerRecord.password = testPassword;
    managerRecord.isPasswordChangeRequired = false;
    await managerRecord.save();

    // 3. Setup standard Emission Factor
    const factorResult = await request("/emission-factors", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: factorName,
        activityType: "Electricity",
        factor: 0.40, // 0.40 kg CO2e per kwh
        unit: "kwh",
        source: "Dashboard test guide guidelines",
      }),
    });
    const emissionFactorId = factorResult.data.data._id;

    // 4. Log in as Manager
    console.log("\n⚡ Step 3: Logging in as Department Manager...");
    const managerLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: managerEmail,
        password: testPassword,
      }),
    });

    const managerCookie = managerLoginResult.headers.get("set-cookie");
    const managerToken = managerCookie ? managerCookie.match(/token=([^;]+)/)[1] : null;
    const managerHeaders = { Cookie: `token=${managerToken}` };
    console.log("✅ Manager logged in.");

    // 5. Record Operation (3000 kwh -> 1200 kg CO2e)
    console.log("\n⚡ Step 4: Logging operations to compile dashboard carbon...");
    const opPayload = {
      type: "Electricity",
      quantity: 3000,
      unit: "kwh",
      emissionFactor: emissionFactorId,
      evidenceFiles: ["http://cloudinary.com/evidence/invoice124.jpg"],
      description: "TEST Dash Log",
    };

    await request("/operations", {
      method: "POST",
      headers: managerHeaders,
      body: JSON.stringify(opPayload),
    });
    console.log("✅ Operation logged. Footprint is 1200 kg CO2e.");

    // 6. Fetch Admin Dashboard
    console.log("\n⚡ Step 5: Querying Admin Dashboard as Admin...");
    const adminDashResult = await request("/dashboard/admin", {
      method: "GET",
      headers: adminHeaders,
    });

    if (adminDashResult.status !== 200) {
      throw new Error(`Failed to query Admin Dashboard: ${JSON.stringify(adminDashResult.data)}`);
    }
    const adminData = adminDashResult.data.data;
    console.log("✅ Admin Dashboard retrieved.");
    console.log("Global Total Carbon footprint compiled (kg):", adminData.totalCarbon);
    console.log("Global Operations today:", adminData.operationsToday);
    console.log("Global Top emitting categories:", adminData.topCategories);
    
    if (adminData.totalCarbon < 1200) {
      throw new Error(`Assert failed: Total carbon footprint should be at least 1200 kg but got ${adminData.totalCarbon}`);
    }

    // 7. Verify Role Access block on Admin Dashboard
    console.log("\n⚡ Step 6: Verifying Department Manager is blocked from Admin Dashboard...");
    const blockDashResult = await request("/dashboard/admin", {
      method: "GET",
      headers: managerHeaders,
    });

    if (blockDashResult.status === 200) {
      throw new Error("Assert failed: Department Manager should be blocked from Admin Dashboard.");
    }
    console.log("✅ Access blocked successfully. Message:", blockDashResult.data.message);

    // 8. Fetch Department Dashboard
    console.log("\n⚡ Step 7: Querying Department Dashboard as Department Manager...");
    const deptDashResult = await request("/dashboard/department", {
      method: "GET",
      headers: managerHeaders,
    });

    if (deptDashResult.status !== 200) {
      throw new Error(`Failed to query Department Dashboard: ${JSON.stringify(deptDashResult.data)}`);
    }
    const deptData = deptDashResult.data.data;
    console.log("✅ Department Dashboard retrieved.");
    console.log("Department info:", deptData.department);
    console.log("Department Total Carbon (kg):", deptData.totalCarbon);
    console.log("Department Operations logged today:", deptData.operationsToday);

    if (deptData.totalCarbon !== 1200) {
      throw new Error(`Assert failed: Department carbon footprint should be 1200 but got ${deptData.totalCarbon}`);
    }
    if (deptData.department.environmentalScore !== 98.80) {
      // 100 - (1200 / 1000) = 100 - 1.20 = 98.80
      throw new Error(`Assert failed: Environmental score should be 98.80 but got ${deptData.department.environmentalScore}`);
    }
    console.log("✅ Department dashboard KPIs verified.");

    // Cleanup test records
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteOne({ email: managerEmail });
    // Cleanup operations first
    await Operation.deleteMany({ description: "TEST Dash Log" });
    await Department.deleteOne({ _id: deptId });
    await EmissionFactor.deleteMany({ name: factorName });
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL DASHBOARD AGGREGATION TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ DASHBOARD TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

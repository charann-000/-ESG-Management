const connectDB = require("../config/db");
const mongoose = require("mongoose");
const EmissionFactor = require("../models/EmissionFactor");

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
 * Emission Factor Integration Test Runner
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Emission Factors Module Integration Tests");
    console.log("==========================================================");

    // Initialize db connection
    await connectDB();

    // Pre-test cleanup
    await EmissionFactor.deleteMany({
      name: { $in: ["TEST Grid Factor 2026", "TEST Second Factor 2026"] },
    });

    // 1. Admin login to obtain session cookie
    console.log("\n⚡ Step 1: Logging in as Admin...");
    const loginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@ecosphere.com",
        password: "AdminEcoSphere2026!",
      }),
    });

    if (loginResult.status !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginResult.data)}`);
    }

    const cookieHeader = loginResult.headers.get("set-cookie");
    const tokenMatch = cookieHeader ? cookieHeader.match(/token=([^;]+)/) : null;
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      throw new Error("Failed to extract JWT session cookie.");
    }
    console.log("✅ Admin logged in. Session token extracted.");
    const authHeaders = { Cookie: `token=${token}` };

    // 2. Create Emission Factor
    console.log("\n⚡ Step 2: Creating a new Emission Factor...");
    const payload1 = {
      name: "TEST Grid Factor 2026",
      activityType: "Electricity",
      factor: 0.452,
      unit: "kwh",
      source: "EPA Regulation Guidelines 2026",
      year: 2026,
    };

    const createResult = await request("/emission-factors", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(payload1),
    });

    if (createResult.status !== 201) {
      throw new Error(`Failed to create emission factor: ${JSON.stringify(createResult.data)}`);
    }
    const createdId = createResult.data.data._id;
    console.log("✅ Emission Factor created successfully.");

    // 3. Verify duplicate name block
    console.log("\n⚡ Step 3: Verifying that duplicate names are blocked...");
    const duplicateNameResult = await request("/emission-factors", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "TEST Grid Factor 2026",
        activityType: "Fleet",
        factor: 2.12,
        unit: "l",
        source: "EPA Regulation Guidelines 2026",
        year: 2026,
      }),
    });

    if (duplicateNameResult.status === 201) {
      throw new Error("Assert failed: Should have blocked duplicate name.");
    }
    console.log("✅ Duplicate name blocked successfully. Message:", duplicateNameResult.data.message);

    // 4. Verify category + unit uniqueness block
    console.log("\n⚡ Step 4: Verifying compound uniqueness constraint (Category + Unit)...");
    const duplicateCompoundResult = await request("/emission-factors", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "TEST Second Factor 2026",
        activityType: "Electricity",
        factor: 0.612,
        unit: "kwh", // duplicate of Electricity + kwh
        source: "Alternative Guidelines 2026",
        year: 2026,
      }),
    });

    if (duplicateCompoundResult.status === 201) {
      throw new Error("Assert failed: Should have blocked duplicate category + unit.");
    }
    console.log("✅ Duplicate category + unit blocked successfully. Message:", duplicateCompoundResult.data.message);

    // 5. Verify positive validation
    console.log("\n⚡ Step 5: Verifying factor value must be positive constraint...");
    const negativeFactorResult = await request("/emission-factors", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "TEST Second Factor 2026",
        activityType: "Fleet",
        factor: -0.15, // Negative factor coefficient
        unit: "km",
        source: "Defra 2026 guidelines",
      }),
    });

    if (negativeFactorResult.status === 201) {
      throw new Error("Assert failed: Should have blocked negative factor coefficient.");
    }
    console.log("✅ Negative factor blocked successfully. Message:", negativeFactorResult.data.message);

    // 6. List active emission factors
    console.log("\n⚡ Step 6: Querying active emission factors...");
    const listResult = await request("/emission-factors", {
      method: "GET",
      headers: authHeaders,
    });

    if (listResult.status !== 200) {
      throw new Error(`Failed to list emission factors: ${JSON.stringify(listResult.data)}`);
    }
    const foundFactor = listResult.data.data.find((f) => f.name === "TEST Grid Factor 2026");
    if (!foundFactor) {
      throw new Error("Assert failed: Created Emission Factor not found in listing.");
    }
    console.log("✅ Active factors listed successfully. Factor is present.");

    // 7. Update emission factor
    console.log("\n⚡ Step 7: Updating emission factor coefficient...");
    const updateResult = await request(`/emission-factors/${createdId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        factor: 0.428,
        source: "Revised EPA Guidelines 2026",
      }),
    });

    if (updateResult.status !== 200) {
      throw new Error(`Failed to update emission factor: ${JSON.stringify(updateResult.data)}`);
    }
    console.log("✅ Update successful. New factor value:", updateResult.data.data.factor);

    // 8. Soft Delete factor
    console.log("\n⚡ Step 8: Soft-deleting the emission factor...");
    const deleteResult = await request(`/emission-factors/${createdId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (deleteResult.status !== 200) {
      throw new Error(`Failed to delete emission factor: ${JSON.stringify(deleteResult.data)}`);
    }
    console.log("✅ Soft-delete successful.");

    // 9. Verify listing filters out deleted factor
    console.log("\n⚡ Step 9: Verifying active listing filters out deleted factor...");
    const postDeleteListResult = await request("/emission-factors", {
      method: "GET",
      headers: authHeaders,
    });

    const deletedExists = postDeleteListResult.data.data.find((f) => f.name === "TEST Grid Factor 2026");
    if (deletedExists) {
      throw new Error("Assert failed: Soft-deleted factor should not appear in active listings.");
    }
    console.log("✅ Confirmed: Inactive emission factor omitted from active listing.");

    // Cleanup database records
    console.log("\n🧹 Cleaning up test database records...");
    await EmissionFactor.deleteMany({
      name: { $in: ["TEST Grid Factor 2026", "TEST Second Factor 2026"] },
    });
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL EMISSION FACTORS TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ EMISSION FACTORS TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

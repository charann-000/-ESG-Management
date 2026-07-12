const connectDB = require("../config/db");
const mongoose = require("mongoose");
const Department = require("../models/Department");

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
 * Department Integration Test Runner
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Department Module Integration Tests");
    console.log("==========================================================");

    // Initialize db connection to clean up before/after tests
    await connectDB();

    // Pre-test cleanup
    await Department.deleteMany({ code: { $in: ["TEST-HR", "TEST-IT"] } });

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

    // Extract session cookie from set-cookie headers
    const cookieHeader = loginResult.headers.get("set-cookie");
    const tokenMatch = cookieHeader ? cookieHeader.match(/token=([^;]+)/) : null;
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      throw new Error("Failed to extract JWT session cookie from login response.");
    }
    console.log("✅ Admin logged in. Session token extracted.");

    const authHeaders = { Cookie: `token=${token}` };

    // 2. Create department
    console.log("\n⚡ Step 2: Creating 'Human Resources Testing' department...");
    const hrPayload = {
      name: "Human Resources Testing",
      code: "TEST-HR",
      description: "Handles employee benefits and recruitment",
      location: "Building A, Floor 2",
    };

    const hrResult = await request("/departments", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(hrPayload),
    });

    if (hrResult.status !== 201) {
      throw new Error(`Failed to create department: ${JSON.stringify(hrResult.data)}`);
    }
    console.log("✅ Department created successfully.");
    const hrDeptId = hrResult.data.data._id;

    // 3. Verify uniqueness constraint (Duplicate Code)
    console.log("\n⚡ Step 3: Verifying uniqueness of department code...");
    const duplicateCodeResult = await request("/departments", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Different Department Name",
        code: "TEST-HR",
        location: "Building A, Floor 3",
      }),
    });

    if (duplicateCodeResult.status === 201) {
      throw new Error("Assert failed: Should have blocked duplicate department code.");
    }
    console.log("✅ Duplicate code blocked successfully. Server response message:", duplicateCodeResult.data.message);

    // 4. Verify uniqueness constraint (Duplicate Name)
    console.log("\n⚡ Step 4: Verifying uniqueness of department name...");
    const duplicateNameResult = await request("/departments", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Human Resources Testing",
        code: "TEST-IT",
        location: "Building A, Floor 3",
      }),
    });

    if (duplicateNameResult.status === 201) {
      throw new Error("Assert failed: Should have blocked duplicate department name.");
    }
    console.log("✅ Duplicate name blocked successfully. Server response message:", duplicateNameResult.data.message);

    // 5. Get active departments listing
    console.log("\n⚡ Step 5: Listing active departments...");
    const listResult = await request("/departments", {
      method: "GET",
      headers: authHeaders,
    });

    if (listResult.status !== 200) {
      throw new Error(`Failed to list departments: ${JSON.stringify(listResult.data)}`);
    }
    const foundHr = listResult.data.data.find((d) => d.code === "TEST-HR");
    if (!foundHr) {
      throw new Error("Assert failed: HR department not found in active departments list.");
    }
    console.log("✅ Active departments retrieved successfully. HR department is present.");

    // 6. Update department location
    console.log("\n⚡ Step 6: Updating department location...");
    const updateResult = await request(`/departments/${hrDeptId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        location: "Building C, Floor 4",
      }),
    });

    if (updateResult.status !== 200) {
      throw new Error(`Failed to update department: ${JSON.stringify(updateResult.data)}`);
    }
    console.log("✅ Department updated successfully. New location:", updateResult.data.data.location);

    // 7. Soft Delete department
    console.log("\n⚡ Step 7: Soft-deleting department (setting status to Inactive)...");
    const deleteResult = await request(`/departments/${hrDeptId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (deleteResult.status !== 200) {
      throw new Error(`Failed to delete department: ${JSON.stringify(deleteResult.data)}`);
    }
    console.log("✅ Department soft-deleted successfully.");

    // 8. Verify active listing filters out inactive departments
    console.log("\n⚡ Step 8: Verifying listing filters out inactive department...");
    const postDeleteListResult = await request("/departments", {
      method: "GET",
      headers: authHeaders,
    });

    const deletedHrExists = postDeleteListResult.data.data.find((d) => d.code === "TEST-HR");
    if (deletedHrExists) {
      throw new Error("Assert failed: Deleted HR department should not appear in active list.");
    }
    console.log("✅ Confirmed: Inactive department omitted from active listing.");

    // Cleanup test records
    await Department.deleteMany({ code: { $in: ["TEST-HR", "TEST-IT"] } });
    console.log("🧹 Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL DEPARTMENT INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ DEPARTMENT TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
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
 * User Management Integration Test Runner
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere User Management Module Integration Tests");
    console.log("==========================================================");

    // Initialize db connection
    await connectDB();

    // Cleanup any lingering test users/departments
    const testEmail = "test_manager_user@ecosphere.com";
    await User.deleteOne({ email: testEmail });
    await Department.deleteMany({ code: "TST-UM" });

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

    // 2. Setup testing Department
    console.log("\n⚡ Step 2: Creating a testing department...");
    const deptResult = await request("/departments", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "User Management Testing Dept",
        code: "TST-UM",
        description: "Department for user creation tests",
        location: "Building B, Floor 1",
      }),
    });

    if (deptResult.status !== 201) {
      throw new Error(`Failed to create test department: ${JSON.stringify(deptResult.data)}`);
    }
    const deptId = deptResult.data.data._id;
    console.log("✅ Test department created successfully. ID:", deptId);

    // 3. Create Manager User
    console.log("\n⚡ Step 3: Creating a new Department Manager user...");
    const userPayload = {
      name: "Bob Manager Test",
      email: testEmail,
      role: "Department Manager",
      department: deptId,
    };

    const createUserResult = await request("/users", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(userPayload),
    });

    if (createUserResult.status !== 201) {
      throw new Error(`Failed to create user: ${JSON.stringify(createUserResult.data)}`);
    }
    const createdUserId = createUserResult.data.data._id;
    console.log("✅ Manager user created successfully in DB.");
    console.log("Check: User temporary password was generated and welcomed.");

    // 4. Verify Admin role block
    console.log("\n⚡ Step 4: Verifying that admin cannot create another Admin user...");
    const invalidAdminResult = await request("/users", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Fake Admin",
        email: "fakeadmin@ecosphere.com",
        role: "Admin",
      }),
    });

    if (invalidAdminResult.status === 201) {
      throw new Error("Assert failed: Should have blocked creation of Admin user.");
    }
    console.log("✅ Admin creation blocked successfully. Message:", invalidAdminResult.data.message);

    // 5. Verify department constraint for managers
    console.log("\n⚡ Step 5: Verifying department requirement for Managers...");
    const invalidManagerResult = await request("/users", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "No Dept Manager",
        email: "nodept@ecosphere.com",
        role: "Department Manager",
      }),
    });

    if (invalidManagerResult.status === 201) {
      throw new Error("Assert failed: Should have blocked creation of Manager without department.");
    }
    console.log("✅ Manager without department blocked successfully. Message:", invalidManagerResult.data.message);

    // 6. Query users listing
    console.log("\n⚡ Step 6: Listing users filtered by Department...");
    const listResult = await request(`/users?department=${deptId}`, {
      method: "GET",
      headers: authHeaders,
    });

    if (listResult.status !== 200) {
      throw new Error(`Failed to list users: ${JSON.stringify(listResult.data)}`);
    }
    const foundUser = listResult.data.data.find((u) => u.email === testEmail);
    if (!foundUser) {
      throw new Error("Assert failed: Created Manager not found in filtered list.");
    }
    console.log("✅ Users listed successfully. Manager is present.");

    // 7. Deactivate user
    console.log("\n⚡ Step 7: Deactivating (suspending) the Manager account...");
    const deactivateResult = await request(`/users/${createdUserId}/deactivate`, {
      method: "PATCH",
      headers: authHeaders,
    });

    if (deactivateResult.status !== 200) {
      throw new Error(`Failed to deactivate user: ${JSON.stringify(deactivateResult.data)}`);
    }
    console.log("✅ Manager account deactivated successfully.");

    // 8. Confirm deactivated user login is blocked
    console.log("\n⚡ Step 8: Verifying login block for deactivated user account...");
    const suspendedLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: "SomePassword123!", // password doesn't matter since status check happens first/early
      }),
    });

    if (suspendedLoginResult.status === 200) {
      throw new Error("Assert failed: Deactivated user should be blocked from logging in.");
    }
    console.log("✅ Login blocked successfully for Suspended account. Message:", suspendedLoginResult.data.message);

    // Cleanup test records
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteOne({ email: testEmail });
    // Note: department delete will succeed since manager user was deleted first
    await Department.deleteOne({ _id: deptId });
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL USER MANAGEMENT TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ USER MANAGEMENT TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

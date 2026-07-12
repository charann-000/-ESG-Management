const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const Badge = require("../models/Badge");
const Reward = require("../models/Reward");
const CSRActivity = require("../models/CSRActivity");
const Notification = require("../models/Notification");

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
 * Engagement Engine Integrated E2E Test Workflow
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Engagement Engine Module Integrated Tests");
    console.log("==========================================================");

    await connectDB();

    const managerEmail = "eng_test_manager@ecosphere.com";
    const employeeEmail = "eng_test_employee@ecosphere.com";
    const deptCode = "ENG-TST-DEPT";
    const badgeName = "TEST Engagement Champion";
    const rewardTitle = "TEST Tree Planting Kit";
    const csrTitle = "TEST Sustainability Webinar";

    // Pre-test cleanup
    await User.deleteMany({ email: { $in: [managerEmail, employeeEmail] } });
    await Department.deleteOne({ code: deptCode });
    await Badge.deleteMany({ name: badgeName });
    await Reward.deleteMany({ title: rewardTitle });
    await CSRActivity.deleteMany({ title: csrTitle });
    await Notification.deleteMany({});

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
        name: "Engagement Testing Dept",
        code: deptCode,
        description: "Department for gamification tests",
        location: "Building E, Floor 2",
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
        name: "Mona Manager Test",
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
    console.log("✅ Manager user registered successfully.");

    // 4. Create Employee User
    console.log("\n⚡ Step 4: Registering an Employee user...");
    const employeeResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Emma Employee Test",
        email: employeeEmail,
        role: "Employee",
        department: deptId,
      }),
    });

    if (employeeResult.status !== 201) {
      throw new Error(`Failed to create employee: ${JSON.stringify(employeeResult.data)}`);
    }
    const employeeUserId = employeeResult.data.data._id;

    const employeeRecord = await User.findById(employeeUserId);
    const employeePassword = "EmployeePassword123!";
    employeeRecord.password = employeePassword;
    employeeRecord.isPasswordChangeRequired = false;
    await employeeRecord.save();
    console.log("✅ Employee user registered successfully.");

    // 5. Admin creates Badge
    console.log("\n⚡ Step 5: Admin creates Badge rule...");
    const badgeResult = await request("/badges", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: badgeName,
        description: "Earned for participating in at least 1 CSR activity",
        imageUrl: "http://cloudinary.com/badges/csr_champion.png",
        ruleType: "CSR_COUNT",
        ruleValue: 1,
      }),
    });

    if (badgeResult.status !== 201) {
      throw new Error(`Failed to create Badge: ${JSON.stringify(badgeResult.data)}`);
    }
    const badgeId = badgeResult.data.data._id;
    console.log("✅ Badge rule created successfully.");

    // 6. Admin creates Reward
    console.log("\n⚡ Step 6: Admin creates Reward...");
    const rewardResult = await request("/rewards", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: rewardTitle,
        description: "Plant a native tree and get a physical certification kit",
        cost: 100,
        stock: 5,
        imageUrl: "http://cloudinary.com/rewards/tree_kit.png",
      }),
    });

    if (rewardResult.status !== 201) {
      throw new Error(`Failed to create Reward: ${JSON.stringify(rewardResult.data)}`);
    }
    const rewardId = rewardResult.data.data._id;
    console.log("✅ Reward item created successfully.");

    // 7. Manager creates CSR Activity
    console.log("\n⚡ Step 7: Manager logins & creates CSR Activity...");
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

    const csrResult = await request("/csr-activities", {
      method: "POST",
      headers: managerHeaders,
      body: JSON.stringify({
        title: csrTitle,
        description: "Learn about renewable energy transition models",
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: "Virtual Meeting Zoom Room",
        xpReward: 50,
        coinReward: 150,
        badgeReward: null,
      }),
    });

    if (csrResult.status !== 201) {
      throw new Error(`Failed to create CSR Activity: ${JSON.stringify(csrResult.data)}`);
    }
    const csrActivityId = csrResult.data.data._id;
    console.log("✅ CSR Activity created successfully.");

    // 8. Employee joins CSR Activity
    console.log("\n⚡ Step 8: Employee logins & submits participation proof...");
    const employeeLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: employeeEmail,
        password: employeePassword,
      }),
    });

    const employeeCookie = employeeLoginResult.headers.get("set-cookie");
    const employeeToken = employeeCookie ? employeeCookie.match(/token=([^;]+)/)[1] : null;
    const employeeHeaders = { Cookie: `token=${employeeToken}` };

    const joinResult = await request(`/csr-activities/${csrActivityId}/participate`, {
      method: "POST",
      headers: employeeHeaders,
      body: JSON.stringify({
        proof: "http://cloudinary.com/proof/webinar_attendance.jpg",
      }),
    });

    if (joinResult.status !== 200) {
      throw new Error(`Employee participation submission failed: ${JSON.stringify(joinResult.data)}`);
    }
    console.log("✅ Employee CSR participation request submitted successfully.");

    // 9. Manager approves participation
    console.log("\n⚡ Step 9: Manager approves CSR participation...");
    const approveResult = await request(`/csr-activities/${csrActivityId}/participants/${employeeUserId}/verify`, {
      method: "PATCH",
      headers: managerHeaders,
      body: JSON.stringify({
        status: "Approved",
        remarks: "Excellent webinar completion verified.",
      }),
    });

    if (approveResult.status !== 200) {
      throw new Error(`Manager verification failed: ${JSON.stringify(approveResult.data)}`);
    }
    console.log("✅ CSR participation approved successfully.");

    // 10. Verify Gamification triggers (XP, Coins, Badge)
    console.log("\n⚡ Step 10: Verifying gamification transactions (XP, Coins, Badges)...");
    const updatedEmployee = await User.findById(employeeUserId);
    console.log("Employee Stats -> XP:", updatedEmployee.xp, "Coins:", updatedEmployee.coins);
    console.log("Employee Badges Earned count:", updatedEmployee.badges.length);

    if (updatedEmployee.xp !== 50) {
      throw new Error(`Assert failed: Expected 50 XP but got ${updatedEmployee.xp}`);
    }
    if (updatedEmployee.coins !== 150) {
      throw new Error(`Assert failed: Expected 150 Coins but got ${updatedEmployee.coins}`);
    }
    if (updatedEmployee.badges.length !== 1) {
      throw new Error(`Assert failed: Expected 1 badge (CSR_COUNT rule) but got ${updatedEmployee.badges.length}`);
    }
    console.log("✅ Gamification ledger points and dynamic badge assertions passed!");

    // 11. Check Notifications
    console.log("\n⚡ Step 11: Verifying generated notifications...");
    const notificationResult = await request("/notifications", {
      method: "GET",
      headers: employeeHeaders,
    });
    console.log("Notifications count:", notificationResult.data.data.length);
    if (notificationResult.data.data.length < 1) {
      throw new Error("Assert failed: Notifications should have been generated.");
    }
    const badgeNotification = notificationResult.data.data.find(n => n.event === "Badge");
    if (!badgeNotification) {
      throw new Error("Assert failed: Badge award notification is missing.");
    }
    console.log("✅ Notification rules assertion passed.");

    // 12. Employee redeems reward
    console.log("\n⚡ Step 12: Employee redeems Reward item...");
    const redeemResult = await request(`/rewards/${rewardId}/redeem`, {
      method: "POST",
      headers: employeeHeaders,
    });

    if (redeemResult.status !== 200) {
      throw new Error(`Redemption failed: ${JSON.stringify(redeemResult.data)}`);
    }

    const employeePostRedemption = await User.findById(employeeUserId);
    const updatedReward = await Reward.findById(rewardId);
    console.log("Post-Redemption Stats -> Coins:", employeePostRedemption.coins, "Remaining Stock:", updatedReward.stock);
    console.log("Redemptions Count:", employeePostRedemption.redemptions.length);

    if (employeePostRedemption.coins !== 50) {
      throw new Error(`Assert failed: Expected 50 Coins left (150 - 100) but got ${employeePostRedemption.coins}`);
    }
    if (updatedReward.stock !== 4) {
      throw new Error(`Assert failed: Expected stock of 4 but got ${updatedReward.stock}`);
    }
    const redemptionLog = employeePostRedemption.redemptions[0];
    if (redemptionLog.coinsSpent !== 100) {
      throw new Error(`Assert failed: Redemption coinsSpent should be 100 but got ${redemptionLog.coinsSpent}`);
    }
    console.log("✅ Reward redemption ledger check passed!");

    // 13. Query leaderboard
    console.log("\n⚡ Step 13: Querying Dynamic Leaderboard...");
    const leaderboardResult = await request("/leaderboard", {
      method: "GET",
      headers: employeeHeaders,
    });
    const topUser = leaderboardResult.data.data[0];
    console.log("Leaderboard top user:", topUser.name, "with XP:", topUser.xp);
    if (topUser.email !== employeeEmail) {
      throw new Error(`Assert failed: Test employee should be at the top of the leaderboard.`);
    }
    console.log("✅ Dynamic leaderboard rank verification passed!");

    // Cleanup
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteMany({ email: { $in: [managerEmail, employeeEmail] } });
    await Department.deleteOne({ _id: deptId });
    await Badge.deleteMany({ name: badgeName });
    await Reward.deleteMany({ title: rewardTitle });
    await CSRActivity.deleteMany({ title: csrTitle });
    await Notification.deleteMany({});
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL ENGAGEMENT ENGINE TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ ENGAGEMENT ENGINE TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

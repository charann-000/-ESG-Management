const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const Operation = require("../models/Operation");
const CSRActivity = require("../models/CSRActivity");
const Challenge = require("../models/Challenge");
const ComplianceIssue = require("../models/ComplianceIssue");
const Policy = require("../models/Policy");
const Audit = require("../models/Audit");
const Reward = require("../models/Reward");
const Badge = require("../models/Badge");
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
 * Analytics & Reporting Engine Integrated E2E Test Workflow
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Analytics & Reporting Engine Integrated Tests");
    console.log("==========================================================");

    await connectDB();

    const auditorEmail = "anl_test_auditor@ecosphere.com";
    const managerEmail = "anl_test_manager@ecosphere.com";
    const employeeEmail = "anl_test_employee@ecosphere.com";
    const deptCode = "ANL-TST-DEPT";
    const policyTitle = "TEST Analytics Integrity Policy";
    const operationCategory = "Electricity";

    // Pre-test cleanup
    await User.deleteMany({ email: { $in: [auditorEmail, managerEmail, employeeEmail] } });
    await Department.deleteOne({ code: deptCode });
    await Policy.deleteMany({ title: policyTitle });
    await Operation.deleteMany({});
    await EmissionFactor.deleteMany({ name: "TEST Electricity Factor" });
    await ComplianceIssue.deleteMany({});
    await Audit.deleteMany({});
    await Challenge.deleteMany({});
    await CSRActivity.deleteMany({});
    await Reward.deleteMany({});
    await Badge.deleteMany({});

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
        name: "Analytics Testing Dept",
        code: deptCode,
        description: "Department for analytics dashboard tests",
        location: "Building H, Floor 4",
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
        name: "Anil Manager Test",
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
    const managerPassword = "ManagerPassword123!";
    managerRecord.password = managerPassword;
    managerRecord.isPasswordChangeRequired = false;
    await managerRecord.save();
    console.log("✅ Manager user registered successfully.");

    // 4. Create Employee User
    console.log("\n⚡ Step 4: Registering an Employee user...");
    const employeeResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Ana Employee Test",
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

    // 5. Seed sample Operation records
    console.log("\n⚡ Step 5: Seeding sample operation data...");
    const adminUser = await User.findOne({ email: "admin@ecosphere.com" });
    const factor = await EmissionFactor.create({
      name: "TEST Electricity Factor",
      activityType: "Electricity",
      factor: 0.84,
      unit: "kWh",
      source: "National grid",
      year: new Date().getFullYear(),
      createdBy: adminUser._id,
    });

    await Operation.create({
      type: "Electricity",
      department: deptId,
      quantity: 500,
      unit: "kWh",
      emissionFactor: factor._id,
      carbonEmission: 420,
      evidenceFiles: ["http://cloudinary.com/evidence/invoice.pdf"],
      recordedBy: employeeUserId,
      description: "Test operation logging",
      date: new Date(),
      status: "Active",
    });
    console.log("✅ Operation data seeded.");

    // 6. Test Admin overview analytics API
    console.log("\n⚡ Step 6: Querying Admin Dashboard Analytics...");
    const overviewResult = await request("/analytics/overview", {
      method: "GET",
      headers: adminHeaders,
    });

    if (overviewResult.status !== 200) {
      throw new Error(`Overview analytics failed: ${JSON.stringify(overviewResult.data)}`);
    }
    const overview = overviewResult.data.data;
    console.log("Admin Overview -> Total Carbon Emissions:", overview.totalCarbon);
    console.log("Admin Overview -> Total Employees:", overview.totalEmployees);
    if (overview.totalEmployees !== 1) {
      throw new Error(`Assert failed: Expected 1 active employee but got ${overview.totalEmployees}`);
    }
    console.log("✅ Admin Dashboard overview validation passed.");

    // 7. Test Manager Scoped Department Analytics API
    console.log("\n⚡ Step 7: Manager logins & queries Department Dashboard...");
    const managerLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: managerEmail,
        password: managerPassword,
      }),
    });

    const managerCookie = managerLoginResult.headers.get("set-cookie");
    const managerToken = managerCookie ? managerCookie.match(/token=([^;]+)/)[1] : null;
    const managerHeaders = { Cookie: `token=${managerToken}` };

    const deptAnalyticsResult = await request("/analytics/department", {
      method: "GET",
      headers: managerHeaders,
    });

    if (deptAnalyticsResult.status !== 200) {
      throw new Error(`Department analytics failed: ${JSON.stringify(deptAnalyticsResult.data)}`);
    }
    const deptAnalytics = deptAnalyticsResult.data.data;
    console.log("Manager Analytics -> Department Code:", deptAnalytics.department.code);
    console.log("Manager Analytics -> Employees count:", deptAnalytics.activeEmployeesCount);
    if (deptAnalytics.department.code !== deptCode) {
      throw new Error(`Assert failed: Scoped department code should be ${deptCode}`);
    }
    console.log("✅ Manager Department scope validation passed.");

    // 8. Test Employee Scoped personal analytics API
    console.log("\n⚡ Step 8: Employee logins & queries Profile Dashboard...");
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

    const myAnalyticsResult = await request("/analytics/me", {
      method: "GET",
      headers: employeeHeaders,
    });

    if (myAnalyticsResult.status !== 200) {
      throw new Error(`Employee personal analytics failed: ${JSON.stringify(myAnalyticsResult.data)}`);
    }
    const myAnalytics = myAnalyticsResult.data.data;
    console.log("Employee Stats -> Personal Carbon Contribution:", myAnalytics.carbonContribution);
    console.log("Employee Stats -> globalRank:", myAnalytics.globalRank);
    if (myAnalytics.carbonContribution !== 420) {
      throw new Error(`Assert failed: Carbon contribution should be 420 but got ${myAnalytics.carbonContribution}`);
    }
    console.log("✅ Employee Personal scope validation passed.");

    // 9. Test PDF Streaming Download
    console.log("\n⚡ Step 9: Verifying ESG PDF Report streaming...");
    const pdfResponse = await fetch("http://localhost:5000/api/reports/esg/pdf", {
      headers: adminHeaders,
    });
    console.log("PDF Response status:", pdfResponse.status);
    console.log("PDF Response content-type:", pdfResponse.headers.get("content-type"));

    if (pdfResponse.status !== 200) {
      throw new Error("Assert failed: PDF endpoint did not return 200");
    }
    if (pdfResponse.headers.get("content-type") !== "application/pdf") {
      throw new Error("Assert failed: PDF endpoint did not return correct Content-Type header");
    }
    console.log("✅ PDF streaming checks passed.");

    // 10. Test Excel Streaming Download
    console.log("\n⚡ Step 10: Verifying ESG Excel Report streaming...");
    const excelResponse = await fetch("http://localhost:5000/api/reports/esg/excel", {
      headers: adminHeaders,
    });
    console.log("Excel Response status:", excelResponse.status);
    console.log("Excel Response content-type:", excelResponse.headers.get("content-type"));

    if (excelResponse.status !== 200) {
      throw new Error("Assert failed: Excel endpoint did not return 200");
    }
    if (excelResponse.headers.get("content-type") !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      throw new Error("Assert failed: Excel endpoint did not return correct Content-Type header");
    }
    console.log("✅ Excel streaming checks passed.");

    // Cleanup
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteMany({ email: { $in: [auditorEmail, managerEmail, employeeEmail] } });
    await Department.deleteOne({ _id: deptId });
    await Policy.deleteMany({ title: policyTitle });
    await Operation.deleteMany({ category: operationCategory });
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL ANALYTICS ENGINE TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ ANALYTICS ENGINE TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

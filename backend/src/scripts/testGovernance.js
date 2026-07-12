const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const Policy = require("../models/Policy");
const Audit = require("../models/Audit");
const ComplianceIssue = require("../models/ComplianceIssue");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

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
 * Governance Engine Integrated E2E Test Workflow
 */
const run = async () => {
  try {
    console.log("==========================================================");
    console.log("🧪 EcoSphere Governance Engine Module Integrated Tests");
    console.log("==========================================================");

    await connectDB();

    const auditorEmail = "gov_test_auditor@ecosphere.com";
    const managerEmail = "gov_test_manager@ecosphere.com";
    const employeeEmail = "gov_test_employee@ecosphere.com";
    const deptCode = "GOV-TST-DEPT";
    const policyTitle = "TEST ESG Reporting Integrity Policy";
    const auditTitle = "TEST Annual Emission Accuracy Audit";
    const issueTitle = "TEST Missing Operational Invoices Violation";

    // Pre-test cleanup
    await User.deleteMany({ email: { $in: [auditorEmail, managerEmail, employeeEmail] } });
    await Department.deleteOne({ code: deptCode });
    await Policy.deleteMany({ title: policyTitle });
    await Audit.deleteMany({ title: auditTitle });
    await ComplianceIssue.deleteMany({ title: issueTitle });
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
        name: "Governance Testing Dept",
        code: deptCode,
        description: "Department for compliance governance tests",
        location: "Building F, Floor 1",
      }),
    });

    if (deptResult.status !== 201) {
      throw new Error(`Failed to create test department: ${JSON.stringify(deptResult.data)}`);
    }
    const deptId = deptResult.data.data._id;
    console.log("✅ Test department created successfully. ID:", deptId);

    // 3. Create Auditor User
    console.log("\n⚡ Step 3: Registering an Auditor user...");
    const auditorResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Ada Auditor Test",
        email: auditorEmail,
        role: "Auditor",
        department: deptId,
      }),
    });

    if (auditorResult.status !== 201) {
      throw new Error(`Failed to create auditor: ${JSON.stringify(auditorResult.data)}`);
    }
    const auditorUserId = auditorResult.data.data._id;

    const auditorRecord = await User.findById(auditorUserId);
    const auditorPassword = "AuditorPassword123!";
    auditorRecord.password = auditorPassword;
    auditorRecord.isPasswordChangeRequired = false;
    await auditorRecord.save();
    console.log("✅ Auditor user registered successfully.");

    // 4. Create Manager User
    console.log("\n⚡ Step 4: Registering a Department Manager user...");
    const managerResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Mark Manager Test",
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

    // 5. Create Employee User
    console.log("\n⚡ Step 5: Registering an Employee user...");
    const employeeResult = await request("/users", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Eric Employee Test",
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

    // 6. Admin creates and publishes a Policy
    console.log("\n⚡ Step 6: Admin creates and publishes a Policy...");
    const policyResult = await request("/policies", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: policyTitle,
        description: "Standard operating procedure for data auditing and reporting.",
        documentUrl: "http://cloudinary.com/policy/sop.pdf",
      }),
    });

    if (policyResult.status !== 201) {
      throw new Error(`Failed to publish policy: ${JSON.stringify(policyResult.data)}`);
    }
    const policyId = policyResult.data.data._id;
    console.log("✅ Policy published successfully. ID:", policyId);

    // 7. Employee accepts the Policy
    console.log("\n⚡ Step 7: Employee logins & accepts the Policy...");
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

    const acceptResult = await request(`/policies/${policyId}/accept`, {
      method: "POST",
      headers: employeeHeaders,
    });

    if (acceptResult.status !== 200) {
      throw new Error(`Employee policy acceptance failed: ${JSON.stringify(acceptResult.data)}`);
    }
    console.log("✅ Policy accepted by Employee.");

    // Check Department Governance rating updates
    const deptState = await Department.findById(deptId);
    console.log("Post-acceptance Department Governance Score:", deptState.governanceScore);

    // 8. Auditor schedules Audit for the Department
    console.log("\n⚡ Step 8: Auditor logins & schedules Audit...");
    const auditorLoginResult = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: auditorEmail,
        password: auditorPassword,
      }),
    });

    const auditorCookie = auditorLoginResult.headers.get("set-cookie");
    const auditorToken = auditorCookie ? auditorCookie.match(/token=([^;]+)/)[1] : null;
    const auditorHeaders = { Cookie: `token=${auditorToken}` };

    const auditResult = await request("/audits", {
      method: "POST",
      headers: auditorHeaders,
      body: JSON.stringify({
        title: auditTitle,
        department: deptId,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        endDate: new Date().toISOString(),
        auditedBy: auditorUserId,
      }),
    });

    if (auditResult.status !== 201) {
      throw new Error(`Auditor failed to schedule audit: ${JSON.stringify(auditResult.data)}`);
    }
    const auditId = auditResult.data.data._id;
    console.log("✅ Audit scheduled successfully.");

    // 9. Auditor completes Audit with findings
    console.log("\n⚡ Step 9: Auditor completes Audit with findings...");
    const completeResult = await request(`/audits/${auditId}/complete`, {
      method: "POST",
      headers: auditorHeaders,
      body: JSON.stringify({
        findings: "ESG emission records did not attach required invoices.",
        operationsAudited: [],
      }),
    });

    if (completeResult.status !== 200) {
      throw new Error(`Auditor failed to complete audit: ${JSON.stringify(completeResult.data)}`);
    }
    console.log("✅ Audit completed successfully.");

    // 10. Auditor logs a Compliance Issue
    console.log("\n⚡ Step 10: Auditor logs a Compliance Issue...");
    const issueResult = await request("/compliance-issues", {
      method: "POST",
      headers: auditorHeaders,
      body: JSON.stringify({
        title: issueTitle,
        description: "Audit detected missing documentation proof.",
        department: deptId,
        audit: auditId,
        severity: "High",
      }),
    });

    if (issueResult.status !== 201) {
      throw new Error(`Auditor failed to log compliance issue: ${JSON.stringify(issueResult.data)}`);
    }
    const issueId = issueResult.data.data._id;
    console.log("✅ Compliance issue logged successfully.");

    // 11. Manager logins & resolves Compliance Issue uploading proof
    console.log("\n⚡ Step 11: Manager logins & uploads resolution proof...");
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

    const resolveResult = await request(`/compliance-issues/${issueId}/resolve`, {
      method: "PATCH",
      headers: managerHeaders,
      body: JSON.stringify({
        resolutionDetails: "All missing PDF invoices have been uploaded to Cloudinary folder.",
        proof: "http://cloudinary.com/proof/invoices_restored.zip",
      }),
    });

    if (resolveResult.status !== 200) {
      throw new Error(`Manager failed to resolve issue: ${JSON.stringify(resolveResult.data)}`);
    }
    console.log("✅ Compliance issue resolved with proof.");

    // 12. Auditor reviews and closes Compliance Issue
    console.log("\n⚡ Step 12: Auditor reviews and closes Compliance Issue...");
    const verifyResult = await request(`/compliance-issues/${issueId}/verify`, {
      method: "PATCH",
      headers: auditorHeaders,
      body: JSON.stringify({
        status: "Verified",
        verificationDetails: "Resolution proof validated successfully. Closing violation.",
      }),
    });

    if (verifyResult.status !== 200) {
      throw new Error(`Auditor failed to verify and close issue: ${JSON.stringify(verifyResult.data)}`);
    }
    console.log("✅ Compliance issue verified and closed.");

    // 13. Verify dynamic score recalculated
    console.log("\n⚡ Step 13: Verifying final department ESG ratings...");
    const finalDeptState = await Department.findById(deptId);
    console.log("Final Department Governance Rating:", finalDeptState.governanceScore);
    console.log("Final Department ESG Rating:", finalDeptState.overallEsgScore);

    // We have 1 active policy accepted by 1/1 active employees -> 100% policy acceptance
    // We have 1 compliance issue resolved & verified -> 100% compliance resolution
    // Expected Governance Score = Math.round(0.4 * 100 + 0.6 * 100) = 100
    if (finalDeptState.governanceScore !== 100) {
      throw new Error(`Assert failed: Governance score should be 100 but got ${finalDeptState.governanceScore}`);
    }
    console.log("✅ Dynamic Governance score assertions passed!");

    // 14. Admin compiles compliance report
    console.log("\n⚡ Step 14: Admin generates Governance Report...");
    const reportResult = await request("/reports/governance", {
      method: "GET",
      headers: adminHeaders,
    });

    if (reportResult.status !== 200) {
      throw new Error(`Failed to compile report: ${JSON.stringify(reportResult.data)}`);
    }
    console.log("Report active policies count:", reportResult.data.data.summary.activePolicies);
    console.log("Report closed issues count:", reportResult.data.data.summary.closedComplianceIssues);
    console.log("✅ Governance reports successfully compiled!");

    // Cleanup
    console.log("\n🧹 Cleaning up test database records...");
    await User.deleteMany({ email: { $in: [auditorEmail, managerEmail, employeeEmail] } });
    await Department.deleteOne({ _id: deptId });
    await Policy.deleteMany({ title: policyTitle });
    await Audit.deleteMany({ title: auditTitle });
    await ComplianceIssue.deleteMany({ title: issueTitle });
    await Notification.deleteMany({});
    console.log("✅ Cleanup complete.");

    console.log("\n==========================================================");
    console.log("🎉 ALL GOVERNANCE WORKFLOW E2E TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ GOVERNANCE WORKFLOW E2E TESTS FAILED:", err);
    process.exit(1);
  }
};

run();

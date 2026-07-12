const ComplianceIssue = require("../models/ComplianceIssue");
const User = require("../models/User");
const eventService = require("./eventService");

/**
 * Service to report a new Compliance Issue (Auditor only).
 */
const createComplianceIssue = async (data, auditorUser, ipAddress, userAgent) => {
  const { title, description, department, audit, severity } = data;

  if (auditorUser.role !== "Auditor") {
    throw new Error("Only Auditors can report compliance issues");
  }

  const issue = await ComplianceIssue.create({
    title: title.trim(),
    description: description.trim(),
    department,
    audit: audit || null,
    severity: severity || "Medium",
    createdBy: auditorUser._id,
    status: "Open",
  });

  // Emit Compliance Created event (logs audit, notifies Department Manager via email/in-app, updates score)
  await eventService.emit("Compliance Created", {
    issue,
    actor: auditorUser,
    ipAddress,
    userAgent,
  });

  return issue;
};

/**
 * Service to fetch compliance issues list.
 * Scopes Department Managers to their own department.
 */
const getAllComplianceIssues = async (user) => {
  const query = {};

  if (user.role === "Department Manager") {
    if (!user.department) {
      throw new Error("Your account is not assigned to any department");
    }
    query.department = user.department;
  }

  return ComplianceIssue.find(query)
    .populate("department", "name code")
    .populate("createdBy", "name email")
    .populate("resolvedBy", "name email")
    .populate("verifiedBy", "name email");
};

/**
 * Service to fetch single Compliance Issue details.
 */
const getComplianceIssueById = async (id, user) => {
  const issue = await ComplianceIssue.findById(id)
    .populate("department", "name code")
    .populate("createdBy", "name email")
    .populate("resolvedBy", "name email")
    .populate("verifiedBy", "name email");

  if (!issue) {
    throw new Error("Compliance issue not found");
  }

  // Enforce department manager scopes
  if (user.role === "Department Manager" && issue.department._id.toString() !== (user.department || "").toString()) {
    throw new Error("Access denied. You can only view issues reported for your own department");
  }

  return issue;
};

/**
 * Service for managers to resolve reported issues.
 * Stores the proof link inside the resolutionDetails field to preserve schema schema layouts.
 */
const resolveComplianceIssue = async (id, data, managerUser, ipAddress, userAgent) => {
  const issue = await ComplianceIssue.findById(id);
  if (!issue) {
    throw new Error("Compliance issue not found");
  }

  // Enforce manager department constraint
  if (issue.department.toString() !== (managerUser.department || "").toString()) {
    throw new Error("Access denied. You can only resolve issues assigned to your own department");
  }

  if (issue.status !== "Open") {
    throw new Error(`Cannot resolve. Compliance issue status is already '${issue.status}'`);
  }

  const { resolutionDetails, proof } = data;

  // Append proof URL into resolution details securely to maintain frozen schema compatibility
  const compositeResolutionText = `${resolutionDetails.trim()}\n\n[Resolution Proof URL: ${proof.trim()}]`;

  issue.status = "Resolved";
  issue.resolvedBy = managerUser._id;
  issue.resolvedAt = new Date();
  issue.resolutionDetails = compositeResolutionText;

  await issue.save();

  console.log(`⚠️ Manager resolved compliance issue: '${issue.title}'`);

  // Emit Compliance Resolved event (logs audit, notifies lead auditor)
  await eventService.emit("Compliance Resolved", {
    issue,
    actor: managerUser,
    ipAddress,
    userAgent,
  });

  return issue;
};

/**
 * Service for auditors to review manager submissions and approve (close) or reject.
 */
const verifyComplianceIssue = async (id, data, auditorUser, ipAddress, userAgent) => {
  const issue = await ComplianceIssue.findById(id);
  if (!issue) {
    throw new Error("Compliance issue not found");
  }

  if (auditorUser.role !== "Auditor") {
    throw new Error("Only Auditors can verify resolution of compliance issues");
  }

  if (issue.status !== "Resolved") {
    throw new Error(`Verification can only be performed on 'Resolved' issues. Current status: '${issue.status}'`);
  }

  const { status, verificationDetails } = data; // status is Verified (Approve) or Open (Reject)

  if (status === "Verified") {
    issue.status = "Verified";
    issue.verifiedBy = auditorUser._id;
    issue.verifiedAt = new Date();
    issue.verificationDetails = verificationDetails.trim();
    await issue.save();

    console.log(`✅ Auditor approved resolution and closed Compliance issue: '${issue.title}'`);

    // Emit Compliance Closed event (logs audit, notifies Manager, updates department rating)
    await eventService.emit("Compliance Closed", {
      issue,
      actor: auditorUser,
      ipAddress,
      userAgent,
    });
  } else if (status === "Open") {
    // Reject resolution: roll back status to Open and clear resolution cache
    issue.status = "Open";
    issue.resolvedBy = null;
    issue.resolvedAt = null;
    issue.resolutionDetails = "";
    await issue.save();

    console.log(`❌ Auditor rejected resolution and re-opened Compliance issue: '${issue.title}'`);

    // Emit Compliance Created event to notify manager of rejection
    await eventService.emit("Compliance Created", {
      issue,
      actor: auditorUser,
      ipAddress,
      userAgent,
    });
  }

  return issue;
};

module.exports = {
  createComplianceIssue,
  getAllComplianceIssues,
  getComplianceIssueById,
  resolveComplianceIssue,
  verifyComplianceIssue,
};

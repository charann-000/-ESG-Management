const Audit = require("../models/Audit");
const User = require("../models/User");
const eventService = require("./eventService");

/**
 * Service to schedule a new Audit.
 */
const createAudit = async (data, actorUser, ipAddress, userAgent) => {
  const { title, department, startDate, endDate, auditedBy } = data;

  // Verify that the assigned auditor actually exists and has role Auditor
  const auditor = await User.findById(auditedBy);
  if (!auditor || auditor.role !== "Auditor") {
    throw new Error("Assigned lead auditor must be a user with the role 'Auditor'");
  }

  const audit = await Audit.create({
    title: title.trim(),
    department,
    startDate,
    endDate,
    auditedBy,
    status: "Scheduled",
  });

  // Emit Audit Created event (logs audit, notifies lead auditor via email/in-app)
  await eventService.emit("Audit Created", {
    audit,
    actor: actorUser,
    ipAddress,
    userAgent,
  });

  return audit;
};

/**
 * Service to retrieve Audits list.
 * Scopes Department Managers to their own department.
 */
const getAllAudits = async (user) => {
  const query = {};

  if (user.role === "Department Manager") {
    if (!user.department) {
      throw new Error("Your account is not assigned to any department");
    }
    query.department = user.department;
  } else if (user.role === "Auditor") {
    // Auditors can see audits assigned to them, or all audits. Let's show all audits.
  }

  return Audit.find(query)
    .populate("department", "name code")
    .populate("auditedBy", "name email");
};

/**
 * Service to get single Audit with scope permissions.
 */
const getAuditById = async (id, user) => {
  const audit = await Audit.findById(id)
    .populate("department", "name code")
    .populate("auditedBy", "name email");

  if (!audit) {
    throw new Error("Audit not found");
  }

  // Scoping restriction for managers
  if (user.role === "Department Manager" && audit.department._id.toString() !== (user.department || "").toString()) {
    throw new Error("Access denied. You can only view audits of your own department");
  }

  return audit;
};

/**
 * Service to update audit scheduling or in-progress details.
 */
const updateAudit = async (id, data, auditorUser, ipAddress, userAgent) => {
  const audit = await Audit.findById(id);
  if (!audit) {
    throw new Error("Audit not found");
  }

  // Restrict updates to assigned lead auditor or Admin
  if (auditorUser.role !== "Admin" && audit.auditedBy.toString() !== auditorUser._id.toString()) {
    throw new Error("Access denied. Only the assigned lead auditor can modify this record");
  }

  const { title, findings, operationsAudited, status } = data;

  if (title) audit.title = title.trim();
  if (findings !== undefined) audit.findings = findings.trim();
  if (operationsAudited) audit.operationsAudited = operationsAudited;
  if (status) audit.status = status;

  await audit.save();

  return audit;
};

/**
 * Service to finalize and complete the Audit.
 */
const completeAudit = async (id, data, auditorUser, ipAddress, userAgent) => {
  const audit = await Audit.findById(id);
  if (!audit) {
    throw new Error("Audit not found");
  }

  // Restrict completion to assigned lead auditor
  if (audit.auditedBy.toString() !== auditorUser._id.toString()) {
    throw new Error("Access denied. Only the assigned lead auditor can complete this audit");
  }

  const { findings, operationsAudited } = data;

  audit.findings = findings.trim();
  if (operationsAudited) {
    audit.operationsAudited = operationsAudited;
  }
  audit.status = "Completed";

  await audit.save();

  console.log(`🔍 Audit completed successfully: '${audit.title}'`);

  // Emit Audit Completed event (logs audit, notifies Department Manager)
  await eventService.emit("Audit Completed", {
    audit,
    actor: auditorUser,
    ipAddress,
    userAgent,
  });

  return audit;
};

module.exports = {
  createAudit,
  getAllAudits,
  getAuditById,
  updateAudit,
  completeAudit,
};

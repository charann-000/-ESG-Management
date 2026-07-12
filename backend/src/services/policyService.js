const Policy = require("../models/Policy");
const User = require("../models/User");
const Department = require("../models/Department");
const eventService = require("./eventService");

/**
 * Service to create and publish a new Policy.
 */
const createPolicy = async (data, adminUser, ipAddress, userAgent) => {
  const { title, description, documentUrl } = data;

  if (adminUser.role !== "Admin") {
    throw new Error("Only Administrators can publish policies");
  }

  // 1. Uniqueness check for Policy title
  const existingPolicy = await Policy.findOne({
    title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
  });
  if (existingPolicy) {
    throw new Error("Policy title must be unique");
  }

  // 2. Create Policy
  const policy = await Policy.create({
    title: title.trim(),
    description: description.trim(),
    documentUrl: documentUrl.trim(),
    createdBy: adminUser._id,
    status: "Active",
  });

  // 3. Emit Policy Published event centrally (runs notifications, logs, emails)
  await eventService.emit("Policy Published", {
    policy,
    actor: adminUser,
    ipAddress,
    userAgent,
  });

  return policy;
};

/**
 * Service to fetch policies based on role permissions.
 */
const getAllPolicies = async (user) => {
  const query = {};
  
  // Employees and Managers only see active published policies
  if (["Employee", "Department Manager"].includes(user.role)) {
    query.status = "Active";
  }

  return Policy.find(query).populate("createdBy", "name email");
};

/**
 * Service to get individual policy.
 */
const getPolicyById = async (id) => {
  const policy = await Policy.findById(id).populate("createdBy", "name email");
  if (!policy) {
    throw new Error("Policy not found");
  }
  return policy;
};

/**
 * Service to update Policy details.
 */
const updatePolicy = async (id, data, adminUser, ipAddress, userAgent) => {
  const policy = await Policy.findById(id);
  if (!policy) {
    throw new Error("Policy not found");
  }

  const { title, description, documentUrl, status } = data;

  if (title && title.trim().toLowerCase() !== policy.title.toLowerCase()) {
    const existingPolicy = await Policy.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
      _id: { $ne: id },
    });
    if (existingPolicy) {
      throw new Error("Policy title must be unique");
    }
    policy.title = title.trim();
  }

  if (description) policy.description = description.trim();
  if (documentUrl) policy.documentUrl = documentUrl.trim();
  if (status) policy.status = status;

  await policy.save();

  return policy;
};

/**
 * Service to soft-delete/archive a Policy.
 */
const deletePolicy = async (id, adminUser, ipAddress, userAgent) => {
  const policy = await Policy.findById(id);
  if (!policy) {
    throw new Error("Policy not found");
  }

  // Soft delete: toggle status to Archived
  policy.status = "Archived";
  await policy.save();

  return true;
};

/**
 * Service for Employees to read and accept a published Policy.
 */
const acceptPolicy = async (id, employeeUser, ipAddress, userAgent) => {
  const policy = await Policy.findOne({ _id: id, status: "Active" });
  if (!policy) {
    throw new Error("Active Policy not found");
  }

  const user = await User.findById(employeeUser._id);

  // Check if already accepted
  const alreadyAccepted = user.acceptedPolicies.some(
    (ap) => ap.policy.toString() === id.toString()
  );

  if (alreadyAccepted) {
    throw new Error("You have already accepted this policy");
  }

  // Append acceptance
  user.acceptedPolicies.push({
    policy: policy._id,
    acceptedAt: new Date(),
  });

  await user.save();

  console.log(`📜 User '${user.name}' accepted policy: '${policy.title}'`);

  // Emit Policy Accepted event (recalculates department governance score)
  await eventService.emit("Policy Accepted", {
    user,
    policy,
    ipAddress,
    userAgent,
  });

  return user;
};

/**
 * Service to get department-wise acceptance rates for a Policy.
 */
const getPolicyStats = async (id) => {
  const policy = await Policy.findById(id);
  if (!policy) {
    throw new Error("Policy not found");
  }

  const departments = await Department.find({ status: "Active" });
  const stats = [];

  for (const dept of departments) {
    // Count active employees in department
    const totalEmployees = await User.countDocuments({
      department: dept._id,
      role: "Employee",
      status: "Active",
    });

    // Count employees who accepted this policy
    const acceptedCount = await User.countDocuments({
      department: dept._id,
      role: "Employee",
      status: "Active",
      "acceptedPolicies.policy": id,
    });

    const rate = totalEmployees > 0 ? (acceptedCount / totalEmployees) * 100 : 100;

    stats.push({
      departmentId: dept._id,
      departmentName: dept.name,
      departmentCode: dept.code,
      totalEmployees,
      acceptedCount,
      acceptanceRate: parseFloat(rate.toFixed(2)),
    });
  }

  return {
    policyId: policy._id,
    policyTitle: policy.title,
    stats,
  };
};

module.exports = {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  acceptPolicy,
  getPolicyStats,
};

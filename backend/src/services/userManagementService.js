const User = require("../models/User");
const Department = require("../models/Department");
const AuditLog = require("../models/AuditLog");
const { generateTempPassword } = require("../utils/helpers");
const { sendWelcomeEmail } = require("../utils/emailService");

/**
 * Creates an immutable AuditLog entry in the database.
 */
const recordAudit = async ({
  action,
  actor,
  actorRole,
  targetModel,
  targetId,
  changes = {},
  ipAddress,
  userAgent,
}) => {
  try {
    await AuditLog.create({
      action,
      actor,
      actorRole,
      targetModel,
      targetId,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("⚠️ Failed to record audit log entry:", error.message);
  }
};

/**
 * Service to create a new user (Manager, Employee, Auditor).
 */
const createUser = async (data, adminUser, ipAddress, userAgent) => {
  const { name, email, role, department } = data;

  // 1. Uniqueness check for email
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new Error("Email is already in use");
  }

  // 2. Prevent Admin creation
  if (role === "Admin") {
    throw new Error("Admin accounts cannot be created dynamically");
  }

  // 3. Department validation (if provided)
  if (department) {
    const dept = await Department.findById(department);
    if (!dept || dept.status !== "Active") {
      throw new Error("Assigned department does not exist or is inactive");
    }
  }

  // 4. Generate temporary credentials
  const temporaryPassword = generateTempPassword();

  // 5. Create user record
  // We set status to Active on creation so they can log in directly with their temporary password
  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: temporaryPassword,
    role,
    department: department || null,
    status: "Active",
    isPasswordChangeRequired: true,
    createdBy: adminUser._id,
  });

  // Remove password field from the return object
  const userResponse = newUser.toObject();
  delete userResponse.password;

  // 6. Send welcome email (asynchronous and non-blocking on failures)
  try {
    await sendWelcomeEmail(newUser.email, newUser.name, temporaryPassword);
    console.log(`📧 Welcome email dispatched to: ${newUser.email}`);
  } catch (emailError) {
    console.error(
      `❌ Failed to dispatch welcome email to ${newUser.email}. Error: ${emailError.message}`
    );
    // Silent fail for email, do NOT rollback user creation
  }

  // 7. Record CREATE audit log
  await recordAudit({
    action: "CREATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "User",
    targetId: newUser._id,
    changes: { email: newUser.email, role: newUser.role, department: newUser.department },
    ipAddress,
    userAgent,
  });

  return userResponse;
};

/**
 * Service to list users with filters.
 */
const getAllUsers = async (query = {}) => {
  const filters = {};
  
  if (query.role) filters.role = query.role;
  if (query.department) filters.department = query.department;
  if (query.status) filters.status = query.status;

  return User.find(filters)
    .select("-password")
    .populate("department", "name code");
};

/**
 * Service to get a single user by ID.
 */
const getUserById = async (id) => {
  const user = await User.findById(id).select("-password").populate("department", "name code");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

/**
 * Service to update user attributes.
 */
const updateUser = async (id, data, adminUser, ipAddress, userAgent) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  // Prevent modifying administrators
  if (user.role === "Admin" && adminUser.role !== "Admin") {
    throw new Error("You are not authorized to update administrators");
  }

  const { name, role, department, status } = data;
  const changesRecorded = {};

  // 1. Role validation
  if (role && role !== user.role) {
    if (role === "Admin") {
      throw new Error("Cannot change user role to Admin");
    }
    changesRecorded.role = { old: user.role, new: role };
    user.role = role;
  }

  // 2. Department validation
  if (department !== undefined) {
    if (department === null || department === "") {
      changesRecorded.department = { old: user.department, new: null };
      user.department = null;
    } else if (department.toString() !== (user.department || "").toString()) {
      const dept = await Department.findById(department);
      if (!dept || dept.status !== "Active") {
        throw new Error("Assigned department does not exist or is inactive");
      }
      changesRecorded.department = { old: user.department, new: department };
      user.department = department;
    }
  }

  // Ensure department requirement is still satisfied after role/dept changes
  if (["Department Manager", "Employee"].includes(user.role) && !user.department) {
    throw new Error(`Department is required for role: ${user.role}`);
  }

  if (name) {
    changesRecorded.name = { old: user.name, new: name.trim() };
    user.name = name.trim();
  }

  if (status) {
    changesRecorded.status = { old: user.status, new: status };
    user.status = status;
  }

  await user.save();

  // Log update audit event
  await recordAudit({
    action: "UPDATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "User",
    targetId: user._id,
    changes: changesRecorded,
    ipAddress,
    userAgent,
  });

  const userResponse = user.toObject();
  delete userResponse.password;
  return userResponse;
};

/**
 * Service to deactivate (Suspend) a user account.
 */
const deactivateUser = async (id, adminUser, ipAddress, userAgent) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "Admin") {
    throw new Error("Administrator accounts cannot be deactivated");
  }

  // Suspend the user
  user.status = "Suspended";
  await user.save();

  // Log deactivation audit event (mapped to UPDATE action)
  await recordAudit({
    action: "UPDATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "User",
    targetId: user._id,
    changes: { status: "Suspended" },
    ipAddress,
    userAgent,
  });

  return true;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
};

const Department = require("../models/Department");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

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
 * Service to create a new Department.
 */
const createDepartment = async (data, adminUser, ipAddress, userAgent) => {
  const { name, code, description, manager, location } = data;

  // 1. Uniqueness check for name
  const existingByName = await Department.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
  if (existingByName) {
    throw new Error("Department name must be unique");
  }

  // 2. Uniqueness check for code
  const existingByCode = await Department.findOne({ code: code.trim().toUpperCase() });
  if (existingByCode) {
    throw new Error("Department code must be unique");
  }

  // 3. Manager assignment validation
  if (manager) {
    const managerUser = await User.findById(manager);
    if (!managerUser || managerUser.role !== "Department Manager") {
      throw new Error("Assigned manager must exist and have the role 'Department Manager'");
    }

    // Check if manager is already assigned to another department
    const existingDeptWithManager = await Department.findOne({ manager });
    if (existingDeptWithManager) {
      throw new Error("Assigned manager is already leading another department");
    }
  }

  // 4. Create department record
  const department = await Department.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description,
    manager: manager || null,
    location: location.trim(),
    createdBy: adminUser._id,
  });

  // 5. Log audit event
  await recordAudit({
    action: "CREATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "Department",
    targetId: department._id,
    changes: { name: department.name, code: department.code },
    ipAddress,
    userAgent,
  });

  return department;
};

/**
 * Service to fetch all active departments.
 */
const getAllDepartments = async (query = {}) => {
  const filters = { status: "Active" };
  
  // Allow overriding filters via query if needed (e.g. for complete admin lists)
  if (query.includeInactive === "true") {
    delete filters.status;
  }

  return Department.find(filters).populate("manager", "name email");
};

/**
 * Service to fetch a single department by ID.
 */
const getDepartmentById = async (id) => {
  const department = await Department.findById(id).populate("manager", "name email");
  if (!department) {
    throw new Error("Department not found");
  }
  return department;
};

/**
 * Service to update department details.
 */
const updateDepartment = async (id, data, adminUser, ipAddress, userAgent) => {
  const department = await Department.findById(id);
  if (!department) {
    throw new Error("Department not found");
  }

  const { name, code, description, manager, location, status } = data;
  const changesRecorded = {};

  // 1. Unique name check
  if (name && name.trim().toLowerCase() !== department.name.toLowerCase()) {
    const existingByName = await Department.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });
    if (existingByName) {
      throw new Error("Department name must be unique");
    }
    changesRecorded.name = { old: department.name, new: name.trim() };
    department.name = name.trim();
  }

  // 2. Unique code check
  if (code && code.trim().toUpperCase() !== department.code) {
    const existingByCode = await Department.findOne({
      code: code.trim().toUpperCase(),
      _id: { $ne: id },
    });
    if (existingByCode) {
      throw new Error("Department code must be unique");
    }
    changesRecorded.code = { old: department.code, new: code.trim().toUpperCase() };
    department.code = code.trim().toUpperCase();
  }

  // 3. Manager assignment check
  if (manager !== undefined) {
    if (manager === null || manager === "") {
      changesRecorded.manager = { old: department.manager, new: null };
      department.manager = null;
    } else if (manager.toString() !== (department.manager || "").toString()) {
      const managerUser = await User.findById(manager);
      if (!managerUser || managerUser.role !== "Department Manager") {
        throw new Error("Assigned manager must exist and have the role 'Department Manager'");
      }

      // Check manager uniqueness (cannot lead another department)
      const existingDeptWithManager = await Department.findOne({
        manager,
        _id: { $ne: id },
      });
      if (existingDeptWithManager) {
        throw new Error("Assigned manager is already leading another department");
      }

      changesRecorded.manager = { old: department.manager, new: manager };
      department.manager = manager;
    }
  }

  if (description !== undefined) {
    changesRecorded.description = { old: department.description, new: description };
    department.description = description;
  }

  if (location) {
    changesRecorded.location = { old: department.location, new: location.trim() };
    department.location = location.trim();
  }

  if (status) {
    changesRecorded.status = { old: department.status, new: status };
    department.status = status;
  }

  // Save changes
  await department.save();

  // Log update audit event
  await recordAudit({
    action: "UPDATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "Department",
    targetId: department._id,
    changes: changesRecorded,
    ipAddress,
    userAgent,
  });

  return department;
};

/**
 * Service to soft-delete a department.
 */
const deleteDepartment = async (id, adminUser, ipAddress, userAgent) => {
  const department = await Department.findById(id);
  if (!department) {
    throw new Error("Department not found");
  }

  // Check if users are assigned to this department (only count active or pending users)
  const assignedUsersCount = await User.countDocuments({
    department: id,
    status: { $ne: "Suspended" }, // Suspended or deleted checks
  });

  if (assignedUsersCount > 0) {
    throw new Error("Cannot delete department because active users are currently assigned to it");
  }

  // Soft delete: toggle status to Inactive
  department.status = "Inactive";
  await department.save();

  // Log delete audit event
  await recordAudit({
    action: "DELETE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "Department",
    targetId: department._id,
    changes: { status: "Inactive (Soft-Deleted)" },
    ipAddress,
    userAgent,
  });

  return true;
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};

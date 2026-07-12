const mongoose = require("mongoose");
const Operation = require("../models/Operation");
const AuditLog = require("../models/AuditLog");
const carbonService = require("./carbonService");

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
 * Service to log a new Operational Record.
 */
const createOperation = async (data, managerUser, ipAddress, userAgent) => {
  const { type, quantity, unit, emissionFactor, evidenceFiles, description, date } = data;

  // 1. Enforce Role & Department ownership constraints
  if (managerUser.role !== "Department Manager") {
    throw new Error("Only Department Managers can record operational data");
  }
  if (!managerUser.department) {
    throw new Error("Manager must be assigned to a department to record operations");
  }

  // 2. Perform carbon emission footprint calculation
  const computedCarbon = await carbonService.calculateEmission(
    emissionFactor,
    quantity,
    unit
  );

  // 3. Create the record (scoped strictly to the Manager's own department)
  const operation = await Operation.create({
    type,
    department: managerUser.department,
    quantity,
    unit,
    emissionFactor,
    carbonEmission: computedCarbon,
    evidenceFiles,
    recordedBy: managerUser._id,
    description: description || "",
    date: date || undefined,
    status: "Active",
  });

  // 4. Update the Department's ESG Environmental and Overall Scores
  await carbonService.updateDepartmentESG(managerUser.department);

  // 5. Record CREATE audit log
  await recordAudit({
    action: "CREATE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "Operation",
    targetId: operation._id,
    changes: { type: operation.type, carbonEmission: operation.carbonEmission },
    ipAddress,
    userAgent,
  });

  return operation;
};

/**
 * Service to list active operations for a manager's department.
 */
const getAllOperations = async (managerUser) => {
  if (!managerUser.department) {
    throw new Error("User does not belong to any department");
  }
  return Operation.find({
    department: managerUser.department,
    status: "Active",
  }).populate("emissionFactor", "name factor unit");
};

/**
 * Service to fetch a single operation with ownership validation.
 */
const getOperationById = async (id, managerUser) => {
  const operation = await Operation.findOne({ _id: id, status: "Active" }).populate(
    "emissionFactor",
    "name factor unit"
  );
  
  if (!operation) {
    throw new Error("Operational record not found");
  }

  // If the user is a manager or employee, restrict access to their own department
  if (
    ["Department Manager", "Employee"].includes(managerUser.role) &&
    operation.department.toString() !== (managerUser.department || "").toString()
  ) {
    throw new Error("Access denied. You can only view records for your own department");
  }

  return operation;
};

/**
 * Service to update an Operational Record.
 */
const updateOperation = async (id, data, managerUser, ipAddress, userAgent) => {
  const operation = await Operation.findOne({ _id: id, status: "Active" });
  if (!operation) {
    throw new Error("Operational record not found");
  }

  // Enforce department ownership: Managers can only edit their own department records
  if (operation.department.toString() !== (managerUser.department || "").toString()) {
    throw new Error("Access denied. You can only update records for your own department");
  }

  const { type, quantity, unit, emissionFactor, evidenceFiles, description, date, status } = data;
  const changesRecorded = {};

  // If calculation parameters are updated, recompute carbon emissions
  const isCalcChanged =
    (quantity !== undefined && quantity !== operation.quantity) ||
    (unit !== undefined && unit !== operation.unit) ||
    (emissionFactor !== undefined && emissionFactor.toString() !== operation.emissionFactor.toString());

  if (type) {
    changesRecorded.type = { old: operation.type, new: type };
    operation.type = type;
  }
  if (description !== undefined) {
    changesRecorded.description = { old: operation.description, new: description };
    operation.description = description;
  }
  if (date) {
    changesRecorded.date = { old: operation.date, new: date };
    operation.date = date;
  }
  if (evidenceFiles) {
    changesRecorded.evidenceFiles = { old: operation.evidenceFiles, new: evidenceFiles };
    operation.evidenceFiles = evidenceFiles;
  }
  if (status) {
    changesRecorded.status = { old: operation.status, new: status };
    operation.status = status;
  }

  if (isCalcChanged) {
    const targetFactor = emissionFactor || operation.emissionFactor;
    const targetQuantity = quantity !== undefined ? quantity : operation.quantity;
    const targetUnit = unit !== undefined ? unit : operation.unit;

    const recomputedCarbon = await carbonService.calculateEmission(
      targetFactor,
      targetQuantity,
      targetUnit
    );

    changesRecorded.carbonEmission = { old: operation.carbonEmission, new: recomputedCarbon };
    changesRecorded.quantity = { old: operation.quantity, new: targetQuantity };
    changesRecorded.unit = { old: operation.unit, new: targetUnit };
    changesRecorded.emissionFactor = { old: operation.emissionFactor, new: targetFactor };

    operation.quantity = targetQuantity;
    operation.unit = targetUnit;
    operation.emissionFactor = targetFactor;
    operation.carbonEmission = recomputedCarbon;
  }

  await operation.save();

  // Recompute scores in real-time
  await carbonService.updateDepartmentESG(managerUser.department);

  // Record UPDATE audit log
  await recordAudit({
    action: "UPDATE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "Operation",
    targetId: operation._id,
    changes: changesRecorded,
    ipAddress,
    userAgent,
  });

  return operation;
};

/**
 * Service to soft-delete an Operational Record.
 */
const deleteOperation = async (id, managerUser, ipAddress, userAgent) => {
  const operation = await Operation.findOne({ _id: id, status: "Active" });
  if (!operation) {
    throw new Error("Operational record not found");
  }

  // Enforce department ownership: Managers can only delete their own department records
  if (operation.department.toString() !== (managerUser.department || "").toString()) {
    throw new Error("Access denied. You can only delete records for your own department");
  }

  // Soft-delete the operation
  operation.status = "Inactive";
  await operation.save();

  // Re-aggregate and update Department ESG Rating
  await carbonService.updateDepartmentESG(managerUser.department);

  // Record DELETE audit log
  await recordAudit({
    action: "DELETE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "Operation",
    targetId: operation._id,
    changes: { status: "Inactive (Soft-Deleted)" },
    ipAddress,
    userAgent,
  });

  return true;
};

module.exports = {
  createOperation,
  getAllOperations,
  getOperationById,
  updateOperation,
  deleteOperation,
};

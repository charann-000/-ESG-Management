const EmissionFactor = require("../models/EmissionFactor");
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
 * Service to create a new Emission Factor.
 */
const createEmissionFactor = async (data, adminUser, ipAddress, userAgent) => {
  const { name, activityType, factor, unit, source, year } = data;
  const normalizedUnit = unit.trim().toLowerCase();

  // 1. Uniqueness check for Name
  const existingByName = await EmissionFactor.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });
  if (existingByName) {
    throw new Error("Emission factor name must be unique");
  }

  // 2. Uniqueness check for Category (activityType) + Unit
  const existingByCompound = await EmissionFactor.findOne({
    activityType,
    unit: normalizedUnit,
    status: "Active", // Enforce uniqueness among active factors
  });
  if (existingByCompound) {
    throw new Error(`An active emission factor for activity category '${activityType}' and unit '${normalizedUnit}' already exists`);
  }

  // 3. Create the record
  const emissionFactor = await EmissionFactor.create({
    name: name.trim(),
    activityType,
    factor,
    unit: normalizedUnit,
    source: source.trim(),
    year: year || undefined,
    createdBy: adminUser._id,
  });

  // 4. Log audit event
  await recordAudit({
    action: "CREATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "EmissionFactor",
    targetId: emissionFactor._id,
    changes: { name: emissionFactor.name, activityType, unit: normalizedUnit, factor },
    ipAddress,
    userAgent,
  });

  return emissionFactor;
};

/**
 * Service to fetch all active emission factors.
 */
const getAllEmissionFactors = async (query = {}) => {
  const filters = { status: "Active" };

  if (query.activityType) {
    filters.activityType = query.activityType;
  }
  if (query.includeInactive === "true") {
    delete filters.status;
  }

  return EmissionFactor.find(filters);
};

/**
 * Service to fetch an emission factor by ID.
 */
const getEmissionFactorById = async (id) => {
  const factor = await EmissionFactor.findById(id);
  if (!factor) {
    throw new Error("Emission factor not found");
  }
  return factor;
};

/**
 * Service to update an emission factor.
 */
const updateEmissionFactor = async (id, data, adminUser, ipAddress, userAgent) => {
  const factorRecord = await EmissionFactor.findById(id);
  if (!factorRecord) {
    throw new Error("Emission factor not found");
  }

  const { name, activityType, factor, unit, source, year, status } = data;
  const changesRecorded = {};

  // 1. Uniqueness check for Name
  if (name && name.trim().toLowerCase() !== factorRecord.name.toLowerCase()) {
    const existingByName = await EmissionFactor.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });
    if (existingByName) {
      throw new Error("Emission factor name must be unique");
    }
    changesRecorded.name = { old: factorRecord.name, new: name.trim() };
    factorRecord.name = name.trim();
  }

  // 2. Uniqueness check for Category (activityType) + Unit compound key
  const updatedCategory = activityType || factorRecord.activityType;
  const updatedUnit = unit ? unit.trim().toLowerCase() : factorRecord.unit;

  if (activityType || unit) {
    if (updatedCategory !== factorRecord.activityType || updatedUnit !== factorRecord.unit) {
      const existingByCompound = await EmissionFactor.findOne({
        activityType: updatedCategory,
        unit: updatedUnit,
        status: "Active",
        _id: { $ne: id },
      });
      if (existingByCompound) {
        throw new Error(
          `An active emission factor for activity category '${updatedCategory}' and unit '${updatedUnit}' already exists`
        );
      }
      changesRecorded.activityType = { old: factorRecord.activityType, new: updatedCategory };
      changesRecorded.unit = { old: factorRecord.unit, new: updatedUnit };
      factorRecord.activityType = updatedCategory;
      factorRecord.unit = updatedUnit;
    }
  }

  if (factor !== undefined) {
    changesRecorded.factor = { old: factorRecord.factor, new: factor };
    factorRecord.factor = factor;
  }

  if (source) {
    changesRecorded.source = { old: factorRecord.source, new: source.trim() };
    factorRecord.source = source.trim();
  }

  if (year) {
    changesRecorded.year = { old: factorRecord.year, new: year };
    factorRecord.year = year;
  }

  if (status) {
    changesRecorded.status = { old: factorRecord.status, new: status };
    factorRecord.status = status;
  }

  await factorRecord.save();

  // Log update audit event
  await recordAudit({
    action: "UPDATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "EmissionFactor",
    targetId: factorRecord._id,
    changes: changesRecorded,
    ipAddress,
    userAgent,
  });

  return factorRecord;
};

/**
 * Service to soft-delete an emission factor.
 */
const deleteEmissionFactor = async (id, adminUser, ipAddress, userAgent) => {
  const factor = await EmissionFactor.findById(id);
  if (!factor) {
    throw new Error("Emission factor not found");
  }

  // Soft delete: toggle status to Inactive
  factor.status = "Inactive";
  await factor.save();

  // Log delete audit event
  await recordAudit({
    action: "DELETE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "EmissionFactor",
    targetId: factor._id,
    changes: { status: "Inactive (Soft-Deleted)" },
    ipAddress,
    userAgent,
  });

  return true;
};

module.exports = {
  createEmissionFactor,
  getAllEmissionFactors,
  getEmissionFactorById,
  updateEmissionFactor,
  deleteEmissionFactor,
};

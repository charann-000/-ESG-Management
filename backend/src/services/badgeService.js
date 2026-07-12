const Badge = require("../models/Badge");
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
 * Service to register a new Badge rule.
 */
const createBadge = async (data, adminUser, ipAddress, userAgent) => {
  const { name, description, imageUrl, ruleType, ruleValue } = data;

  // 1. Uniqueness check for badge name
  const existingBadge = await Badge.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });
  if (existingBadge) {
    throw new Error("Badge name must be unique");
  }

  // 2. Create record (enforces creator is Admin via schema validator)
  const badge = await Badge.create({
    name: name.trim(),
    description: description.trim(),
    imageUrl: imageUrl.trim(),
    ruleType,
    ruleValue,
    createdBy: adminUser._id,
  });

  // 3. Record CREATE audit log
  await recordAudit({
    action: "CREATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "Badge",
    targetId: badge._id,
    changes: { name: badge.name, ruleType, ruleValue },
    ipAddress,
    userAgent,
  });

  return badge;
};

/**
 * Service to fetch all active Badge rules.
 */
const getAllBadges = async () => {
  return Badge.find({ status: "Active" });
};

module.exports = {
  createBadge,
  getAllBadges,
};

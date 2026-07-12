const Reward = require("../models/Reward");
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
 * Service to register a new Reward item.
 */
const createReward = async (data, adminUser, ipAddress, userAgent) => {
  const { title, description, cost, stock, imageUrl } = data;

  // 1. Uniqueness check for reward title
  const existingReward = await Reward.findOne({
    title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
  });
  if (existingReward) {
    throw new Error("Reward title must be unique");
  }

  // 2. Create record (enforces creator is Admin via schema validator)
  const reward = await Reward.create({
    title: title.trim(),
    description: description.trim(),
    cost,
    stock,
    imageUrl: imageUrl || null,
    createdBy: adminUser._id,
  });

  // 3. Record CREATE audit log
  await recordAudit({
    action: "CREATE",
    actor: adminUser._id,
    actorRole: adminUser.role,
    targetModel: "Reward",
    targetId: reward._id,
    changes: { title: reward.title, cost, stock },
    ipAddress,
    userAgent,
  });

  return reward;
};

/**
 * Service to fetch all active Rewards.
 */
const getAllRewards = async () => {
  return Reward.find({ status: "Active" });
};

module.exports = {
  createReward,
  getAllRewards,
};

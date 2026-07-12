const CSRActivity = require("../models/CSRActivity");
const AuditLog = require("../models/AuditLog");
const gamificationService = require("./gamificationService");

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
 * Service to create a new CSR Activity.
 */
const createCsrActivity = async (data, managerUser, ipAddress, userAgent) => {
  const { title, description, date, location, xpReward, coinReward, badgeReward } = data;

  if (managerUser.role !== "Department Manager") {
    throw new Error("Only Department Managers can organize CSR activities");
  }
  if (!managerUser.department) {
    throw new Error("Organizer manager must belong to a department");
  }

  const activity = await CSRActivity.create({
    title: title.trim(),
    description: description.trim(),
    date,
    location: location.trim(),
    xpReward,
    coinReward,
    badgeReward: badgeReward || null,
    department: managerUser.department,
    createdBy: managerUser._id,
    participants: [],
  });

  // Record audit log
  await recordAudit({
    action: "CREATE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "CSRActivity",
    targetId: activity._id,
    changes: { title: activity.title, xpReward, coinReward },
    ipAddress,
    userAgent,
  });

  return activity;
};

/**
 * Service to retrieve CSR Activities.
 * Restricts employees and managers to their own department events.
 */
const getAllCsrActivities = async (user) => {
  const filters = {};

  if (["Department Manager", "Employee"].includes(user.role)) {
    if (!user.department) {
      throw new Error("Your account is not assigned to any department");
    }
    filters.department = user.department;
  }

  return CSRActivity.find(filters).populate("badgeReward", "name imageUrl");
};

/**
 * Service for employees to submit participation proof.
 */
const participateInCsr = async (id, data, employeeUser, ipAddress, userAgent) => {
  const activity = await CSRActivity.findById(id);
  if (!activity || activity.status === "Cancelled") {
    throw new Error("CSR Activity not found or has been cancelled");
  }

  // Enforce department constraint
  if (
    ["Department Manager", "Employee"].includes(employeeUser.role) &&
    activity.department.toString() !== (employeeUser.department || "").toString()
  ) {
    throw new Error("Access denied. You can only participate in CSR activities organized by your own department");
  }

  // Prevent duplicate submissions
  const alreadyParticipated = activity.participants.some(
    (p) => p.employee.toString() === employeeUser._id.toString()
  );
  if (alreadyParticipated) {
    throw new Error("You have already submitted a participation request for this activity");
  }

  // Push pending participant record
  activity.participants.push({
    employee: employeeUser._id,
    proof: data.proof.trim(),
    status: "Pending Approval",
    submittedAt: new Date(),
  });

  await activity.save();

  // Record audit
  await recordAudit({
    action: "UPDATE",
    actor: employeeUser._id,
    actorRole: employeeUser.role,
    targetModel: "CSRActivity",
    targetId: activity._id,
    changes: { status: "Pending Approval", submission: true },
    ipAddress,
    userAgent,
  });

  return activity;
};

/**
 * Service to approve/reject employee participation.
 * Delegates points allocation and badge awards to GamificationService.
 */
const verifyCsrParticipation = async (
  id,
  employeeId,
  data,
  managerUser,
  ipAddress,
  userAgent
) => {
  const activity = await CSRActivity.findById(id);
  if (!activity) {
    throw new Error("CSR Activity not found");
  }

  // Enforce manager department constraint
  if (activity.department.toString() !== (managerUser.department || "").toString()) {
    throw new Error("Access denied. You can only verify activities inside your own department");
  }

  const participant = activity.participants.find(
    (p) => p.employee.toString() === employeeId.toString()
  );
  if (!participant) {
    throw new Error("Participant record not found");
  }

  if (participant.status !== "Pending Approval") {
    throw new Error(`Participant status is already '${participant.status}'`);
  }

  // 1. Update verification attributes
  participant.status = data.status; // Approved or Rejected
  participant.approvedBy = managerUser._id;
  participant.approvedAt = new Date();
  participant.remarks = data.remarks || "";

  await activity.save();

  console.log(`✅ Manager verified CSR participation: ${data.status} for User ID ${employeeId}`);

  // 2. Delegate rewards to GamificationService on Approval
  if (data.status === "Approved") {
    // Award XP and Coins + run dynamic threshold badge progression scanner
    await gamificationService.awardPointsAndCheckBadges(
      employeeId,
      activity.xpReward,
      activity.coinReward
    );

    // Award direct activity completion Badge reward (if set)
    if (activity.badgeReward) {
      await gamificationService.awardBadgeDirect(employeeId, activity.badgeReward);
    }
  }

  // 3. Record UPDATE audit log
  await recordAudit({
    action: "UPDATE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "CSRActivity",
    targetId: activity._id,
    changes: {
      employeeId,
      verificationStatus: data.status,
      remarks: data.remarks,
    },
    ipAddress,
    userAgent,
  });

  return activity;
};

module.exports = {
  createCsrActivity,
  getAllCsrActivities,
  participateInCsr,
  verifyCsrParticipation,
};

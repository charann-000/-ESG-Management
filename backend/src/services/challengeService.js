const Challenge = require("../models/Challenge");
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
 * Service to create a new Challenge.
 */
const createChallenge = async (data, managerUser, ipAddress, userAgent) => {
  const { title, description, startDate, endDate, xpReward, scope, department } = data;

  if (managerUser.role !== "Department Manager") {
    throw new Error("Only Department Managers can organize challenges");
  }

  const targetDept = scope === "department" ? department : null;

  const challenge = await Challenge.create({
    title: title.trim(),
    description: description.trim(),
    startDate,
    endDate,
    xpReward,
    scope,
    department: targetDept,
    createdBy: managerUser._id,
    participants: [],
  });

  // Record audit log
  await recordAudit({
    action: "CREATE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "Challenge",
    targetId: challenge._id,
    changes: { title: challenge.title, scope, xpReward },
    ipAddress,
    userAgent,
  });

  return challenge;
};

/**
 * Service to fetch all active challenges matching user department scope boundaries.
 */
const getAllChallenges = async (user) => {
  const filters = { status: { $ne: "Cancelled" } };

  if (["Department Manager", "Employee"].includes(user.role)) {
    if (!user.department) {
      throw new Error("Your account is not assigned to any department");
    }
    // Return company-wide challenges and department-specific ones matching user's department
    filters.$or = [
      { scope: "company" },
      { scope: "department", department: user.department },
    ];
  }

  return Challenge.find(filters);
};

/**
 * Service for employees to join a challenge.
 */
const joinChallenge = async (id, employeeUser, ipAddress, userAgent) => {
  const challenge = await Challenge.findById(id);
  if (!challenge || challenge.status === "Cancelled") {
    throw new Error("Challenge not found or has been cancelled");
  }

  // Enforce department scope boundary
  if (challenge.scope === "department") {
    if (
      ["Department Manager", "Employee"].includes(employeeUser.role) &&
      challenge.department.toString() !== (employeeUser.department || "").toString()
    ) {
      throw new Error("Access denied. This challenge is restricted to another department");
    }
  }

  // Check if user is already participating
  const alreadyJoined = challenge.participants.some(
    (p) => p.employee.toString() === employeeUser._id.toString()
  );
  if (alreadyJoined) {
    throw new Error("You have already joined this challenge");
  }

  challenge.participants.push({
    employee: employeeUser._id,
    status: "Joined",
    joinedAt: new Date(),
  });

  await challenge.save();

  // Record audit log
  await recordAudit({
    action: "UPDATE",
    actor: employeeUser._id,
    actorRole: employeeUser.role,
    targetModel: "Challenge",
    targetId: challenge._id,
    changes: { employeeId: employeeUser._id, status: "Joined" },
    ipAddress,
    userAgent,
  });

  return challenge;
};

/**
 * Service for employees to submit challenge proof.
 */
const submitChallengeProof = async (id, data, employeeUser, ipAddress, userAgent) => {
  const challenge = await Challenge.findById(id);
  if (!challenge || challenge.status === "Cancelled") {
    throw new Error("Challenge not found or has been cancelled");
  }

  const participant = challenge.participants.find(
    (p) => p.employee.toString() === employeeUser._id.toString()
  );
  if (!participant) {
    throw new Error("You must join this challenge before submitting proof");
  }

  if (participant.status !== "Joined") {
    throw new Error(`Cannot submit proof. Current completion status is '${participant.status}'`);
  }

  participant.proof = data.proof.trim();
  participant.status = "Pending Approval";
  participant.submittedAt = new Date();

  await challenge.save();

  // Record audit log
  await recordAudit({
    action: "UPDATE",
    actor: employeeUser._id,
    actorRole: employeeUser.role,
    targetModel: "Challenge",
    targetId: challenge._id,
    changes: { employeeId: employeeUser._id, status: "Pending Approval" },
    ipAddress,
    userAgent,
  });

  return challenge;
};

/**
 * Service to approve challenge completions.
 * Delegates XP rewards to GamificationService.
 */
const verifyChallengeCompletion = async (
  id,
  employeeId,
  data,
  managerUser,
  ipAddress,
  userAgent
) => {
  const challenge = await Challenge.findById(id);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  // Enforce department manager context on department-scoped challenges
  if (challenge.scope === "department" && challenge.department.toString() !== (managerUser.department || "").toString()) {
    throw new Error("Access denied. You can only verify challenges inside your own department");
  }

  const participant = challenge.participants.find(
    (p) => p.employee.toString() === employeeId.toString()
  );
  if (!participant) {
    throw new Error("Participant record not found");
  }

  if (participant.status !== "Pending Approval") {
    throw new Error(`Participant status is already '${participant.status}'`);
  }

  // 1. Update verification attributes
  participant.status = data.status; // Completed or Rejected
  participant.approvedBy = managerUser._id;
  participant.approvedAt = new Date();
  participant.remarks = data.remarks || "";

  await challenge.save();

  console.log(`✅ Manager verified Challenge completion: ${data.status} for User ID ${employeeId}`);

  // 2. Delegate rewards to GamificationService on completion approval
  if (data.status === "Completed") {
    // Award challenge XP reward (Coins not rewarded for challenge, set to 0) + trigger badge rules check
    await gamificationService.awardPointsAndCheckBadges(
      employeeId,
      challenge.xpReward,
      0
    );
  }

  // 3. Record UPDATE audit log
  await recordAudit({
    action: "UPDATE",
    actor: managerUser._id,
    actorRole: managerUser.role,
    targetModel: "Challenge",
    targetId: challenge._id,
    changes: {
      employeeId,
      completionStatus: data.status,
      remarks: data.remarks,
    },
    ipAddress,
    userAgent,
  });

  return challenge;
};

module.exports = {
  createChallenge,
  getAllChallenges,
  joinChallenge,
  submitChallengeProof,
  verifyChallengeCompletion,
};

const mongoose = require("mongoose");
const User = require("../models/User");
const Badge = require("../models/Badge");
const Reward = require("../models/Reward");
const Notification = require("../models/Notification");
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
 * Award XP and Coins to an employee and automatically runs the Badge progression engine.
 * Only this service is allowed to execute mutations on User gamification fields.
 */
const awardPointsAndCheckBadges = async (userId, xpAmount, coinAmount) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // 1. Award points
  user.xp += xpAmount;
  user.coins += coinAmount;
  await user.save();

  console.log(`🏆 Awarded points to User [ID: ${userId}]: +${xpAmount} XP, +${coinAmount} Coins. Current XP: ${user.xp}`);

  // 2. Run automatic badge progression engine
  await checkAndAwardBadges(user._id);

  return user;
};

/**
 * Direct award of a Badge.
 * Used for specific activity/challenge badge rewards. Only this service may mutate user badges.
 */
const awardBadgeDirect = async (userId, badgeId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const badge = await Badge.findById(badgeId);
  if (!badge || badge.status !== "Active") return;

  const alreadyEarned = user.badges.some(
    (b) => b.badge.toString() === badge._id.toString()
  );

  if (!alreadyEarned) {
    user.badges.push({
      badge: badge._id,
      earnedAt: new Date(),
    });
    await user.save();

    await Notification.create({
      recipient: userId,
      title: "New Badge Earned! 🏆",
      message: `Congratulations! You earned the badge '${badge.name}' for completing the activity/challenge.`,
      type: "In-App",
      event: "Badge",
      targetModel: "Badge",
      targetId: badge._id,
    });
    
    console.log(`🎖️ Direct Awarded badge '${badge.name}' to User: ${user.name}`);
  }
};

/**
 * Scans active badge thresholds and dynamically awards badges to the employee.
 * Uses a data-driven structure comparing CSR counts, Challenge counts, and XP limits.
 */
const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const CSRActivity = mongoose.model("CSRActivity");
  const Challenge = mongoose.model("Challenge");

  // 1. Compile User statistics
  const approvedCsrCount = await CSRActivity.countDocuments({
    "participants.employee": userId,
    "participants.status": "Approved",
  });

  const completedChallengeCount = await Challenge.countDocuments({
    "participants.employee": userId,
    "participants.status": "Completed",
  });

  const currentXp = user.xp;

  // 2. Query all active badges
  const activeBadges = await Badge.find({ status: "Active" });

  let awardedNewBadge = false;

  for (const badge of activeBadges) {
    // Check if the user already has this badge
    const alreadyEarned = user.badges.some(
      (b) => b.badge.toString() === badge._id.toString()
    );

    if (alreadyEarned) continue;

    // Evaluate dynamic badge rule thresholds
    let metricValue = 0;
    switch (badge.ruleType) {
      case "CSR_COUNT":
        metricValue = approvedCsrCount;
        break;
      case "CHALLENGE_COUNT":
        metricValue = completedChallengeCount;
        break;
      case "XP_COUNT":
        metricValue = currentXp;
        break;
      default:
        console.warn(`⚠️ Unrecognized badge rule type: ${badge.ruleType}`);
        continue;
    }

    // Award badge if threshold is met
    if (metricValue >= badge.ruleValue) {
      user.badges.push({
        badge: badge._id,
        earnedAt: new Date(),
      });

      awardedNewBadge = true;

      // Generate in-app system notification
      await Notification.create({
        recipient: userId,
        title: "New Badge Earned! 🏆",
        message: `Congratulations! You have earned the '${badge.name}' badge for meeting the ${badge.ruleType} threshold of ${badge.ruleValue}.`,
        type: "In-App",
        event: "Badge",
        targetModel: "Badge",
        targetId: badge._id,
      });

      console.log(`🎖️ Awarded badge '${badge.name}' to User: ${user.name}`);
    }
  }

  if (awardedNewBadge) {
    await user.save();
  }
};

/**
 * Safely processes a reward redemption.
 * Performs stock adjustments, coin balance verification, and writes the redemption ledger log.
 */
const redeemReward = async (userId, rewardId, ipAddress, userAgent) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const reward = await Reward.findById(rewardId);
  if (!reward || reward.status !== "Active") {
    throw new Error("Reward not found or is currently inactive");
  }

  // 1. Verify stock availability
  if (reward.stock <= 0) {
    throw new Error("Reward is currently out of stock");
  }

  // 2. Verify coin balance
  if (user.coins < reward.cost) {
    throw new Error(`Insufficient coins. This reward costs ${reward.cost} coins but you only have ${user.coins} coins`);
  }

  // 3. Perform deductions and save records
  user.coins -= reward.cost;
  user.redemptions.push({
    reward: reward._id,
    redeemedAt: new Date(),
    quantity: 1,
    coinsSpent: reward.cost,
  });

  reward.stock -= 1;

  await user.save();
  await reward.save();

  console.log(`🎁 Reward Redeemed: User '${user.name}' spent ${reward.cost} coins for '${reward.title}'`);

  // 4. Generate notification
  await Notification.create({
    recipient: userId,
    title: "Reward Redeemed successfully! 🎁",
    message: `You have successfully redeemed '${reward.title}' for ${reward.cost} coins.`,
    type: "In-App",
    event: "Reward",
    targetModel: "Reward",
    targetId: reward._id,
  });

  // 5. Write UPDATE audit log
  await recordAudit({
    action: "UPDATE",
    actor: userId,
    actorRole: user.role,
    targetModel: "Reward",
    targetId: reward._id,
    changes: { coinsSpent: reward.cost, remainingCoins: user.coins, remainingStock: reward.stock },
    ipAddress,
    userAgent,
  });

  return user;
};

/**
 * Calculates dynamic leaderboard rankings using MongoDB aggregations.
 */
const getLeaderboard = async (departmentId = null) => {
  const match = { status: "Active" };
  
  if (departmentId) {
    match.department = new mongoose.Types.ObjectId(departmentId);
  }

  return User.aggregate([
    { $match: match },
    {
      $project: {
        name: 1,
        email: 1,
        xp: 1,
        coins: 1,
        department: 1,
        profileImage: 1,
        badgeCount: { $size: { $ifNull: ["$badges", []] } },
      },
    },
    { $sort: { xp: -1 } },
  ]);
};

module.exports = {
  awardPointsAndCheckBadges,
  checkAndAwardBadges,
  awardBadgeDirect,
  redeemReward,
  getLeaderboard,
};

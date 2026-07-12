const challengeService = require("../services/challengeService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  user: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /challenges.
 */
const createChallenge = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const challenge = await challengeService.createChallenge(
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Challenge created successfully.",
      data: challenge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /challenges.
 */
const getChallenges = async (req, res, next) => {
  try {
    const challenges = await challengeService.getAllChallenges(req.user);
    return res.status(200).json({
      success: true,
      message: "Challenges retrieved successfully.",
      data: challenges,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /challenges/:id/join.
 */
const joinChallenge = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const challenge = await challengeService.joinChallenge(
      req.params.id,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Joined challenge successfully.",
      data: challenge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /challenges/:id/submit.
 */
const submitChallengeProof = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const challenge = await challengeService.submitChallengeProof(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Challenge proof submitted successfully.",
      data: challenge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /challenges/:id/participants/:employeeId/verify.
 */
const verifyChallengeCompletion = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const challenge = await challengeService.verifyChallengeCompletion(
      req.params.id,
      req.params.employeeId,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Challenge completion verified successfully.",
      data: challenge,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChallenge,
  getChallenges,
  joinChallenge,
  submitChallengeProof,
  verifyChallengeCompletion,
};

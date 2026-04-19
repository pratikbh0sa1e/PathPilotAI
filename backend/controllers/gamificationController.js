const {
  getGamification,
  trackAction,
} = require("../services/gamificationService");

/**
 * GET /api/gamification/:userId
 * Returns full gamification state for a user
 */
exports.getState = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res
        .status(400)
        .json({ error: true, message: "userId is required" });
    const data = await getGamification(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/gamification/track
 * Track an action and award XP/badge
 * Body: { userId, actionId }
 */
exports.track = async (req, res, next) => {
  try {
    const { userId, actionId } = req.body;
    if (!userId)
      return res
        .status(400)
        .json({ error: true, message: "userId is required" });
    const result = await trackAction(userId, actionId || "daily_login");
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

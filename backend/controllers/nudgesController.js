const ai = require("../services/aiService");

/**
 * POST /api/nudges
 * Proxies to FastAPI /ai/nudges (rule engine + LangChain personalization)
 */
exports.nudges = async (req, res, next) => {
  try {
    const { data } = await ai.nudges(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

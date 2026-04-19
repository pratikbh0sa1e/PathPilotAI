const ai = require("../services/aiService");

/**
 * POST /api/journey
 * Proxies to FastAPI /ai/journey (hybrid scoring + LangChain insights)
 */
exports.journey = async (req, res, next) => {
  try {
    const { profile, activity, include_insights } = req.body;

    const { data } = await ai.journey({ profile, activity, include_insights });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const ai = require("../services/aiService");

/**
 * POST /api/roi
 * Proxies to FastAPI /ai/roi (rule engine + LangChain explanation)
 */
exports.roi = async (req, res, next) => {
  try {
    const {
      field_of_study,
      country,
      tuition_usd,
      duration_years,
      include_living_costs,
    } = req.body;

    const { data } = await ai.roi({
      field_of_study,
      country,
      tuition_usd,
      duration_years,
      include_living_costs,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

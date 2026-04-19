const ai = require("../services/aiService");

/**
 * POST /api/loan
 * Proxies to FastAPI /ai/loan (rule engine + LangChain explanation)
 */
exports.loan = async (req, res, next) => {
  try {
    const {
      gpa,
      tuition_usd,
      duration_years,
      field_of_study,
      target_country,
      annual_income_usd,
    } = req.body;

    const { data } = await ai.loan({
      gpa,
      tuition_usd,
      duration_years,
      field_of_study,
      target_country,
      annual_income_usd,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

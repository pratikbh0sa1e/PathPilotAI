const ai = require("../services/aiService");

/**
 * POST /api/agent
 * Proxies to FastAPI /ai/agent (LangChain tool-calling agent)
 */
exports.agent = async (req, res, next) => {
  try {
    const { message, user_profile, chat_history } = req.body;
    const { data } = await ai.agent({ message, user_profile, chat_history });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

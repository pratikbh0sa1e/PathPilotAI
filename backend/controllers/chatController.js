const ai = require("../services/aiService");

/**
 * POST /api/chat
 * Proxies to FastAPI /ai/chat (LangChain + Groq)
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, session_id, user_profile } = req.body;

    const { data } = await ai.chat({ message, session_id, user_profile });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

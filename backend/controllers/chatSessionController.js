const sessionService = require("../services/chatSessionService");
const ai = require("../services/aiService");

/** GET /api/chat/sessions?userId=xxx */
exports.getSessions = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(400).json({ error: true, message: "userId required" });
    const sessions = await sessionService.getSessions(userId);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

/** POST /api/chat/sessions — create new session */
exports.createSession = async (req, res, next) => {
  try {
    const { userId, title } = req.body;
    if (!userId)
      return res.status(400).json({ error: true, message: "userId required" });
    const session = await sessionService.createSession(
      userId,
      title || "New Chat",
    );
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/chat/sessions/:sessionId — rename session */
exports.updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const updated = await sessionService.updateSession(sessionId, { title });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/chat/sessions/:sessionId */
exports.deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const ok = await sessionService.deleteSession(sessionId);
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
};

/** GET /api/chat/sessions/:sessionId/messages?userId=xxx */
exports.getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;
    if (!userId)
      return res.status(400).json({ error: true, message: "userId required" });
    const messages = await sessionService.getMessages(userId, sessionId);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

/** POST /api/chat/sessions/:sessionId/message — send message */
exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { message, userId, userProfile } = req.body;
    if (!message || !userId)
      return res
        .status(400)
        .json({ error: true, message: "message and userId required" });

    // Forward to AI service
    const { data } = await ai.chat({
      message,
      session_id: sessionId,
      user_id: userId,
      user_profile: userProfile,
    });

    // Auto-title session from first message
    await sessionService.updateSession(sessionId, {
      updated_at: new Date().toISOString(),
      // Set title from first 40 chars of first message if still "New Chat"
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

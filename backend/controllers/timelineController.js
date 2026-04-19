const ai = require("../services/aiService");

exports.timeline = async (req, res, next) => {
  try {
    const { data } = await ai.timeline(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.checklist = async (req, res, next) => {
  try {
    const { data } = await ai.checklist(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.sop = async (req, res, next) => {
  try {
    const { data } = await ai.sop(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

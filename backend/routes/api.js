const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { aiLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");

const chatController = require("../controllers/chatController");
const journeyController = require("../controllers/journeyController");
const loanController = require("../controllers/loanController");
const roiController = require("../controllers/roiController");
const agentController = require("../controllers/agentController");
const nudgesController = require("../controllers/nudgesController");

// ── API info ──────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.json({
    service: "PathPilot API Gateway",
    version: "2.0.0",
    endpoints: {
      "POST /api/chat": "Chat with AI mentor (LangChain + Groq)",
      "POST /api/journey": "Journey scoring + AI insights",
      "POST /api/loan": "Loan eligibility & repayment estimate",
      "POST /api/roi": "Return on investment calculator",
    },
  });
});

// ── /api/chat ─────────────────────────────────────────────────────────────────
router.post(
  "/chat",
  aiLimiter,
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("message is required")
      .isLength({ max: 2000 })
      .withMessage("message must be under 2000 characters"),
    body("session_id")
      .optional()
      .isString()
      .withMessage("session_id must be a string"),
    body("user_profile")
      .optional()
      .isObject()
      .withMessage("user_profile must be an object"),
  ],
  validate,
  chatController.chat,
);

// ── /api/journey ──────────────────────────────────────────────────────────────
router.post(
  "/journey",
  aiLimiter,
  [
    body("profile")
      .notEmpty()
      .withMessage("profile is required")
      .isObject()
      .withMessage("profile must be an object"),
    body("profile.gpa")
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage("gpa must be between 0 and 10"),
    body("activity")
      .optional()
      .isArray()
      .withMessage("activity must be an array"),
    body("include_insights")
      .optional()
      .isBoolean()
      .withMessage("include_insights must be a boolean"),
  ],
  validate,
  journeyController.journey,
);

// ── /api/loan ─────────────────────────────────────────────────────────────────
router.post(
  "/loan",
  aiLimiter,
  [
    body("gpa")
      .notEmpty()
      .withMessage("gpa is required")
      .isFloat({ min: 0, max: 10 })
      .withMessage("gpa must be between 0 and 10"),
    body("tuition_usd")
      .notEmpty()
      .withMessage("tuition_usd is required")
      .isFloat({ min: 0 })
      .withMessage("tuition_usd must be a positive number"),
    body("duration_years")
      .optional()
      .isFloat({ min: 0.5, max: 10 })
      .withMessage("duration_years must be between 0.5 and 10"),
    body("field_of_study").optional().isString(),
    body("target_country").optional().isString(),
    body("annual_income_usd").optional().isFloat({ min: 0 }),
  ],
  validate,
  loanController.loan,
);

// ── /api/roi ──────────────────────────────────────────────────────────────────
router.post(
  "/roi",
  aiLimiter,
  [
    body("field_of_study")
      .notEmpty()
      .withMessage("field_of_study is required")
      .isString(),
    body("country").notEmpty().withMessage("country is required").isString(),
    body("tuition_usd")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("tuition_usd must be a positive number"),
    body("duration_years")
      .optional()
      .isFloat({ min: 0.5, max: 10 })
      .withMessage("duration_years must be between 0.5 and 10"),
    body("include_living_costs").optional().isBoolean(),
  ],
  validate,
  roiController.roi,
);

// ── /api/agent ────────────────────────────────────────────────────────────────
router.post(
  "/agent",
  aiLimiter,
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("message is required")
      .isLength({ max: 2000 })
      .withMessage("message must be under 2000 characters"),
    body("user_profile")
      .optional()
      .isObject()
      .withMessage("user_profile must be an object"),
    body("chat_history")
      .optional()
      .isArray()
      .withMessage("chat_history must be an array"),
  ],
  validate,
  agentController.agent,
);

// ── /api/nudges ───────────────────────────────────────────────────────────────
router.post(
  "/nudges",
  aiLimiter,
  [
    body("profile")
      .notEmpty()
      .withMessage("profile is required")
      .isObject()
      .withMessage("profile must be an object"),
    body("used_features")
      .optional()
      .isArray()
      .withMessage("used_features must be an array"),
    body("journey_score").optional().isInt({ min: 0, max: 100 }),
    body("days_since_last_active").optional().isInt({ min: 0 }),
    body("max_nudges").optional().isInt({ min: 1, max: 10 }),
    body("personalize").optional().isBoolean(),
  ],
  validate,
  nudgesController.nudges,
);

module.exports = router;

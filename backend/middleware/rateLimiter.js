const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    status: 429,
    message: "Too many requests. Please try again in 15 minutes.",
  },
});

/**
 * Stricter limiter for AI endpoints — 20 requests per minute per IP.
 * Prevents abuse of expensive LLM calls.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    status: 429,
    message: "AI request limit reached. Please wait a moment.",
  },
});

module.exports = { apiLimiter, aiLimiter };

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const logger = require("./middleware/logger");
const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10kb" })); // Reject oversized payloads
app.use(logger);
app.use(apiLimiter); // Global rate limit

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PathPilot Backend",
    version: "2.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", require("./routes/api"));

// ── 404 + error handlers (must be last) ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 PathPilot Backend running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   API:     http://localhost:${PORT}/api`);
  console.log(`   Chat:    POST http://localhost:${PORT}/api/chat`);
  console.log(`   Journey: POST http://localhost:${PORT}/api/journey`);
  console.log(`   Loan:    POST http://localhost:${PORT}/api/loan`);
  console.log(`   ROI:     POST http://localhost:${PORT}/api/roi\n`);
});

module.exports = app;

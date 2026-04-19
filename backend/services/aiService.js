const axios = require("axios");

const AI_BASE = process.env.AI_SERVICE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: AI_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Response interceptor: normalize AI service errors ──────────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const e = new Error(err.response.data?.detail || "AI service error");
      e.status = err.response.status;
      return Promise.reject(e);
    }
    if (err.request) {
      const e = new Error("AI service is unreachable");
      e.status = 503;
      return Promise.reject(e);
    }
    return Promise.reject(err);
  },
);

module.exports = {
  chat: (body) => client.post("/ai/chat", body),
  journey: (body) => client.post("/ai/journey", body),
  loan: (body) => client.post("/ai/loan", body),
  roi: (body) => client.post("/ai/roi", body),
  agent: (body) => client.post("/ai/agent", body),
  nudges: (body) => client.post("/ai/nudges", body),
  health: () => client.get("/health"),
};

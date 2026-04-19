/**
 * Gateway test — validates all 4 routes + middleware
 */
const axios = require("axios");

const BASE = "http://localhost:5000";

const PROFILE = {
  gpa: 8.5,
  field_of_study: "Computer Science",
  target_countries: ["Germany", "Canada"],
  goals: "MS in AI",
  budget_range: "limited",
};

const PROGRAM = {
  country: "germany",
  tuition_usd: 15000,
  duration_years: 2,
};

async function run(label, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${label}:`, JSON.stringify(result).slice(0, 120));
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    const status = e.response?.status || "ERR";
    console.log(`⚠️  ${label} [${status}]: ${msg}`);
  }
}

(async () => {
  console.log("🧪 Testing PathPilot API Gateway\n");

  // Health
  await run("Health", async () => {
    const { data } = await axios.get(`${BASE}/health`);
    return { status: data.status, uptime: data.uptime };
  });

  // API info
  await run("API info", async () => {
    const { data } = await axios.get(`${BASE}/api`);
    return { endpoints: Object.keys(data.endpoints).length };
  });

  // Validation — missing message
  await run("Chat validation (should fail)", async () => {
    await axios.post(`${BASE}/api/chat`, {});
  });

  // Journey — scores only (no AI service needed)
  await run("Journey (scores only)", async () => {
    const { data } = await axios.post(`${BASE}/api/journey`, {
      profile: PROFILE,
      activity: ["internship", "research"],
      include_insights: false,
    });
    return {
      journey: data.data?.journeyScore,
      admission: data.data?.admissionScore,
    };
  });

  // Loan fallback
  await run("Loan (local estimate)", async () => {
    const { data } = await axios.post(`${BASE}/api/loan`, {
      profile: PROFILE,
      program: PROGRAM,
    });
    return {
      eligibility: data.data?.eligibility_score,
      max_loan: data.data?.max_loan_usd,
    };
  });

  // ROI fallback
  await run("ROI (local estimate)", async () => {
    const { data } = await axios.post(`${BASE}/api/roi`, {
      profile: PROFILE,
      program: PROGRAM,
    });
    return {
      roi_5yr: data.data?.roi_5_year_pct,
      payback: data.data?.payback_period_years,
    };
  });

  // Chat — will fail gracefully if AI service is down
  await run("Chat (needs AI service)", async () => {
    const { data } = await axios.post(`${BASE}/api/chat`, {
      message: "What universities should I apply to?",
      session_id: "test-session",
      user_profile: PROFILE,
    });
    return { response_length: data.data?.response?.length };
  });

  console.log("\nDone.");
})();

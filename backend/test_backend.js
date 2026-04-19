#!/usr/bin/env node
/**
 * Test script for PathPilot Backend API Gateway
 */
const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function testHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check:", response.data);
    return true;
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
    return false;
  }
}

async function testApiInfo() {
  try {
    const response = await axios.get(`${BASE_URL}/api`);
    console.log("✅ API info:", response.data);
    return true;
  } catch (error) {
    console.log("❌ API info failed:", error.message);
    return false;
  }
}

async function testJourney() {
  try {
    const testData = {
      profile: { gpa: 8.5 },
      activity: ["sports", "volunteer", "internship"],
    };

    const response = await axios.post(`${BASE_URL}/api/journey`, testData);
    console.log("✅ Journey endpoint:", response.data);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(
        "⚠️  Journey endpoint (expected if AI service is down):",
        error.response.status,
        error.response.data,
      );
    } else {
      console.log("❌ Journey endpoint failed:", error.message);
    }
    return false;
  }
}

async function testChat() {
  try {
    const testData = {
      message: "Hello, how are you?",
    };

    const response = await axios.post(`${BASE_URL}/api/chat`, testData);
    console.log("✅ Chat endpoint:", response.data);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(
        "⚠️  Chat endpoint (expected if AI service is down):",
        error.response.status,
        error.response.data,
      );
    } else {
      console.log("❌ Chat endpoint failed:", error.message);
    }
    return false;
  }
}

async function runTests() {
  console.log("🧪 Testing PathPilot Backend API Gateway...");
  console.log("Make sure the backend is running: npm start");
  console.log("-".repeat(50));

  const healthOk = await testHealth();
  const apiInfoOk = await testApiInfo();
  const journeyOk = await testJourney();
  const chatOk = await testChat();

  console.log("-".repeat(50));
  console.log(
    `Results: Health=${healthOk}, API=${apiInfoOk}, Journey=${journeyOk}, Chat=${chatOk}`,
  );

  if (healthOk && apiInfoOk) {
    console.log("✅ Backend API Gateway is working!");
    console.log(
      "💡 Journey/Chat may fail if AI service (port 8000) is not running",
    );
  } else {
    console.log("❌ Backend has issues");
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testHealth, testApiInfo, testJourney, testChat };

/**
 * Seed Service
 * Runs once at server startup to ensure default data exists.
 * Currently seeds: guest user profile + gamification state
 */

const { supabase, isAvailable } = require("./supabaseClient");

const GUEST_USER_ID = "guest@pathpilot.ai";

const GUEST_PROFILE = {
  user_id: GUEST_USER_ID,
  name: "Guest",
  gpa: 7.5,
  field_of_study: "Computer Science",
  target_countries: ["Germany", "Canada"],
  target_universities: ["TU Munich", "University of Toronto"],
  budget_range: "limited",
  goals: "MS in Artificial Intelligence",
  test_score: "GRE 310",
  activities: ["internship", "research project", "volunteer work"],
};

const GUEST_GAMIFICATION = {
  user_id: GUEST_USER_ID,
  xp: 150,
  level: 2,
  streak: 1,
  completed_actions: ["first_chat", "roi_calculated"],
  badges: [],
};

async function seedGuestUser() {
  if (!isAvailable) {
    console.log(
      "ℹ️  Supabase not configured — skipping guest seed (in-memory mode)",
    );
    return;
  }

  try {
    // Check if guest profile already exists
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", GUEST_USER_ID)
      .single();

    if (existing) {
      console.log("✅ Guest user already exists — skipping seed");
      return;
    }

    // Seed guest profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert(GUEST_PROFILE);

    if (profileError) {
      console.warn("⚠️  Guest profile seed failed:", profileError.message);
    } else {
      console.log("🌱 Guest profile seeded");
    }

    // Seed guest gamification
    const { error: gamError } = await supabase
      .from("gamification")
      .insert(GUEST_GAMIFICATION);

    if (gamError) {
      console.warn("⚠️  Guest gamification seed failed:", gamError.message);
    } else {
      console.log("🌱 Guest gamification seeded");
    }
  } catch (err) {
    console.warn("⚠️  Seed service error:", err.message);
  }
}

module.exports = { seedGuestUser };

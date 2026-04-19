const { supabase, isAvailable } = require("../services/supabaseClient");

// In-memory fallback for when Supabase is not configured
const memoryProfiles = new Map();

// Default guest profile (used when Supabase is not available)
const GUEST_PROFILE = {
  user_id: "guest@pathpilot.ai",
  name: "Guest",
  email: "guest@pathpilot.ai",
  gpa: "7.5",
  field_of_study: "Computer Science",
  target_countries: ["Germany", "Canada"],
  target_universities: "TU Munich, University of Toronto",
  budget_range: "limited",
  goals: "MS in Artificial Intelligence",
  test_score: "GRE 310",
  activities: ["internship", "research project", "volunteer work"],
};

/**
 * GET /api/profile/:userId
 * Returns the stored profile for a user.
 * Falls back to guest defaults if user is guest and no profile exists.
 */
exports.getProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ error: true, message: "userId required" });

    if (!isAvailable) {
      // In-memory: return guest defaults or stored profile
      const stored = memoryProfiles.get(userId);
      if (stored) return res.json({ success: true, data: stored });
      if (userId === "guest@pathpilot.ai")
        return res.json({ success: true, data: GUEST_PROFILE });
      return res.json({ success: true, data: null });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Return guest defaults if guest user not found in DB yet
      if (userId === "guest@pathpilot.ai") {
        return res.json({ success: true, data: GUEST_PROFILE });
      }
      return res.json({ success: true, data: null });
    }

    // Map DB fields to frontend profile shape
    const profile = {
      name: data.name || (userId === "guest@pathpilot.ai" ? "Guest" : ""),
      email: userId,
      gpa: data.gpa?.toString() || "",
      field_of_study: data.field_of_study || "",
      target_countries: data.target_countries || [],
      target_universities: Array.isArray(data.target_universities)
        ? data.target_universities.join(", ")
        : data.target_universities || "",
      budget_range: data.budget_range || "",
      goals: data.goals || "",
      test_score: data.test_score || "",
      activities: data.activities || [],
    };

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/profile/:userId
 * Upsert a user's profile.
 */
exports.saveProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    if (!isAvailable) {
      memoryProfiles.set(userId, { ...profileData, user_id: userId });
      return res.json({ success: true });
    }

    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        gpa: profileData.gpa ? parseFloat(profileData.gpa) : null,
        field_of_study: profileData.field_of_study || null,
        target_countries: profileData.target_countries || [],
        target_universities: profileData.target_universities
          ? profileData.target_universities.split(",").map((s) => s.trim())
          : [],
        budget_range: profileData.budget_range || null,
        goals: profileData.goals || null,
        test_score: profileData.test_score || null,
        activities: profileData.activities || [],
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

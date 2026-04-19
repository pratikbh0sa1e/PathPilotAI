const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

let supabase = null;

if (url && key) {
  supabase = createClient(url, key);
  console.log("✅ Supabase connected");
} else {
  console.warn(
    "⚠️  SUPABASE_URL/KEY not set — gamification will use in-memory fallback",
  );
}

module.exports = { supabase, isAvailable: !!supabase };

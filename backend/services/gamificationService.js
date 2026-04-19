/**
 * Gamification Service — Backend
 *
 * All state lives in Supabase `gamification` table.
 * Falls back to in-memory Map when Supabase is not configured.
 */

const { supabase, isAvailable } = require("./supabaseClient");

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
const LEVEL_NAMES = [
  "Explorer",
  "Seeker",
  "Planner",
  "Applicant",
  "Candidate",
  "Scholar",
  "Achiever",
  "Champion",
  "Elite",
  "Legend",
];

const ALL_BADGES = [
  {
    id: "profile_complete",
    name: "Profile Pro",
    icon: "person",
    description: "Completed your profile",
  },
  {
    id: "first_chat",
    name: "First Conversation",
    icon: "chat",
    description: "Had your first AI chat",
  },
  {
    id: "roi_calculated",
    name: "Smart Investor",
    icon: "trending_up",
    description: "Calculated your ROI",
  },
  {
    id: "loan_checked",
    name: "Finance Ready",
    icon: "payments",
    description: "Checked loan eligibility",
  },
  {
    id: "timeline_generated",
    name: "Roadmap Ready",
    icon: "calendar_month",
    description: "Generated your application timeline",
  },
  {
    id: "sop_generated",
    name: "Wordsmith",
    icon: "edit_note",
    description: "Generated your SOP draft",
  },
  {
    id: "checklist_done",
    name: "Doc Master",
    icon: "checklist",
    description: "Completed document checklist",
  },
  {
    id: "streak_3",
    name: "On a Roll",
    icon: "local_fire_department",
    description: "3-day login streak",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    icon: "whatshot",
    description: "7-day login streak",
  },
  {
    id: "journey_80",
    name: "High Achiever",
    icon: "star",
    description: "Journey score above 80",
  },
  {
    id: "referral_sent",
    name: "Ambassador",
    icon: "share",
    description: "Referred a friend",
  },
];

const XP_REWARDS = {
  profile_complete: 100,
  first_chat: 50,
  roi_calculated: 75,
  loan_checked: 75,
  timeline_generated: 100,
  sop_generated: 100,
  checklist_done: 150,
  streak_3: 50,
  streak_7: 100,
  journey_80: 200,
  referral_sent: 150,
  daily_login: 10,
};

// ── In-memory fallback ────────────────────────────────────────────────────────
const memoryStore = new Map();

function getLevel(xp) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const nextXP =
    LEVEL_THRESHOLDS[level + 1] ??
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const currentXP = LEVEL_THRESHOLDS[level];
  const range = nextXP - currentXP;
  const progress =
    range > 0 ? Math.round(((xp - currentXP) / range) * 100) : 100;
  return {
    level: level + 1,
    name: LEVEL_NAMES[level] ?? "Legend",
    nextXP,
    progress,
  };
}

function defaultState() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    last_active_date: null,
    completed_actions: [],
    badges: ALL_BADGES.map((b) => ({ ...b, earned: false, earnedAt: null })),
  };
}

// ── DB operations ─────────────────────────────────────────────────────────────

async function getState(userId) {
  if (!isAvailable) {
    return memoryStore.get(userId) ?? defaultState();
  }
  const { data, error } = await supabase
    .from("gamification")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return defaultState();

  // Merge saved badges with ALL_BADGES to pick up new badges
  const savedBadges = data.badges ?? [];
  const mergedBadges = ALL_BADGES.map((b) => {
    const saved = savedBadges.find((s) => s.id === b.id);
    return saved
      ? {
          ...b,
          earned: saved.earned ?? false,
          earnedAt: saved.earnedAt ?? null,
        }
      : { ...b, earned: false, earnedAt: null };
  });

  return {
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    streak: data.streak ?? 0,
    last_active_date: data.last_active_date ?? null,
    completed_actions: data.completed_actions ?? [],
    badges: mergedBadges,
  };
}

async function saveState(userId, state) {
  if (!isAvailable) {
    memoryStore.set(userId, state);
    return;
  }
  await supabase.from("gamification").upsert(
    {
      user_id: userId,
      xp: state.xp,
      level: state.level,
      streak: state.streak,
      last_active_date: state.last_active_date,
      completed_actions: state.completed_actions,
      badges: state.badges,
    },
    { onConflict: "user_id" },
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

async function getGamification(userId) {
  const state = await getState(userId);
  const levelInfo = getLevel(state.xp);
  return {
    ...state,
    levelInfo,
    earnedBadges: state.badges.filter((b) => b.earned),
    pendingBadges: state.badges.filter((b) => !b.earned),
    allBadges: ALL_BADGES,
    xpRewards: XP_REWARDS,
    storageBackend: isAvailable ? "supabase" : "memory",
  };
}

async function trackAction(userId, actionId) {
  const state = await getState(userId);
  let xpGained = 0;
  let newBadge = null;

  // Daily login streak
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const lastActive = state.last_active_date
    ? new Date(state.last_active_date).toDateString()
    : null;

  if (lastActive !== today) {
    state.streak = lastActive === yesterday ? state.streak + 1 : 1;
    state.last_active_date = new Date().toISOString().split("T")[0];
    xpGained += XP_REWARDS.daily_login;

    // Auto-award streak badges
    if (state.streak >= 7 && !state.completed_actions.includes("streak_7")) {
      actionId = "streak_7";
    } else if (
      state.streak >= 3 &&
      !state.completed_actions.includes("streak_3")
    ) {
      actionId = "streak_3";
    }
  }

  // Award XP + badge for action
  if (actionId && !state.completed_actions.includes(actionId)) {
    xpGained += XP_REWARDS[actionId] ?? 25;
    state.completed_actions.push(actionId);

    const badge = state.badges.find((b) => b.id === actionId);
    if (badge && !badge.earned) {
      badge.earned = true;
      badge.earnedAt = new Date().toISOString();
      newBadge = badge;
    }
  }

  state.xp += xpGained;
  state.level = getLevel(state.xp).level;

  await saveState(userId, state);

  return {
    xpGained,
    newBadge,
    streak: state.streak,
    totalXp: state.xp,
    level: getLevel(state.xp),
    storageBackend: isAvailable ? "supabase" : "memory",
  };
}

module.exports = { getGamification, trackAction };

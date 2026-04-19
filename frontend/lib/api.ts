/**
 * PathPilot API client
 * All calls go through the Express backend (port 5000)
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message ?? "Request failed");
  }
  const json = await res.json();
  return json.data ?? json;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  gpa?: number;
  field_of_study?: string;
  target_countries?: string[];
  goals?: string;
  budget_range?: string;
  test_score?: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  memory_length: number;
  persistent_memory: boolean;
}

export interface JourneyResponse {
  journeyScore: number;
  admissionScore: number;
  loanProbability: number;
  breakdown: Record<string, { score: number; max: number; note: string }>;
  admissionDetail: string;
  loanDetail: string;
  insights?: {
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    next_steps: string[];
    university_suggestions: string[];
    scholarship_tips: string[];
    overall_summary: string;
  };
  profile_summary: string;
  insights_generated: boolean;
}

export interface NudgeItem {
  id: string;
  category: string;
  priority: string;
  message: string;
  action_label: string;
  action_route: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const api = {
  chat: (message: string, sessionId: string, profile?: UserProfile) =>
    post<ChatResponse>("/api/chat", {
      message,
      session_id: sessionId,
      user_profile: profile,
    }),

  journey: (profile: UserProfile, activity: string[], includeInsights = true) =>
    post<JourneyResponse>("/api/journey", {
      profile,
      activity,
      include_insights: includeInsights,
    }),

  nudges: (
    profile: UserProfile,
    usedFeatures: string[],
    journeyScore?: number,
  ) =>
    post<{ nudges: NudgeItem[]; count: number }>("/api/nudges", {
      profile,
      used_features: usedFeatures,
      journey_score: journeyScore,
      max_nudges: 4,
      personalize: true,
    }),
};

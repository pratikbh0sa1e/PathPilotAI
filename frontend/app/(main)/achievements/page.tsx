"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/profile-context";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

interface BadgeItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

interface LevelInfo {
  level: number;
  name: string;
  nextXP: number;
  progress: number;
}

interface GamState {
  xp: number;
  level: number;
  streak: number;
  earnedBadges: BadgeItem[];
  pendingBadges: BadgeItem[];
  completedActions: string[];
  levelInfo: LevelInfo;
  storageBackend: string;
}

export default function AchievementsPage() {
  const { profile } = useProfile();
  const [state, setState] = useState<GamState | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = profile.email || "guest";

  useEffect(() => {
    // Track daily login + load state
    const init = async () => {
      try {
        // Track daily login
        await fetch(`${BASE}/api/gamification/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, actionId: "daily_login" }),
        });
        // Load full state
        const res = await fetch(
          `${BASE}/api/gamification/${encodeURIComponent(userId)}`,
        );
        const json = await res.json();
        setState(json.data);
      } catch (e) {
        console.error("Gamification load failed:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Could not load achievements. Make sure the backend is running.
      </div>
    );
  }

  const { levelInfo, earnedBadges, pendingBadges } = state;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            Achievements
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track your progress and earn badges
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${state.storageBackend === "supabase" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
        >
          <span className="material-symbols-outlined text-[12px] mr-1">
            {state.storageBackend === "supabase" ? "cloud_done" : "storage"}
          </span>
          {state.storageBackend === "supabase" ? "Synced to DB" : "In-memory"}
        </Badge>
      </div>

      {/* Level card */}
      <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 border-0 shadow-lg">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-violet-200 text-xs tracking-wide">
                Current Level
              </p>
              <p className="text-white text-3xl font-bold">
                Level {levelInfo.level}
              </p>
              <p className="text-violet-200 text-sm">{levelInfo.name}</p>
            </div>
            <div className="text-right">
              <p className="text-violet-200 text-xs">Total XP</p>
              <p className="text-white text-3xl font-bold">{state.xp}</p>
              <p className="text-violet-200 text-xs">
                {levelInfo.nextXP - state.xp} XP to next level
              </p>
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
          <p className="text-violet-200 text-xs mt-1 text-right">
            {levelInfo.progress}%
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Day Streak",
            value: state.streak,
            icon: "local_fire_department",
            color: "text-orange-500",
          },
          {
            label: "Badges Earned",
            value: earnedBadges.length,
            icon: "military_tech",
            color: "text-violet-500",
          },
          {
            label: "Actions Done",
            value: state.completedActions?.length ?? 0,
            icon: "check_circle",
            color: "text-emerald-500",
          },
        ].map((s) => (
          <Card key={s.label} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="pt-4 pb-4 text-center">
              <span
                className={`material-symbols-outlined text-[28px] ${s.color}`}
              >
                {s.icon}
              </span>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {s.value}
              </p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-violet-500">
                military_tech
              </span>
              Earned Badges
              <Badge
                variant="outline"
                className="ml-auto bg-violet-50 text-violet-700 border-violet-200 text-xs"
              >
                {earnedBadges.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3 text-center"
                >
                  <div className="h-12 w-12 rounded-full bg-violet-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-violet-200">
                    <span className="material-symbols-outlined text-[22px] text-white">
                      {badge.icon}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending badges */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[20px] text-slate-400">
              lock
            </span>
            Badges to Unlock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pendingBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center opacity-60"
              >
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[22px] text-slate-400">
                    {badge.icon}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-600">{badge.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* XP guide */}
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-violet-500">
              info
            </span>
            How to Earn XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              { action: "Daily login", xp: 10 },
              { action: "Complete profile", xp: 100 },
              { action: "First AI chat", xp: 50 },
              { action: "Calculate ROI", xp: 75 },
              { action: "Check loan", xp: 75 },
              { action: "Generate timeline", xp: 100 },
              { action: "Generate SOP", xp: 100 },
              { action: "Complete checklist", xp: 150 },
              { action: "3-day streak", xp: 50 },
              { action: "7-day streak", xp: 100 },
              { action: "Journey score 80+", xp: 200 },
              { action: "Refer a friend", xp: 150 },
            ].map((item) => (
              <div
                key={item.action}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
              >
                <span className="text-xs text-slate-600">{item.action}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-violet-50 text-violet-700 border-violet-200"
                >
                  +{item.xp} XP
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

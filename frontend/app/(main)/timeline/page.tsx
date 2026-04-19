"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/profile-context";

interface Phase {
  phase: string;
  duration: string;
  weeks: string;
  tasks: string[];
  milestone: string;
  priority: "high" | "medium" | "low";
}

interface Deadline {
  item: string;
  date: string;
  weeks_from_now: number;
}

interface Timeline {
  program_start: string;
  total_weeks: number;
  phases: Phase[];
  critical_deadlines: Deadline[];
  quick_wins: string[];
  motivational_note: string;
}

const priorityConfig = {
  high: {
    color: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  medium: {
    color: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    color: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export default function TimelinePage() {
  const { profile } = useProfile();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const apiProfile = {
        gpa: profile.gpa || "8.0",
        field_of_study: profile.field_of_study || "Computer Science",
        target_countries: profile.target_countries.length
          ? profile.target_countries
          : ["Germany"],
        target_universities: profile.target_universities || "",
        goals: profile.goals || "",
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"}/api/timeline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: apiProfile, journey_score: 70 }),
        },
      );
      const data = await res.json();
      setTimeline(data.data ?? data);
    } catch {
      setError(
        "Failed to generate timeline. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            Application Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-generated week-by-week action plan for your study abroad journey
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px] mr-2">
                auto_awesome
              </span>
              Generate My Timeline
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {!timeline && !loading && (
        <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-violet-400">
              calendar_month
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-3 mb-2">
              Your Personalized Roadmap
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Get a week-by-week action plan tailored to your profile, target
              countries, and university deadlines.
            </p>
            <Button
              onClick={generate}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8"
            >
              <span className="material-symbols-outlined text-[18px] mr-2">
                rocket_launch
              </span>
              Generate Timeline
            </Button>
          </CardContent>
        </Card>
      )}

      {timeline && (
        <div className="space-y-5">
          {/* Header card */}
          <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 border-0 shadow-lg">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-violet-200 text-xs tracking-wide">
                    Target Start
                  </p>
                  <p className="text-white text-xl font-bold">
                    {timeline.program_start}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-violet-200 text-xs">Total Duration</p>
                  <p className="text-white text-xl font-bold">
                    {timeline.total_weeks} weeks
                  </p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-violet-200 shrink-0 mt-0.5">
                  auto_awesome
                </span>
                <p className="text-sm text-violet-100 italic">
                  {timeline.motivational_note}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick wins */}
          {timeline.quick_wins?.length > 0 && (
            <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">
                    bolt
                  </span>
                  Do This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {timeline.quick_wins.map((w, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-emerald-800">{w}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Critical deadlines */}
          {timeline.critical_deadlines?.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="material-symbols-outlined text-[20px] text-red-500">
                    alarm
                  </span>
                  Critical Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeline.critical_deadlines.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">
                          event
                        </span>
                        <span className="text-sm text-slate-700">{d.item}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{d.date}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${d.weeks_from_now <= 8 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                        >
                          {d.weeks_from_now}w
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phases */}
          <div className="space-y-4">
            {timeline.phases?.map((phase, i) => {
              const cfg = priorityConfig[phase.priority] ?? priorityConfig.low;
              return (
                <Card key={i} className={`border shadow-sm ${cfg.color}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${cfg.dot}`}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {phase.phase}
                          </p>
                          <p className="text-xs text-slate-500">
                            {phase.duration} · Weeks {phase.weeks}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${cfg.badge}`}
                      >
                        {phase.priority}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      {phase.tasks.map((task, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[14px] text-slate-400 mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <p className="text-sm text-slate-700">{task}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/60 rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-violet-500">
                        flag
                      </span>
                      <p className="text-xs font-medium text-violet-700">
                        Milestone: {phase.milestone}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

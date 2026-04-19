"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ScoreRing from "./ScoreRing";
import InsightCard from "./InsightCard";
import NudgeBar from "./NudgeBar";
import { api, UserProfile, JourneyResponse, NudgeItem } from "@/lib/api";

const DEMO_PROFILE: UserProfile = {
  gpa: 8.5,
  field_of_study: "Computer Science",
  target_countries: ["Germany", "Canada"],
  goals: "MS in Artificial Intelligence",
  budget_range: "limited",
};

const DEMO_ACTIVITIES = [
  "internship at tech company",
  "research project on NLP",
  "volunteer work at NGO",
  "leadership in coding club",
];

export default function JourneyDashboard() {
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [nudges, setNudges] = useState<NudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [journeyData, nudgeData] = await Promise.all([
        api.journey(DEMO_PROFILE, DEMO_ACTIVITIES, true),
        api.nudges(DEMO_PROFILE, ["journey"], undefined),
      ]);
      setJourney(journeyData);
      setNudges(nudgeData.nudges ?? []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Analyzing your profile...</p>
        </div>
      </div>
    );
  }

  const ins = journey?.insights;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            Your Journey
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {DEMO_PROFILE.field_of_study} →{" "}
            {DEMO_PROFILE.target_countries?.join(", ")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <span
            className={`material-symbols-outlined text-[16px] mr-1.5 ${refreshing ? "animate-spin" : ""}`}
          >
            refresh
          </span>
          Refresh
        </Button>
      </div>

      {/* Smart Nudges */}
      {nudges.length > 0 && <NudgeBar nudges={nudges} />}

      {/* Score Cards */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[20px] text-violet-500">
              analytics
            </span>
            Readiness Scores
            {journey && (
              <Badge
                variant="outline"
                className={`ml-auto text-xs ${
                  journey.journeyScore >= 80
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                    : journey.journeyScore >= 60
                      ? "border-amber-300 text-amber-700 bg-amber-50"
                      : "border-red-300 text-red-700 bg-red-50"
                }`}
              >
                {journey.journeyScore >= 80
                  ? "Strong"
                  : journey.journeyScore >= 60
                    ? "Good"
                    : "Needs Work"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around flex-wrap gap-6">
            <ScoreRing
              score={journey?.journeyScore ?? 0}
              label="Journey Score"
              sublabel="Overall readiness"
              color="#7c3aed"
            />
            <ScoreRing
              score={journey?.admissionScore ?? 0}
              label="Admission"
              sublabel="Likelihood"
              color="#0ea5e9"
            />
            <ScoreRing
              score={journey?.loanProbability ?? 0}
              label="Loan Eligibility"
              sublabel="Probability"
              color="#10b981"
            />
          </div>

          {journey?.breakdown && (
            <>
              <Separator className="my-5 bg-slate-100" />
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(journey.breakdown).map(([key, val]) => (
                  <div
                    key={key}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center"
                  >
                    <p className="text-lg font-bold text-slate-800">
                      {val.score}
                      <span className="text-xs text-slate-400">/{val.max}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {key.replace("Score", "").replace(/([A-Z])/g, " $1")}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Summary */}
      {ins ? (
        <>
          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-[24px] text-violet-500 shrink-0 mt-0.5">
                  auto_awesome
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {ins.overall_summary}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard
              title="Strengths"
              icon="star"
              items={ins.strengths}
              variant="success"
            />
            <InsightCard
              title="Gaps to Address"
              icon="warning"
              items={ins.gaps}
              variant="warning"
            />
            <InsightCard
              title="Recommendations"
              icon="tips_and_updates"
              items={ins.recommendations}
              variant="default"
            />
            <InsightCard
              title="Next Steps"
              icon="rocket_launch"
              items={ins.next_steps}
              variant="default"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard
              title="University Targets"
              icon="school"
              items={ins.university_suggestions}
              variant="default"
            />
            <InsightCard
              title="Scholarship Tips"
              icon="payments"
              items={ins.scholarship_tips}
              variant="success"
            />
          </div>
        </>
      ) : (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-300">
              psychology
            </span>
            <p className="text-sm text-slate-400 mt-2">
              AI insights unavailable — check your GROQ_API_KEY
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

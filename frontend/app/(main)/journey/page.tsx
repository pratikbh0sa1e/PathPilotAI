"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api, UserProfile, JourneyResponse } from "@/lib/api";
import { useProfile } from "@/lib/profile-context";

const FALLBACK_ACTIVITIES = [
  "internship at tech company",
  "research project on NLP",
  "volunteer work at NGO",
  "leadership in coding club",
];

// Horizontal progress bar
function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Score tier label
function scoreTier(score: number) {
  if (score >= 80)
    return {
      label: "Excellent",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  if (score >= 65)
    return { label: "Good", color: "bg-blue-50 text-blue-700 border-blue-200" };
  if (score >= 50)
    return {
      label: "Fair",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  return {
    label: "Needs Work",
    color: "bg-red-50 text-red-700 border-red-200",
  };
}

export default function JourneyPage() {
  const { profile } = useProfile();
  const [data, setData] = useState<JourneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const apiProfile = {
        gpa: profile.gpa ? parseFloat(profile.gpa) : undefined,
        field_of_study: profile.field_of_study || undefined,
        target_countries: profile.target_countries.length
          ? profile.target_countries
          : undefined,
        goals: profile.goals || undefined,
        budget_range: profile.budget_range || undefined,
      };
      const activities = profile.activities.length
        ? profile.activities
        : FALLBACK_ACTIVITIES;
      const result = await api.journey(apiProfile, activities, false);
      setData(result);
    } catch (e) {
      console.error(e);
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
          <p className="text-sm text-slate-500">Calculating your scores...</p>
        </div>
      </div>
    );
  }

  const breakdown = data?.breakdown ?? {};
  const tier = scoreTier(data?.journeyScore ?? 0);

  const scoreItems = [
    {
      key: "profileScore",
      label: "Profile Score",
      icon: "person",
      color: "#7c3aed",
      desc: "Academic strength — GPA, test scores, field of study",
    },
    {
      key: "engagementScore",
      label: "Engagement Score",
      icon: "groups",
      color: "#0ea5e9",
      desc: "Activities, internships, research, leadership",
    },
    {
      key: "progressScore",
      label: "Progress Score",
      icon: "route",
      color: "#10b981",
      desc: "Application readiness — countries, universities, goals, budget",
    },
  ];

  const admissionTier = scoreTier(data?.admissionScore ?? 0);
  const loanTier = scoreTier(data?.loanProbability ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            Journey Score
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed breakdown of your study abroad readiness
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
          Recalculate
        </Button>
      </div>

      {/* Overall score hero */}
      <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 border-0 shadow-lg shadow-violet-200">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-200 text-sm tracking-wide mb-1">
                Overall Journey Score
              </p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-bold text-white">
                  {data?.journeyScore ?? 0}
                </span>
                <span className="text-violet-300 text-lg mb-2">/100</span>
              </div>
              <Badge variant="outline" className={`mt-2 ${tier.color} border`}>
                {tier.label}
              </Badge>
            </div>
            <div className="text-right space-y-3">
              <div>
                <p className="text-violet-200 text-xs">Admission Likelihood</p>
                <p className="text-white text-2xl font-bold">
                  {data?.admissionScore ?? 0}%
                </p>
              </div>
              <div>
                <p className="text-violet-200 text-xs">Loan Eligibility</p>
                <p className="text-white text-2xl font-bold">
                  {data?.loanProbability ?? 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-5">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${data?.journeyScore ?? 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-score breakdown */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[20px] text-violet-500">
              bar_chart
            </span>
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {scoreItems.map((item) => {
            const val = breakdown[item.key];
            const score = val?.score ?? 0;
            const max = val?.max ?? 100;
            const note = val?.note ?? "";
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      {score}
                      <span className="text-xs text-slate-400 font-normal">
                        /{max}
                      </span>
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      {Math.round((score / max) * 100)}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={score} max={max} color={item.color} />
                <p className="text-xs text-slate-400 mt-1.5">
                  {note || item.desc}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Admission + Loan detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-blue-500">
                school
              </span>
              Admission Likelihood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold text-blue-600">
                {data?.admissionScore ?? 0}
              </span>
              <span className="text-slate-400 mb-1">/100</span>
              <Badge
                variant="outline"
                className={`ml-auto ${admissionTier.color}`}
              >
                {admissionTier.label}
              </Badge>
            </div>
            <ProgressBar
              value={data?.admissionScore ?? 0}
              max={100}
              color="#0ea5e9"
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {data?.admissionDetail ||
                "Based on GPA, activities, and test scores"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-emerald-500">
                payments
              </span>
              Loan Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold text-emerald-600">
                {data?.loanProbability ?? 0}
              </span>
              <span className="text-slate-400 mb-1">%</span>
              <Badge variant="outline" className={`ml-auto ${loanTier.color}`}>
                {loanTier.label}
              </Badge>
            </div>
            <ProgressBar
              value={data?.loanProbability ?? 0}
              max={100}
              color="#10b981"
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {data?.loanDetail ||
                "Based on GPA, field of study, and target country"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What affects your score */}
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[20px] text-violet-500">
              info
            </span>
            How Your Score is Calculated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "person",
                color: "#7c3aed",
                title: "Profile (40 pts)",
                items: [
                  "GPA strength",
                  "Test scores (GRE/IELTS)",
                  "Field of study",
                ],
              },
              {
                icon: "groups",
                color: "#0ea5e9",
                title: "Engagement (35 pts)",
                items: [
                  "Number of activities",
                  "Internship / research bonus",
                  "Leadership / awards",
                ],
              },
              {
                icon: "route",
                color: "#10b981",
                title: "Progress (25 pts)",
                items: [
                  "Target countries set",
                  "Universities identified",
                  "Goals & budget defined",
                ],
              },
            ].map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ color: section.color }}
                  >
                    {section.icon}
                  </span>
                  <p className="text-xs font-semibold text-slate-700">
                    {section.title}
                  </p>
                </div>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 text-xs text-slate-500"
                    >
                      <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

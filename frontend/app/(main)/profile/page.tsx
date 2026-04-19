"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/lib/profile-context";

const FIELDS = [
  "Computer Science",
  "Data Science",
  "Artificial Intelligence",
  "Software Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Business",
  "MBA",
  "Finance",
  "Medicine",
  "Pharmacy",
  "Law",
  "Architecture",
  "Design",
  "Psychology",
  "Education",
  "Other",
];

const COUNTRIES = [
  "Germany",
  "Canada",
  "UK",
  "USA",
  "Australia",
  "Netherlands",
  "Sweden",
  "Norway",
  "Finland",
  "Denmark",
  "France",
  "Singapore",
  "Japan",
  "New Zealand",
  "Ireland",
];

const BUDGET_OPTIONS = [
  { value: "limited", label: "Limited (< $15k/yr)" },
  { value: "medium", label: "Medium ($15k–$30k/yr)" },
  { value: "high", label: "High (> $30k/yr)" },
];

const ACTIVITY_SUGGESTIONS = [
  "Internship",
  "Research project",
  "Volunteer work",
  "Leadership role",
  "Publication",
  "Award / Scholarship",
  "Sports",
  "Coding project",
  "Teaching / Tutoring",
];

interface Profile {
  name: string;
  email: string;
  gpa: string;
  field_of_study: string;
  target_countries: string[];
  target_universities: string;
  budget_range: string;
  goals: string;
  test_score: string;
  activities: string[];
}

const DEFAULT_PROFILE: Profile = {
  name: "",
  email: "",
  gpa: "",
  field_of_study: "",
  target_countries: [],
  target_universities: "",
  budget_range: "",
  goals: "",
  test_score: "",
  activities: [],
};

export default function ProfilePage() {
  const { profile: ctxProfile, setProfile: saveToContext } = useProfile();

  const [profile, setProfile] = useState<Profile>({
    name: ctxProfile.name || "",
    email: ctxProfile.email || "",
    gpa: ctxProfile.gpa || "",
    field_of_study: ctxProfile.field_of_study || "",
    target_countries: ctxProfile.target_countries || [],
    target_universities: ctxProfile.target_universities || "",
    budget_range: ctxProfile.budget_range || "",
    goals: ctxProfile.goals || "",
    test_score: ctxProfile.test_score || "",
    activities: ctxProfile.activities || [],
  });
  const [saved, setSaved] = useState(false);
  const [activityInput, setActivityInput] = useState("");
  const [activeTab, setActiveTab] = useState<"academic" | "goals" | "account">(
    "academic",
  );

  const set = (k: keyof Profile, v: string | string[]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const toggleCountry = (c: string) => {
    const current = profile.target_countries;
    set(
      "target_countries",
      current.includes(c) ? current.filter((x) => x !== c) : [...current, c],
    );
  };

  const addActivity = (a: string) => {
    const trimmed = a.trim();
    if (!trimmed || profile.activities.includes(trimmed)) return;
    set("activities", [...profile.activities, trimmed]);
    setActivityInput("");
  };

  const removeActivity = (a: string) =>
    set(
      "activities",
      profile.activities.filter((x) => x !== a),
    );

  const handleSave = async () => {
    // Persist to context + localStorage
    saveToContext({
      name: profile.name,
      email: profile.email,
      gpa: profile.gpa,
      field_of_study: profile.field_of_study,
      target_countries: profile.target_countries,
      target_universities: profile.target_universities,
      budget_range: profile.budget_range,
      goals: profile.goals,
      test_score: profile.test_score,
      activities: profile.activities,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: "academic", icon: "school", label: "Academic" },
    { id: "goals", icon: "flag", label: "Goals & Activities" },
    { id: "account", icon: "manage_accounts", label: "Account" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
            Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Keep your profile updated for better AI recommendations
          </p>
        </div>
        <Button
          onClick={handleSave}
          className={`transition-all ${saved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-violet-600 hover:bg-violet-700"} text-white shadow-sm`}
        >
          <span className="material-symbols-outlined text-[18px] mr-2">
            {saved ? "check_circle" : "save"}
          </span>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Profile card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <span className="text-3xl font-bold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[14px] text-slate-500">
                  edit
                </span>
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">
                {profile.name}
              </h2>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.gpa && (
                  <Badge
                    variant="outline"
                    className="bg-violet-50 text-violet-700 border-violet-200 text-xs"
                  >
                    <span className="material-symbols-outlined text-[12px] mr-1">
                      grade
                    </span>
                    GPA {profile.gpa}
                  </Badge>
                )}
                {profile.field_of_study && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    <span className="material-symbols-outlined text-[12px] mr-1">
                      menu_book
                    </span>
                    {profile.field_of_study}
                  </Badge>
                )}
                {profile.target_countries.slice(0, 2).map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                  >
                    <span className="material-symbols-outlined text-[12px] mr-1">
                      public
                    </span>
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Completeness */}
            <div className="text-center hidden md:block">
              <div className="relative h-16 w-16">
                <svg className="-rotate-90 h-16 w-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(Object.values(profile).filter(Boolean).length / Object.keys(profile).length) * 163} 163`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-violet-600">
                    {Math.round(
                      (Object.values(profile).filter(
                        (v) =>
                          v && (Array.isArray(v) ? v.length > 0 : v !== ""),
                      ).length /
                        Object.keys(profile).length) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-white text-violet-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Academic */}
      {activeTab === "academic" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-violet-500">
                school
              </span>
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* GPA */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  GPA (0–10 scale)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                    grade
                  </span>
                  <input
                    type="number"
                    value={profile.gpa}
                    onChange={(e) => set("gpa", e.target.value)}
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Test Score */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Test Score (GRE/IELTS/TOEFL)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                    quiz
                  </span>
                  <input
                    type="text"
                    value={profile.test_score}
                    onChange={(e) => set("test_score", e.target.value)}
                    placeholder="e.g. GRE 320, IELTS 7.5"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Field of Study */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Field of Study
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                  menu_book
                </span>
                <select
                  value={profile.field_of_study}
                  onChange={(e) => set("field_of_study", e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent appearance-none"
                >
                  <option value="">Select field...</option>
                  {FIELDS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Countries */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Target Countries
                <span className="text-slate-400 ml-1">
                  ({profile.target_countries.length} selected)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => {
                  const selected = profile.target_countries.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCountry(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Universities */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Target Universities
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                  account_balance
                </span>
                <input
                  type="text"
                  value={profile.target_universities}
                  onChange={(e) => set("target_universities", e.target.value)}
                  placeholder="e.g. TU Munich, University of Toronto"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Budget Range
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => set("budget_range", b.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                      profile.budget_range === b.value
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Goals & Activities */}
      {activeTab === "goals" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-violet-500">
                flag
              </span>
              Goals & Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Goals */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Academic & Career Goals
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-[16px] text-slate-400">
                  target
                </span>
                <textarea
                  value={profile.goals}
                  onChange={(e) => set("goals", e.target.value)}
                  placeholder="e.g. MS in AI at TU Munich, then work at a top tech company in Europe"
                  rows={3}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Activities */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Activities & Experiences
                <span className="text-slate-400 ml-1">
                  ({profile.activities.length} added)
                </span>
              </label>

              {/* Quick add chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {ACTIVITY_SUGGESTIONS.map((a) => {
                  const added = profile.activities.some((x) =>
                    x.toLowerCase().includes(a.toLowerCase()),
                  );
                  return (
                    <button
                      key={a}
                      onClick={() => !added && addActivity(a.toLowerCase())}
                      disabled={added}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        added
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                          : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                      }`}
                    >
                      {added && (
                        <span className="material-symbols-outlined text-[12px] mr-1">
                          check
                        </span>
                      )}
                      {a}
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                    add_circle
                  </span>
                  <input
                    type="text"
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && addActivity(activityInput)
                    }
                    placeholder="Add custom activity..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
                <Button
                  onClick={() => addActivity(activityInput)}
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4"
                >
                  Add
                </Button>
              </div>

              {/* Activity list */}
              {profile.activities.length > 0 && (
                <div className="mt-3 space-y-2">
                  {profile.activities.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <span className="material-symbols-outlined text-[16px] text-violet-500">
                        check_circle
                      </span>
                      <span className="flex-1 text-sm text-slate-700 capitalize">
                        {a}
                      </span>
                      <button
                        onClick={() => removeActivity(a)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Account */}
      {activeTab === "account" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-violet-500">
                manage_accounts
              </span>
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                    person
                  </span>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                    mail
                  </span>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Change password */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  lock
                </span>
                Change Password
              </p>
              <div className="space-y-3">
                {[
                  "Current Password",
                  "New Password",
                  "Confirm New Password",
                ].map((label) => (
                  <div key={label}>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      {label}
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Danger zone */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  warning
                </span>
                Danger Zone
              </p>
              <p className="text-xs text-red-600 mb-3">
                Deleting your account is permanent and cannot be undone.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 text-xs"
              >
                <span className="material-symbols-outlined text-[14px] mr-1.5">
                  delete_forever
                </span>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          className={`transition-all ${saved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-violet-600 hover:bg-violet-700"} text-white shadow-sm px-8`}
        >
          <span className="material-symbols-outlined text-[18px] mr-2">
            {saved ? "check_circle" : "save"}
          </span>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

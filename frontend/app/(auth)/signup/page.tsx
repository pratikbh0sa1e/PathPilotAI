"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function SignupPage() {
  const router = useRouter();
  const { login } = useProfile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    gpa: "",
    field: "",
    country: "",
    goals: "",
  });
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));

    // Save real user data to context + localStorage
    login({
      name: form.name,
      email: form.email,
      gpa: form.gpa,
      field_of_study: form.field,
      target_countries: form.country ? [form.country] : [],
      goals: form.goals,
      budget_range: "",
      test_score: "",
      activities: [],
      target_universities: "",
    });

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-md">
      <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/60">
        <CardHeader className="pb-0 pt-8 px-8">
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-violet-600 items-center justify-center mb-4 shadow-lg shadow-violet-200">
              <span className="material-symbols-outlined text-[28px] text-white">
                {step === 1 ? "person_add" : "school"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
              {step === 1 ? "Create Account" : "Your Profile"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1
                ? "Start your study abroad journey"
                : "Help us personalize your experience"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s <= step
                      ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {s < step ? (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  ) : (
                    s
                  )}
                </div>
                <span
                  className={`text-xs ${s <= step ? "text-violet-600 font-medium" : "text-slate-400"}`}
                >
                  {s === 1 ? "Account" : "Profile"}
                </span>
                {s < 2 && (
                  <div
                    className={`flex-1 h-px ${step > s ? "bg-violet-300" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    person
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    mail
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <span className="material-symbols-outlined text-[16px] text-red-500">
                    error
                  </span>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl shadow-sm shadow-violet-200 text-sm font-medium mt-2"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">
                  arrow_forward
                </span>
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  GPA (0–10)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    grade
                  </span>
                  <input
                    type="number"
                    value={form.gpa}
                    onChange={(e) => set("gpa", e.target.value)}
                    placeholder="e.g. 8.5"
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Field of Study
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    menu_book
                  </span>
                  <select
                    value={form.field}
                    onChange={(e) => set("field", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent appearance-none"
                  >
                    <option value="">Select field...</option>
                    {FIELDS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Target Country
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    public
                  </span>
                  <select
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent appearance-none"
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Goals <span className="text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-slate-400">
                    flag
                  </span>
                  <textarea
                    value={form.goals}
                    onChange={(e) => set("goals", e.target.value)}
                    placeholder="e.g. MS in AI at TU Munich"
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <span className="material-symbols-outlined text-[16px] text-red-500">
                    error
                  </span>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">
                    arrow_back
                  </span>
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm shadow-violet-200 text-sm font-medium"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] mr-2">
                        rocket_launch
                      </span>
                      Launch
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          <Separator className="my-5 bg-slate-100" />
          <p className="text-center text-sm text-slate-500">
            {step === 1 ? (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <span className="text-xs text-slate-400">
                By signing up you agree to our Terms of Service.
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

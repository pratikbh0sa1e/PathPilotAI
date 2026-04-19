"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LoanResult {
  gpa: number;
  eligibility_score: number;
  eligibility_rating: string;
  max_loan_usd: number;
  recommended_loan_usd: number;
  monthly_emi_max_usd: number;
  monthly_emi_recommended_usd: number;
  total_repayment_usd: number;
  total_interest_usd: number;
  interest_rate_pct: number;
  repayment_years: number;
  available_scholarships: string[];
  is_low_tuition_country: boolean;
  scholarship_note: string;
  explanation: string;
}

const COUNTRIES = [
  "Germany",
  "Canada",
  "UK",
  "USA",
  "Australia",
  "Netherlands",
  "Norway",
  "Sweden",
];

export default function LoanPage() {
  const [gpa, setGpa] = useState("8.5");
  const [tuition, setTuition] = useState("20000");
  const [duration, setDuration] = useState("2");
  const [field, setField] = useState("Computer Science");
  const [country, setCountry] = useState("Germany");
  const [result, setResult] = useState<LoanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"}/api/loan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpa: parseFloat(gpa),
            tuition_usd: parseFloat(tuition),
            duration_years: parseFloat(duration),
            field_of_study: field,
            target_country: country,
          }),
        },
      );
      const json = await res.json();
      setResult(json.data ?? json);
    } catch {
      setError("Failed to connect to backend. Make sure it's running.");
    } finally {
      setLoading(false);
    }
  };

  const ratingColor = (r: string) =>
    r === "Excellent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : r === "Good"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : r === "Fair"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-red-50 text-red-700 border-red-200";

  const eligibilityColor = (score: number) =>
    score >= 85
      ? "#10b981"
      : score >= 70
        ? "#0ea5e9"
        : score >= 55
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
          Loan Eligibility
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Check your loan eligibility and plan your repayment
        </p>
      </div>

      {/* Form */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[20px] text-violet-500">
              account_balance
            </span>
            Your Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "GPA (0–10)",
                value: gpa,
                set: setGpa,
                type: "number",
                placeholder: "8.5",
              },
              {
                label: "Annual Tuition (USD)",
                value: tuition,
                set: setTuition,
                type: "number",
                placeholder: "20000",
              },
              {
                label: "Duration (years)",
                value: duration,
                set: setDuration,
                type: "number",
                placeholder: "2",
              },
              {
                label: "Field of Study",
                value: field,
                set: setField,
                type: "text",
                placeholder: "Computer Science",
              },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Target Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button
            onClick={calculate}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px] mr-2">
                  payments
                </span>
                Check Eligibility
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Explanation */}
          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[24px] text-violet-500 shrink-0">
                  auto_awesome
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={ratingColor(result.eligibility_rating)}
                    >
                      {result.eligibility_rating} Eligibility
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-slate-600 border-slate-200"
                    >
                      Score: {result.eligibility_score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility meter */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">
                  Eligibility Score
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: eligibilityColor(result.eligibility_score) }}
                >
                  {result.eligibility_score}/100
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${result.eligibility_score}%`,
                    backgroundColor: eligibilityColor(result.eligibility_score),
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Loan metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Max Loan",
                value: `$${result.max_loan_usd.toLocaleString()}`,
                icon: "account_balance_wallet",
                color: "text-violet-600",
              },
              {
                label: "Recommended",
                value: `$${result.recommended_loan_usd.toLocaleString()}`,
                icon: "recommend",
                color: "text-blue-600",
              },
              {
                label: "Monthly EMI",
                value: `$${result.monthly_emi_recommended_usd.toLocaleString()}`,
                icon: "calendar_month",
                color: "text-emerald-600",
              },
              {
                label: "Total Interest",
                value: `$${result.total_interest_usd.toLocaleString()}`,
                icon: "percent",
                color: "text-amber-600",
              },
            ].map((m) => (
              <Card
                key={m.label}
                className="bg-white border-slate-200 shadow-sm"
              >
                <CardContent className="pt-4 pb-4 text-center">
                  <span
                    className={`material-symbols-outlined text-[24px] ${m.color}`}
                  >
                    {m.icon}
                  </span>
                  <p className={`text-lg font-bold mt-1 ${m.color}`}>
                    {m.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scholarships */}
          {(result.available_scholarships.length > 0 ||
            result.is_low_tuition_country) && (
            <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    school
                  </span>
                  Scholarship Alternatives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-emerald-700">
                  {result.scholarship_note}
                </p>
                {result.available_scholarships.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700">{s}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

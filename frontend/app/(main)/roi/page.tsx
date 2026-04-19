"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ROIResult {
  field_of_study: string;
  country: string;
  total_investment_usd: number;
  total_tuition_usd: number;
  total_living_cost_usd: number;
  expected_annual_salary_usd: number;
  payback_period_years: number;
  roi_3_year_pct: number;
  roi_5_year_pct: number;
  roi_10_year_pct: number;
  job_demand: string;
  verdict: string;
  explanation: string;
}

const FIELDS = [
  "Computer Science",
  "Data Science",
  "Engineering",
  "Business",
  "Medicine",
  "AI",
  "Finance",
];
const COUNTRIES = [
  "Germany",
  "Canada",
  "UK",
  "USA",
  "Australia",
  "Netherlands",
  "Sweden",
];

export default function ROIPage() {
  const [field, setField] = useState("Computer Science");
  const [country, setCountry] = useState("Germany");
  const [tuition, setTuition] = useState("");
  const [duration, setDuration] = useState("2");
  const [result, setResult] = useState<ROIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"}/api/roi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field_of_study: field,
            country,
            tuition_usd: tuition ? parseFloat(tuition) : undefined,
            duration_years: parseFloat(duration),
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

  const verdictColor = (v: string) =>
    v === "Excellent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : v === "Good"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : v === "Moderate"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
          ROI Calculator
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Calculate your return on investment for studying abroad
        </p>
      </div>

      {/* Form */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[20px] text-violet-500">
              calculate
            </span>
            Program Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Field of Study
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {FIELDS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
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
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Annual Tuition (USD){" "}
                <span className="text-slate-400">optional</span>
              </label>
              <input
                type="number"
                value={tuition}
                onChange={(e) => setTuition(e.target.value)}
                placeholder="Uses country average"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Duration (years)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="6"
                step="0.5"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
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
                  trending_up
                </span>
                Calculate ROI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Verdict */}
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
                      className={verdictColor(result.verdict)}
                    >
                      {result.verdict} Investment
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-slate-600 border-slate-200"
                    >
                      {result.job_demand} Demand
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Total Investment",
                value: `$${result.total_investment_usd.toLocaleString()}`,
                icon: "account_balance_wallet",
                color: "text-slate-700",
              },
              {
                label: "Expected Salary",
                value: `$${result.expected_annual_salary_usd.toLocaleString()}/yr`,
                icon: "payments",
                color: "text-emerald-600",
              },
              {
                label: "Payback Period",
                value: `${result.payback_period_years} yrs`,
                icon: "schedule",
                color: "text-blue-600",
              },
              {
                label: "5-Year ROI",
                value: `${result.roi_5_year_pct}%`,
                icon: "trending_up",
                color: "text-violet-600",
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

          {/* Cost breakdown */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-violet-500">
                  pie_chart
                </span>
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Tuition",
                  value: result.total_tuition_usd,
                  color: "bg-violet-500",
                },
                {
                  label: "Living Costs",
                  value: result.total_living_cost_usd,
                  color: "bg-blue-400",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{
                        width: `${(item.value / result.total_investment_usd) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

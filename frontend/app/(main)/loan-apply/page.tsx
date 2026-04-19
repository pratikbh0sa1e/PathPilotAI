"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/lib/profile-context";
import { trackAction } from "@/lib/gamification";

type Step = "eligibility" | "documents" | "application" | "submitted";

const LOAN_DOCS = [
  { id: "id_proof", label: "Government ID (Passport/Aadhaar)", required: true },
  {
    id: "academic",
    label: "Academic transcripts (10th, 12th, Degree)",
    required: true,
  },
  {
    id: "admission",
    label: "Admission letter from university",
    required: true,
  },
  {
    id: "income",
    label: "Co-applicant income proof (last 3 months)",
    required: true,
  },
  {
    id: "bank_statement",
    label: "Bank statements (last 6 months)",
    required: true,
  },
  {
    id: "collateral",
    label: "Collateral documents (if loan > ₹7.5L)",
    required: false,
  },
  {
    id: "photos",
    label: "Passport-size photographs (4 copies)",
    required: true,
  },
  {
    id: "fee_structure",
    label: "University fee structure / cost of attendance",
    required: true,
  },
];

interface EligibilityResult {
  eligibility_score: number;
  eligibility_rating: string;
  max_loan_usd: number;
  recommended_loan_usd: number;
  monthly_emi_recommended_usd: number;
  explanation: string;
}

export default function LoanApplyPage() {
  const { profile } = useProfile();
  const userId = profile.email || "guest";
  const [step, setStep] = useState<Step>("eligibility");
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState("20000");
  const [coApplicant, setCoApplicant] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/loan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpa: parseFloat(profile.gpa || "7"),
          tuition_usd: parseFloat(loanAmount),
          duration_years: 2,
          field_of_study: profile.field_of_study || "",
          target_country: profile.target_countries[0] || "Germany",
        }),
      });
      const data = await res.json();
      setEligibility(data.data ?? data);
      trackAction(userId, "loan_checked");
      setStep("documents");
    } catch {
      alert("Failed to check eligibility.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const requiredDocs = LOAN_DOCS.filter((d) => d.required);
  const allRequiredChecked = requiredDocs.every((d) => checkedDocs.has(d.id));
  const docProgress = Math.round((checkedDocs.size / LOAN_DOCS.length) * 100);

  const submitApplication = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep("submitted");
    trackAction(userId, "loan_checked");
  };

  const steps = [
    { id: "eligibility", label: "Eligibility", icon: "verified" },
    { id: "documents", label: "Documents", icon: "folder" },
    { id: "application", label: "Application", icon: "description" },
    { id: "submitted", label: "Submitted", icon: "check_circle" },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
          Loan Application
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          AI-assisted education loan application flow
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex flex-col items-center gap-1 ${i <= stepIndex ? "opacity-100" : "opacity-40"}`}
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                  i < stepIndex
                    ? "bg-emerald-600 shadow-sm"
                    : i === stepIndex
                      ? "bg-violet-600 shadow-md shadow-violet-200"
                      : "bg-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-white">
                  {i < stepIndex ? "check" : s.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium ${i === stepIndex ? "text-violet-600" : "text-slate-400"}`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${i < stepIndex ? "bg-emerald-400" : "bg-slate-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Eligibility */}
      {step === "eligibility" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-violet-500">
                verified
              </span>
              Check Your Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Loan Amount (USD)
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Co-applicant Name
                </label>
                <input
                  type="text"
                  value={coApplicant}
                  onChange={(e) => setCoApplicant(e.target.value)}
                  placeholder="Parent/Guardian name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Your Profile Summary
              </p>
              {[
                { label: "GPA", value: profile.gpa || "Not set" },
                { label: "Field", value: profile.field_of_study || "Not set" },
                {
                  label: "Target Country",
                  value: profile.target_countries[0] || "Not set",
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-700">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={checkEligibility}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] mr-2">
                    verified
                  </span>
                  Check Eligibility
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Documents */}
      {step === "documents" && eligibility && (
        <div className="space-y-4">
          {/* Eligibility result */}
          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[24px] text-violet-500">
                  auto_awesome
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      Eligibility: {eligibility.eligibility_rating}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs bg-violet-100 text-violet-700 border-violet-200"
                    >
                      {eligibility.eligibility_score}/100
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Max loan: ${eligibility.max_loan_usd?.toLocaleString()} ·
                    EMI: ${eligibility.monthly_emi_recommended_usd}/mo
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {eligibility.explanation}
              </p>
            </CardContent>
          </Card>

          {/* Document checklist */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-violet-500">
                    folder
                  </span>
                  Document Checklist
                </div>
                <span className="text-xs text-slate-500">
                  {checkedDocs.size}/{LOAN_DOCS.length} ready
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all"
                  style={{ width: `${docProgress}%` }}
                />
              </div>
              {LOAN_DOCS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    checkedDocs.has(doc.id)
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200 hover:border-violet-200"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${checkedDocs.has(doc.id) ? "text-emerald-600" : "text-slate-300"}`}
                  >
                    {checkedDocs.has(doc.id)
                      ? "check_circle"
                      : "radio_button_unchecked"}
                  </span>
                  <span
                    className={`text-sm flex-1 ${checkedDocs.has(doc.id) ? "line-through text-slate-400" : "text-slate-700"}`}
                  >
                    {doc.label}
                  </span>
                  {doc.required && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-red-50 text-red-600 border-red-200 shrink-0"
                    >
                      Required
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            onClick={() => setStep("application")}
            disabled={!allRequiredChecked}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">
              arrow_forward
            </span>
            Continue to Application{" "}
            {!allRequiredChecked && "(Complete required docs first)"}
          </Button>
        </div>
      )}

      {/* Step 3: Application */}
      {step === "application" && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-violet-500">
                description
              </span>
              Loan Application Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-violet-700 mb-2">
                Auto-filled from your profile
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Applicant Name", value: profile.name || "Student" },
                  { label: "Email", value: profile.email || "Not set" },
                  { label: "GPA", value: profile.gpa || "Not set" },
                  {
                    label: "Field",
                    value: profile.field_of_study || "Not set",
                  },
                  {
                    label: "Target Country",
                    value: profile.target_countries[0] || "Not set",
                  },
                  {
                    label: "Loan Amount",
                    value: `$${parseInt(loanAmount).toLocaleString()}`,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-slate-500">{item.label}</p>
                    <p className="font-medium text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Purpose of Loan
              </label>
              <textarea
                rows={3}
                defaultValue={`Education loan for ${profile.field_of_study || "MS"} program in ${profile.target_countries[0] || "Germany"}. ${profile.goals || ""}`}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
                info
              </span>
              <p className="text-xs text-amber-700">
                This is a demo application. In production, this would connect to
                an NBFC partner API for real loan processing.
              </p>
            </div>

            <Button
              onClick={submitApplication}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] mr-2">
                    send
                  </span>
                  Submit Application
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Submitted */}
      {step === "submitted" && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
              <span className="material-symbols-outlined text-[32px] text-white">
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Application Submitted!
            </h3>
            <p className="text-sm text-slate-600 mb-1">
              Reference ID:{" "}
              <span className="font-mono font-bold text-violet-600">
                PP-{Date.now().toString().slice(-8)}
              </span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Our team will review your application within 2-3 business days.
            </p>
            <div className="bg-white rounded-xl border border-emerald-200 p-4 text-left space-y-2 mb-6">
              <p className="text-xs font-semibold text-slate-700">
                Next Steps:
              </p>
              {[
                "Check your email for confirmation",
                "Keep documents ready for verification call",
                "Track status in your dashboard",
                "Expect decision in 3-5 business days",
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
            <Button
              onClick={() => setStep("eligibility")}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Apply for Another Loan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

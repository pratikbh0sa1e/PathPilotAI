"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/lib/profile-context";

interface DocItem {
  doc: string;
  status: string;
  priority: string;
  tip: string;
  deadline_weeks: number;
}

interface DocCategory {
  category: string;
  items: DocItem[];
}

interface Checklist {
  checklist: DocCategory[];
  total_documents: number;
  estimated_preparation_weeks: number;
  critical_items: string[];
  country_specific_note: string;
}

interface SOPResult {
  sop_draft: string;
  word_count: number;
  target_university: string;
  note: string;
}

const priorityColor = (p: string) =>
  p === "high"
    ? "bg-red-50 text-red-700 border-red-200"
    : p === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-600 border-slate-200";

export default function DocumentsPage() {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<"checklist" | "sop">("checklist");
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [sop, setSop] = useState<SOPResult | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

  const apiProfile = {
    name: profile.name || "Student",
    gpa: profile.gpa || "8.0",
    field_of_study: profile.field_of_study || "Computer Science",
    target_countries: profile.target_countries.length
      ? profile.target_countries
      : ["Germany"],
    target_universities: profile.target_universities || "",
    goals: profile.goals || "",
    activities: profile.activities || [],
    test_score: profile.test_score || "",
  };

  const generateChecklist = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/documents/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: apiProfile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.message ??
            data?.detail ??
            "Failed to generate checklist. Make sure the AI service is running.",
        );
        return;
      }
      const result = data.data ?? data;
      if (!result?.checklist) {
        setError("AI returned an unexpected response. Please try again.");
        return;
      }
      setChecklist(result);
    } catch {
      setError(
        "Failed to connect to backend. Make sure both backend and AI service are running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const generateSOP = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/documents/sop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: apiProfile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.message ??
            data?.detail ??
            "Failed to generate SOP. Make sure the AI service is running.",
        );
        return;
      }
      const result = data.data ?? data;
      if (!result?.sop_draft) {
        setError("AI returned an unexpected response. Please try again.");
        return;
      }
      setSop(result);
    } catch {
      setError(
        "Failed to connect to backend. Make sure both backend and AI service are running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const copySOp = () => {
    if (sop) {
      navigator.clipboard.writeText(sop.sop_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalItems =
    checklist?.checklist?.reduce(
      (sum, cat) => sum + (cat.items?.length ?? 0),
      0,
    ) ?? 0;
  const completedItems = checkedItems.size;
  const progress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
          Documents & SOP
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          AI-generated document checklist and Statement of Purpose draft
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {[
          { id: "checklist", icon: "checklist", label: "Document Checklist" },
          { id: "sop", icon: "edit_note", label: "SOP Generator" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as "checklist" | "sop")}
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {/* Checklist Tab */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          {!checklist ? (
            <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 shadow-sm">
              <CardContent className="py-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-violet-400">
                  checklist
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-3 mb-2">
                  AI Document Checklist
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  Get a personalized checklist of all documents needed for{" "}
                  {profile.target_countries[0] || "your target country"}.
                </p>
                <Button
                  onClick={generateChecklist}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8"
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
                      Generate Checklist
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Overall Progress
                    </span>
                    <span className="text-sm font-bold text-violet-600">
                      {completedItems}/{totalItems} docs
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>
                      {checklist.estimated_preparation_weeks} weeks estimated
                    </span>
                    <span>{progress}% complete</span>
                  </div>
                </CardContent>
              </Card>

              {/* Country note */}
              {checklist.country_specific_note && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="text-sm text-blue-700">
                    {checklist.country_specific_note}
                  </p>
                </div>
              )}

              {/* Categories */}
              {checklist.checklist.map((cat, ci) => (
                <Card key={ci} className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-800">
                      <span>{cat.category}</span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-50 text-slate-600 border-slate-200"
                      >
                        {
                          cat.items.filter((item) =>
                            checkedItems.has(`${ci}-${item.doc}`),
                          ).length
                        }
                        /{cat.items.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cat.items.map((item, ii) => {
                      const key = `${ci}-${item.doc}`;
                      const checked = checkedItems.has(key);
                      return (
                        <div
                          key={ii}
                          onClick={() => toggleItem(key)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            checked
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-slate-50 border-slate-200 hover:border-violet-200"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${checked ? "text-emerald-600" : "text-slate-300"}`}
                          >
                            {checked
                              ? "check_circle"
                              : "radio_button_unchecked"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={`text-sm font-medium ${checked ? "line-through text-slate-400" : "text-slate-800"}`}
                              >
                                {item.doc}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${priorityColor(item.priority)}`}
                              >
                                {item.priority}
                              </Badge>
                              {item.deadline_weeks && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-slate-50 text-slate-500 border-slate-200"
                                >
                                  {item.deadline_weeks}w
                                </Badge>
                              )}
                            </div>
                            {item.tip && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.tip}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={generateChecklist}
                className="w-full border-slate-200 text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px] mr-2">
                  refresh
                </span>
                Regenerate Checklist
              </Button>
            </>
          )}
        </div>
      )}

      {/* SOP Tab */}
      {activeTab === "sop" && (
        <div className="space-y-4">
          {!sop ? (
            <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 shadow-sm">
              <CardContent className="py-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-violet-400">
                  edit_note
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-3 mb-2">
                  AI Statement of Purpose
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-2">
                  Generate a personalized SOP draft for{" "}
                  {profile.target_universities?.split(",")[0] ||
                    "your target university"}
                  .
                </p>
                <p className="text-xs text-slate-400 mb-6">
                  Based on your profile: {profile.field_of_study || "CS"} · GPA{" "}
                  {profile.gpa || "N/A"} · {profile.goals || "MS abroad"}
                </p>
                <Button
                  onClick={generateSOP}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                      Writing SOP...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] mr-2">
                        auto_awesome
                      </span>
                      Generate SOP Draft
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-violet-500">
                        edit_note
                      </span>
                      SOP Draft — {sop.target_university}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-50 text-slate-600 border-slate-200"
                      >
                        {sop.word_count} words
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copySOp}
                        className="border-slate-200 text-slate-600 text-xs h-7"
                      >
                        <span className="material-symbols-outlined text-[14px] mr-1">
                          {copied ? "check" : "content_copy"}
                        </span>
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2 mb-4">
                    <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
                      warning
                    </span>
                    <p className="text-xs text-amber-700">{sop.note}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">
                    {sop.sop_draft}
                  </div>
                </CardContent>
              </Card>
              <Button
                variant="outline"
                onClick={generateSOP}
                disabled={loading}
                className="w-full border-slate-200 text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px] mr-2">
                  refresh
                </span>
                Regenerate SOP
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

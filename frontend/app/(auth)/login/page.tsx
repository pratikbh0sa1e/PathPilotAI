"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate auth — replace with real auth (Supabase, NextAuth, etc.)
    await new Promise((r) => setTimeout(r, 1000));
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
                login
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to continue your journey
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600 tracking-wide">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <span className="material-symbols-outlined text-[16px] text-red-500">
                  error
                </span>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl shadow-sm shadow-violet-200 text-sm font-medium tracking-wide mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] mr-2">
                    login
                  </span>
                  Sign In
                </>
              )}
            </Button>
          </form>

          <Separator className="my-6 bg-slate-100" />

          {/* Social login placeholder */}
          <Button
            variant="outline"
            className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm"
            onClick={() => router.push("/dashboard")}
          >
            <span className="material-symbols-outlined text-[18px] mr-2 text-slate-500">
              account_circle
            </span>
            Continue as Guest
          </Button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              Sign up free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

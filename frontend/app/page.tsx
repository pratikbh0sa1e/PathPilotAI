import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: "psychology",
    title: "AI Mentor Chat",
    desc: "Get personalized study abroad guidance powered by Llama 3.3 70B.",
  },
  {
    icon: "analytics",
    title: "Journey Score",
    desc: "See your readiness score across profile, engagement, and progress.",
  },
  {
    icon: "trending_up",
    title: "ROI Calculator",
    desc: "Know if your investment pays off before you commit.",
  },
  {
    icon: "payments",
    title: "Loan Eligibility",
    desc: "Check your loan eligibility and plan monthly repayments.",
  },
  {
    icon: "school",
    title: "University Match",
    desc: "Get reach, match, and safety university recommendations.",
  },
  {
    icon: "lightbulb",
    title: "Smart Nudges",
    desc: "AI-powered reminders tailored to your profile and goals.",
  },
];

const stats = [
  { value: "50+", label: "Countries Covered" },
  { value: "10K+", label: "Students Guided" },
  { value: "95%", label: "Satisfaction Rate" },
  { value: "24/7", label: "AI Availability" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-share-tech)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <span className="material-symbols-outlined text-[18px] text-white">
                explore
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-wide">
              PathPilot
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors"
            >
              How it works
            </a>
            <a href="#stats" className="hover:text-slate-900 transition-colors">
              Stats
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900"
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 pt-24 pb-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-100/60 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-violet-200 text-violet-700 bg-violet-50 px-4 py-1.5 text-xs tracking-wider uppercase"
          >
            <span className="material-symbols-outlined text-[14px] mr-1.5">
              auto_awesome
            </span>
            AI-Powered Study Abroad Mentor
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-wide mb-6">
            Your Path to
            <span className="text-violet-600"> Global Education</span>
            <br />
            Starts Here
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            PathPilot uses advanced AI to guide you through every step of
            studying abroad — from university selection to loan planning, all
            personalized to your profile.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 shadow-lg shadow-violet-200 text-base"
              >
                <span className="material-symbols-outlined text-[20px] mr-2">
                  rocket_launch
                </span>
                Start Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 px-8 text-base"
              >
                <span className="material-symbols-outlined text-[20px] mr-2">
                  login
                </span>
                Sign In
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-xs text-slate-400 tracking-wide">
            Trusted by students applying to universities in 50+ countries
          </p>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-violet-600 tracking-wide">
                  {s.value}
                </p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 tracking-wide mb-3">
              Everything You Need
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From AI-powered chat to financial planning — PathPilot covers
              every aspect of your study abroad journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-violet-200 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                  <span className="material-symbols-outlined text-[22px] text-violet-600">
                    {f.icon}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 tracking-wide">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 tracking-wide mb-3">
              How It Works
            </h2>
            <p className="text-slate-500">
              Three simple steps to your dream university
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "person_add",
                title: "Create Profile",
                desc: "Enter your GPA, field of study, target countries, and goals.",
              },
              {
                step: "02",
                icon: "psychology",
                title: "Get AI Analysis",
                desc: "Our AI scores your readiness and generates personalized insights.",
              },
              {
                step: "03",
                icon: "rocket_launch",
                title: "Take Action",
                desc: "Follow your personalized roadmap to your dream university.",
              },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="inline-flex h-14 w-14 rounded-2xl bg-violet-600 items-center justify-center mb-4 shadow-lg shadow-violet-200">
                  <span className="material-symbols-outlined text-[26px] text-white">
                    {s.icon}
                  </span>
                </div>
                <div className="absolute top-6 left-[calc(50%+28px)] right-0 h-px bg-slate-200 hidden md:block last:hidden" />
                <p className="text-xs text-violet-500 font-bold tracking-widest mb-1">
                  {s.step}
                </p>
                <h3 className="text-sm font-bold text-slate-900 mb-2 tracking-wide">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-wide mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-violet-200 mb-8 leading-relaxed">
            Join thousands of students who have used PathPilot to navigate their
            study abroad journey with confidence.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-violet-700 hover:bg-violet-50 px-10 shadow-lg text-base font-bold"
            >
              <span className="material-symbols-outlined text-[20px] mr-2">
                explore
              </span>
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-md bg-violet-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px] text-white">
              explore
            </span>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">
            PathPilot AI
          </span>
        </div>
        <p className="text-xs text-slate-500">
          © 2025 PathPilot. AI-powered study abroad guidance.
        </p>
      </footer>
    </div>
  );
}

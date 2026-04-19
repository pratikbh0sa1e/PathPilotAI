"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/chat", icon: "chat", label: "AI Chat" },
  { href: "/journey", icon: "route", label: "Journey" },
  { href: "/roi", icon: "trending_up", label: "ROI" },
  { href: "/loan", icon: "payments", label: "Loan" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <span className="material-symbols-outlined text-[20px] text-white">
                explore
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 tracking-wide group-hover:text-violet-700 transition-colors">
                PathPilot
              </p>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase">
                AI Study Mentor
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-violet-50 text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[20px]",
                    active ? "text-violet-600" : "text-slate-400",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile card at bottom */}
        <div className="px-4 py-4 border-t border-slate-100">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
              pathname === "/profile"
                ? "bg-violet-50 border-violet-200"
                : "bg-slate-50 border-slate-200 hover:bg-violet-50 hover:border-violet-200",
            )}
          >
            <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                Student
              </p>
              <p className="text-[10px] text-slate-400">GPA 8.5 · CS</p>
            </div>
            <span
              className={cn(
                "material-symbols-outlined text-[16px] transition-colors",
                pathname === "/profile" ? "text-violet-500" : "text-slate-400",
              )}
            >
              settings
            </span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

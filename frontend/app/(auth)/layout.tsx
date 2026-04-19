import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex flex-col">
      {/* Minimal nav */}
      <nav className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
            <span className="material-symbols-outlined text-[18px] text-white">
              explore
            </span>
          </div>
          <span className="text-base font-bold text-slate-900 tracking-wide group-hover:text-violet-700 transition-colors">
            PathPilot
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 py-4">
        © 2026 PathPilot AI. All rights reserved.
      </p>
    </div>
  );
}

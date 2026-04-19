"use client";

import { NudgeItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

const priorityConfig = {
  high: {
    bg: "bg-red-50 border-red-200",
    btn: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    icon: "priority_high",
    iconColor: "text-red-500",
  },
  medium: {
    bg: "bg-amber-50 border-amber-200",
    btn: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
    icon: "info",
    iconColor: "text-amber-500",
  },
  low: {
    bg: "bg-violet-50 border-violet-200",
    btn: "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200",
    icon: "lightbulb",
    iconColor: "text-violet-500",
  },
};

export default function NudgeBar({ nudges }: { nudges: NudgeItem[] }) {
  if (!nudges.length) return null;
  return (
    <div className="space-y-2">
      {nudges.map((nudge) => {
        const cfg =
          priorityConfig[nudge.priority as keyof typeof priorityConfig] ??
          priorityConfig.low;
        return (
          <div
            key={nudge.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3",
              cfg.bg,
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[20px] mt-0.5 shrink-0",
                cfg.iconColor,
              )}
            >
              {cfg.icon}
            </span>
            <p className="flex-1 text-sm text-slate-700 leading-relaxed">
              {nudge.message}
            </p>
            <Link
              href={nudge.action_route}
              className={cn(
                "shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap",
                cfg.btn,
              )}
            >
              {nudge.action_label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

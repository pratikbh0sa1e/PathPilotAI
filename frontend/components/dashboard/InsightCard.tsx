import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  title: string;
  icon: string;
  items: string[];
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: {
    icon: "text-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-400",
  },
  success: {
    icon: "text-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
  },
  warning: {
    icon: "text-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  danger: {
    icon: "text-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-400",
  },
};

export default function InsightCard({
  title,
  icon,
  items,
  variant = "default",
  className,
}: InsightCardProps) {
  const s = variantStyles[variant];
  return (
    <Card
      className={cn(
        "bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className={cn("material-symbols-outlined text-[20px]", s.icon)}>
            {icon}
          </span>
          {title}
          <Badge variant="outline" className={cn("ml-auto text-xs", s.badge)}>
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <span
              className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", s.dot)}
            />
            <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

interface ScoreRingProps {
  score: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
}

export default function ScoreRing({
  score,
  max = 100,
  label,
  sublabel,
  color = "#7c3aed",
  size = 120,
}: ScoreRingProps) {
  const pct = Math.min(score / max, 1);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const cx = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={8}
          />
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{score}</span>
          {max !== 100 && (
            <span className="text-xs text-slate-400">/{max}</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
}

interface ScoreRingProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export default function ScoreRing({
  value,
  maxValue = 100,
  size = 80,
  strokeWidth = 6,
  label,
  className = "",
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value / maxValue, 0), 1);
  const offset = circumference * (1 - pct);

  const color =
    pct >= 0.8
      ? "text-emerald-500"
      : pct >= 0.5
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${className}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-700 ease-out`}
        />
      </svg>
      <span className="absolute text-sm font-bold text-slate-700 tabular-nums" style={{ marginTop: size / 2 - 10 }}>
        {value}
        <span className="text-[10px] font-normal text-slate-400">/{maxValue}</span>
      </span>
      {label && (
        <span className="text-[11px] font-medium text-slate-500 mt-0.5">
          {label}
        </span>
      )}
    </div>
  );
}

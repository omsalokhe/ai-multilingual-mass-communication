import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  iconBg?: string;
  label: string;
  value: string | number;
  change?: number;
  changeSuffix?: string;
  className?: string;
}

export default function StatCard({
  icon,
  iconBg = "bg-blue-50",
  label,
  value,
  change,
  changeSuffix = "vs last month",
  className = "",
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 card-hover animate-fade-in ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {isPositive ? "+" : ""}
            {change}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {change !== undefined && (
        <div className="text-[10px] text-slate-400 mt-1">{changeSuffix}</div>
      )}
    </div>
  );
}

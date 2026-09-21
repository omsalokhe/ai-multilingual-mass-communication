import { cn } from "../lib/utils";

const STATUS_COLORS: Record<string, string> = {
  // Campaign statuses
  DRAFT: "bg-amber-100 text-amber-800 border-amber-200",
  READY_FOR_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  VALIDATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SCHEDULED: "bg-violet-100 text-violet-800 border-violet-200",
  RUNNING: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",

  // Priority
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",

  // Sentiment
  POSITIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NEUTRAL: "bg-amber-100 text-amber-800 border-amber-200",
  NEGATIVE: "bg-red-100 text-red-800 border-red-200",

  // Quality
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",

  // Generic
  SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  ERROR: "bg-red-100 text-red-800 border-red-200",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass =
    STATUS_COLORS[status?.toUpperCase()] ||
    "bg-slate-100 text-slate-600 border-slate-200";
  const label = status?.replace(/_/g, " ") ?? "UNKNOWN";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}

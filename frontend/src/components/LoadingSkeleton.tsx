interface LoadingSkeletonProps {
  rows?: number;
  type?: "card" | "line" | "detail";
}

export default function LoadingSkeleton({
  rows = 3,
  type = "card",
}: LoadingSkeletonProps) {
  if (type === "line") {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="h-4 bg-slate-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-100 rounded-xl border border-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-200 p-5 space-y-3"
        >
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-slate-100 rounded-full w-16" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

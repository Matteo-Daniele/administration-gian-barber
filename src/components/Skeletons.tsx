export default function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-zinc-200 ${className}`} />
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-200 ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonLine className="mb-2 h-7 w-48" />
        <SkeletonLine className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="h-28" />
        ))}
      </div>
      <SkeletonCard className="h-48" />
      <SkeletonCard className="h-24" />
    </div>
  );
}

export function CutsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonLine className="mb-2 h-7 w-56" />
        <SkeletonLine className="h-4 w-72" />
      </div>
      <SkeletonCard className="h-[420px]" />
      <SkeletonCard className="h-64" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonLine className="mb-2 h-7 w-48" />
        <SkeletonLine className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="h-10 w-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-28" />
        ))}
      </div>
      <SkeletonCard className="h-48" />
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonLine className="mb-2 h-7 w-40" />
        <SkeletonLine className="h-4 w-56" />
      </div>
      <SkeletonCard className="h-14" />
      {[1, 2].map((i) => (
        <SkeletonCard key={i} className="h-40" />
      ))}
    </div>
  );
}

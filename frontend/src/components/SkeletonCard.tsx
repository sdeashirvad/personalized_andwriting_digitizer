export function SkeletonDocCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 skeleton rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-48" />
          <div className="h-3 skeleton rounded w-28" />
        </div>
        <div className="h-5 skeleton rounded-full w-24" />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 skeleton rounded-lg" />
        <div className="h-3 skeleton rounded w-16" />
      </div>
      <div className="h-7 skeleton rounded w-12 mb-1" />
      <div className="h-3 skeleton rounded w-24" />
    </div>
  )
}

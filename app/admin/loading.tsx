export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-slate-200/50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass h-28 animate-pulse rounded-2xl border-white/60"
          />
        ))}
      </div>

      <div className="glass h-80 animate-pulse rounded-2xl border-white/60" />
    </div>
  )
}

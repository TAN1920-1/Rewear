export default function DonorLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-200/50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="glass h-28 animate-pulse rounded-2xl border-white/60"
          />
        ))}
      </div>

      <div className="glass h-72 animate-pulse rounded-2xl border-white/60" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-6 sm:h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-40" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-14 w-14 bg-[var(--bg-card)]/50 rounded animate-pulse" />
              <div className="h-5 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/2" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



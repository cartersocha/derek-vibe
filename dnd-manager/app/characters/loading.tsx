export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 sm:h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-40" />
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-4 shadow-2xl">
            <div className="h-5 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/2 mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



export default function Loading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="h-6 sm:h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-40" />
      {[1,2,3].map((i) => (
        <div key={i} className="rounded-lg border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-4 sm:p-6 shadow-2xl">
          <div className="h-5 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/3 mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}



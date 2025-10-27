export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-6 sm:h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-40" />
      {[1,2,3,4].map((i) => (
        <div key={i} className="rounded-lg border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-4 sm:p-6 shadow-2xl">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/3" />
              <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-2/3" />
              <div className="flex gap-2">
                {[1,2,3].map((j) => (
                  <div key={j} className="h-6 bg-[var(--bg-card)]/50 rounded-full animate-pulse w-16" />
                ))}
              </div>
            </div>
            <div className="h-6 bg-[var(--bg-card)]/50 rounded animate-pulse w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}



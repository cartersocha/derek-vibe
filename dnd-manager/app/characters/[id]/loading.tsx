export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-6 shadow-2xl space-y-6">
        <div className="h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-48 bg-[var(--bg-card)]/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}



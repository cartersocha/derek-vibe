export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Title skeleton */}
      <div>
        <div className="h-6 sm:h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-32"></div>
      </div>

      {/* Statistics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)]/80 p-4 sm:p-6 min-h-[100px] flex flex-col justify-center"
          >
            <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-16"></div>
          </div>
        ))}
      </div>

      {/* Recent Sessions skeleton */}
      <div className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6">
          <div className="h-6 sm:h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-48"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)] bg-opacity-50 p-4 sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="h-6 bg-[var(--bg-card)]/50 rounded animate-pulse w-3/4 mb-2"></div>
                  <div className="h-4 bg-[var(--bg-card)]/50 rounded animate-pulse w-1/2 mb-3"></div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="h-6 bg-[var(--bg-card)]/50 rounded-full animate-pulse w-16"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="h-8 bg-[var(--bg-card)]/50 rounded animate-pulse w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

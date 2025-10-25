export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-dark)]">
      <div className="max-w-md w-full space-y-8 p-12 bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl">
        <div>
          <div className="mt-6 text-center text-4xl font-bold glitch tracking-[0.15em] animate-pulse">
            ENTER ACCESS CODE
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <div className="appearance-none relative block w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded animate-pulse h-12"></div>
          </div>
          <div>
            <div className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded text-black bg-[var(--cyber-magenta)] animate-pulse h-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

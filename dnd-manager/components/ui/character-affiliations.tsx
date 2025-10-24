import Link from 'next/link';

interface Affiliation {
  id: string;
  name: string;
  role: string | null;
  roleLabel: string | null;
}

interface CharacterAffiliationsProps {
  affiliations: Affiliation[];
}

export function CharacterAffiliations({ affiliations }: CharacterAffiliationsProps) {
  return (
    <section className="mb-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Affiliations</h3>
      </div>
      {affiliations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {affiliations.map((affiliation) => (
            <Link
              key={affiliation.id}
              href={`/organizations/${affiliation.id}`}
              className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/70 hover:bg-[var(--cyber-cyan)]/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
            >
              <span className="font-semibold">{affiliation.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)]">No organization affiliations yet.</p>
      )}
    </section>
  );
}

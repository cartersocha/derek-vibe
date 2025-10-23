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
        <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Affiliations</h3>
      </div>
      {affiliations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {affiliations.map((affiliation) => (
            <Link
              key={affiliation.id}
              href={`/organizations/${affiliation.id}`}
              className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c]"
            >
              <span className="font-semibold">{affiliation.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm font-mono uppercase tracking-wider text-gray-500">No organization affiliations yet.</p>
      )}
    </section>
  );
}

"use client";

import { useState } from 'react';
import Link from 'next/link';

type ExpandableOrganizationsProps = {
  sessionId: string;
  organizations: Array<{ id: string; name: string }>;
  className?: string;
};

export function ExpandableOrganizations({ sessionId, organizations, className }: ExpandableOrganizationsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleSessionGroups = (sessionId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  return (
    <div className={className}>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
        Groups
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {(expandedGroups.has(sessionId) 
          ? organizations 
          : organizations.slice(0, 5)
        ).map((organization) => (
          <Link
            key={organization.id}
            href={`/organizations/${organization.id}`}
            className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c] min-h-[24px]"
          >
            {organization.name}
          </Link>
        ))}
        {!expandedGroups.has(sessionId) && organizations.length > 5 && (
          <button
            onClick={() => toggleSessionGroups(sessionId)}
            className="inline-flex items-center rounded-full border border-dashed border-[#fcee0c]/50 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] hover:border-[#ffd447] hover:text-[#ffd447] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c] min-h-[24px]"
          >
            +{organizations.length - 5} more
          </button>
        )}
        {expandedGroups.has(sessionId) && organizations.length > 5 && (
          <button
            onClick={() => toggleSessionGroups(sessionId)}
            className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] min-h-[24px]"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

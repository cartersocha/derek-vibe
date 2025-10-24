"use client";

import Link from 'next/link';
import { useState } from 'react';

type SessionCharacterCardProps = {
  character: {
    id: string;
    name: string;
    level: string | null;
    player_type: 'npc' | 'player' | null;
    organizations: Array<{ id: string; name: string }>;
  };
};

export function SessionCharacterCard({ character }: SessionCharacterCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const isPlayer = character.player_type === 'player';
  const badgeClasses = isPlayer
    ? 'border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] text-[var(--cyber-cyan)] group-hover:border-[var(--cyber-cyan)] group-hover:text-[var(--cyber-magenta)]'
    : 'border border-[var(--cyber-magenta)] border-opacity-40 bg-[var(--bg-card)] text-[var(--cyber-magenta)] group-hover:border-[var(--cyber-magenta)] group-hover:text-[var(--cyber-magenta)]';
  const cardClasses = isPlayer
    ? 'border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-dark)]/70 hover:border-[var(--cyber-magenta)] hover:bg-[var(--bg-dark)] focus-visible:ring-[var(--cyber-cyan)]'
    : 'border border-[var(--cyber-magenta)] border-opacity-30 bg-[var(--bg-dark)] hover:border-[var(--cyber-magenta)] hover:bg-[var(--bg-dark)] focus-visible:ring-[var(--cyber-magenta)]';
  const nameClasses = isPlayer
    ? 'font-medium text-[var(--cyber-cyan)] font-mono text-sm sm:text-base transition-colors group-hover:text-[var(--cyber-magenta)] focus-visible:ring-[var(--cyber-cyan)]'
    : 'font-medium text-[var(--cyber-magenta)] font-mono text-sm sm:text-base transition-colors group-hover:text-[var(--cyber-magenta)] focus-visible:ring-[var(--cyber-magenta)]';
  const organizationChipClasses = 'inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--cyber-magenta)] transition-colors hover-brightness focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap';
  const showMoreButtonBaseClasses = 'inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--cyber-magenta)] transition-colors focus-visible:outline-none focus-visible:ring-2 whitespace-nowrap';
  const levelLabel = character.level
    ? isPlayer
      ? `Level ${character.level}`
      : `CR ${character.level}`
    : null;

  const displayedOrganizations = expanded ? character.organizations : character.organizations.slice(0, 3);
  const hasMore = character.organizations.length > 3;

  return (
    <div
      className={`group p-3 rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${cardClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/characters/${character.id}`}
          className={`focus-visible:outline-none focus-visible:ring-2 ${nameClasses}`}
        >
          {character.name}
        </Link>
        {character.player_type ? (
          <span className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${badgeClasses}`}>
            {isPlayer ? 'Player' : 'NPC'}
          </span>
        ) : null}
      </div>
      {levelLabel ? (
        <p className="mt-2 text-[11px] text-gray-400 font-mono uppercase tracking-wider">
          {levelLabel}
        </p>
      ) : null}
      {character.organizations.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {displayedOrganizations.map((organization) => (
            <Link
              key={`${character.id}-${organization.id}`}
              href={`/organizations/${organization.id}`}
              className={`focus-visible:outline-none focus-visible:ring-2 ${organizationChipClasses}`}
            >
              {organization.name}
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={toggleExpanded}
              className={`${showMoreButtonBaseClasses} ${
                expanded
                  ? 'border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 hover-brightness focus-visible:ring-[var(--cyber-magenta)]'
                  : 'border-dashed border-[var(--cyber-magenta)]/50 hover-brightness focus-visible:ring-[var(--cyber-magenta)]'
              }`}
            >
              {expanded ? 'Show less' : `+${character.organizations.length - 3} more`}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

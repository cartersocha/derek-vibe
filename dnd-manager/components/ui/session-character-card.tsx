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
    ? 'border border-[#00ffff] border-opacity-40 bg-[#0f0f23] text-[#00ffff] group-hover:border-[#00ffff] group-hover:text-[#ff00ff]'
    : 'border border-[#ff00ff] border-opacity-40 bg-[#211027] text-[#ff6ad5] group-hover:border-[#ff6ad5] group-hover:text-[#ff9de6]';
  const cardClasses = isPlayer
    ? 'border border-[#00ffff] border-opacity-20 bg-[#0f0f23]/70 hover:border-[#ff00ff] hover:bg-[#0f0f23] focus-visible:ring-[#00ffff]'
    : 'border border-[#ff00ff] border-opacity-30 bg-[#1a0220] hover:border-[#ff6ad5] hover:bg-[#1a0220] focus-visible:ring-[#ff6ad5]';
  const nameClasses = isPlayer
    ? 'font-medium text-[#00ffff] font-mono text-sm sm:text-base transition-colors group-hover:text-[#ff00ff] focus-visible:ring-[#00ffff]'
    : 'font-medium text-[#ff6ad5] font-mono text-sm sm:text-base transition-colors group-hover:text-[#ff9de6] focus-visible:ring-[#ff6ad5]';
  const organizationChipClasses = 'inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#fcee0c] transition-colors hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:ring-[#ffd447]';
  const showMoreButtonBaseClasses = 'inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#fcee0c] transition-colors focus-visible:outline-none focus-visible:ring-2';
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
                  ? 'border-[#fcee0c]/70 bg-[#1a1400] hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:ring-[#ffd447]'
                  : 'border-dashed border-[#fcee0c]/50 hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:ring-[#ffd447]'
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

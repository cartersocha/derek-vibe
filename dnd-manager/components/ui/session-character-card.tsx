"use client";

import Link from 'next/link';
import { useState } from 'react';
import { getPillClasses, getDashedPillClasses, cn } from '@/lib/utils';

type SessionCharacterCardProps = {
  character: {
    id: string;
    name: string;
    level: string | null;
    player_type: 'npc' | 'player' | null;
    groups: Array<{ id: string; name: string }>;
  };
};

export function SessionCharacterCard({ character }: SessionCharacterCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const isPlayer = character.player_type === 'player';
  const cardClasses = isPlayer
    ? 'border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-dark)]/70 hover:border-[var(--cyber-magenta)] hover:bg-[var(--bg-dark)] focus-visible:ring-[var(--cyber-cyan)]'
    : 'border border-[var(--cyber-magenta)] border-opacity-30 bg-[var(--bg-dark)] hover:border-[var(--cyber-magenta)] hover:bg-[var(--bg-dark)] focus-visible:ring-[var(--cyber-magenta)]';
  const nameClasses = isPlayer
    ? 'font-medium text-[var(--cyber-cyan)] font-mono text-sm sm:text-base transition-colors group-hover:text-[var(--cyber-magenta)] focus-visible:ring-[var(--cyber-cyan)]'
    : 'font-medium text-[var(--cyber-magenta)] font-mono text-sm sm:text-base transition-colors group-hover:text-[var(--cyber-magenta)] focus-visible:ring-[var(--cyber-magenta)]';
  const groupChipClasses = cn(getPillClasses('group', 'small'), 'whitespace-nowrap');
  const showMoreButtonBaseClasses = cn(getDashedPillClasses('group', 'small'), 'whitespace-nowrap');
  const levelLabel = character.level
    ? isPlayer
      ? `Level ${character.level}`
      : `CR ${character.level}`
    : null;

  const displayedGroups = expanded ? character.groups : character.groups.slice(0, 3);
  const hasMore = character.groups.length > 3;

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
          <span className={getPillClasses(
            character.player_type === 'player' ? 'player' : 'npc',
            'small'
          )}>
            {isPlayer ? 'Player' : 'NPC'}
          </span>
        ) : null}
      </div>
      {levelLabel ? (
        <p className="mt-2 text-[11px] text-[var(--gray-400)] font-mono uppercase tracking-wider">
          {levelLabel}
        </p>
      ) : null}
      {character.groups.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {displayedGroups.map((group) => (
            <Link
              key={`${character.id}-${group.id}`}
              href={`/groups/${group.id}`}
              className={`focus-visible:outline-none focus-visible:ring-2 ${groupChipClasses}`}
            >
              {group.name}
            </Link>
          ))}
          {hasMore && (
            <button
              onClick={toggleExpanded}
              className={`${showMoreButtonBaseClasses} ${
                expanded
                  ? 'border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/70 hover:bg-[var(--cyber-cyan)]/10 focus-visible:ring-[var(--cyber-magenta)]'
                  : 'border-dashed border-[var(--cyber-magenta)]/50 hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/50 focus-visible:ring-[var(--cyber-magenta)]'
              }`}
            >
              {expanded ? 'Show less' : `+${character.groups.length - 3} more`}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

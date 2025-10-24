"use client";

import Link from 'next/link';
import { useState } from 'react';

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    race?: string;
    class?: string;
    level?: string;
    player_type?: string;
    last_known_location?: string;
    description?: string;
    organization_characters: Array<{
      role: string;
      organization: {
        id: string;
        name: string;
      };
    }>;
  };
}

export function CharacterCard({ character }: CharacterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover-cyber ${
        character.player_type === 'npc' 
          ? 'bg-[var(--cyber-magenta)]/10 border-[var(--cyber-magenta)] border-opacity-30' 
          : 'bg-[var(--bg-card)] bg-opacity-50'
      }`}
    >
      <Link
        href={`/characters/${character.id}`}
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
        aria-label={`View character ${character.name}`}
      >
        <span aria-hidden="true" />
      </Link>
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="relative z-10 flex-1 pointer-events-none">
          <div className="mb-2">
            <span className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber">
              {character.name}
            </span>
          </div>

          {/* Character Attributes as Key-Value Pairs */}
          <div className="mb-3 space-y-0.5">
            {character.race && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Race:</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.race}</span>
              </div>
            )}
            {character.class && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Class:</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.class}</span>
              </div>
            )}
            {character.level && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Level:</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.level}</span>
              </div>
            )}
          </div>

          {/* Organizations */}
          {character.organization_characters && character.organization_characters.length > 0 && (
            <div className="mb-3 pointer-events-auto">
              <div className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2">Groups:</div>
              <div className="flex flex-wrap gap-2">
                {(isExpanded 
                  ? character.organization_characters 
                  : character.organization_characters.slice(0, 3)
                ).map((org, index) => (
                  <Link
                    key={index}
                    href={`/organizations/${org.organization?.id}`}
                    className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-magenta-to-cyan transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                  >
                    {org.organization?.name || 'Unknown Org'}
                  </Link>
                ))}
                {!isExpanded && character.organization_characters.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpansion();
                    }}
                    className="inline-flex items-center rounded-full border border-dashed border-[var(--cyber-magenta)]/50 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-magenta-to-cyan transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                  >
                    +{character.organization_characters.length - 3} more
                  </button>
                )}
                {isExpanded && character.organization_characters.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpansion();
                    }}
                    className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-magenta-to-cyan transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Location */}
          {character.last_known_location && (
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Location:</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.last_known_location}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {character.description && (
            <div className="font-mono text-sm whitespace-pre-line break-words text-[var(--text-primary)] mt-4 pt-4 border-t border-[var(--cyber-cyan)] border-opacity-20">
              {character.description}
            </div>
          )}
        </div>
      </div>
      
      {/* Player Type Tag - Bottom Right */}
      {character.player_type && (
        <div className="absolute bottom-4 right-4 z-20">
          <span className={`inline-flex items-center rounded px-[var(--pill-padding-x-small)] py-[var(--pill-padding-y-small)] text-[10px] font-mono uppercase tracking-[0.3em] transition-colors focus:outline-none focus-visible:ring-2 ${
            character.player_type === 'player' 
              ? 'border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] text-[var(--cyber-cyan)] hover-cyber focus-visible:ring-[var(--cyber-cyan)]'
              : 'border border-[var(--cyber-magenta)] border-opacity-40 bg-[var(--cyber-magenta)]/10 text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/10 focus-visible:ring-[var(--cyber-magenta)]'
          }`}>
            {character.player_type}
          </span>
        </div>
      )}
    </article>
  );
}

"use client";

import Link from 'next/link';
import { useState } from 'react';
import { getPillClasses, getDashedPillClasses } from '@/lib/utils';

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
    campaign_characters?: Array<{
      id: string;
      name: string;
    }>;
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
  const [isCampaignsExpanded, setIsCampaignsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(prev => !prev);
  };

  const toggleCampaigns = () => {
    setIsCampaignsExpanded(prev => !prev);
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 p-4 pb-12 shadow-2xl backdrop-blur-sm transition-all duration-200 hover-cyber ${
        character.player_type === 'npc' 
          ? 'bg-[var(--cyber-magenta)]/10 border-[var(--cyber-magenta)] border-opacity-30' 
          : 'bg-[var(--bg-card)] bg-opacity-50'
      }`}
    >
      <Link
        href={`/characters/${character.id}`}
        prefetch
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
        aria-label={`View character ${character.name}`}
      >
        <span aria-hidden="true" />
      </Link>
      <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:justify-between sm:items-start">
        <div className="relative z-10 flex-1 pointer-events-none">
          <div className="mb-2">
            <span className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber">
              {character.name}
            </span>
          </div>

          {/* Character Attributes as Key-Value Pairs */}
          <div className="mb-2 space-y-0.5">
            {character.race && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Race</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.race}</span>
              </div>
            )}
            {character.class && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Class</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.class}</span>
              </div>
            )}
            {character.level && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Level</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.level}</span>
              </div>
            )}
          </div>

          {/* Location */}
          {character.last_known_location && (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Location</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{character.last_known_location}</span>
              </div>
            </div>
          )}

          {/* Campaigns */}
          {character.campaign_characters && character.campaign_characters.length > 0 && (
            <div className="mb-2 pointer-events-auto">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">Campaigns</div>
              <div className="flex flex-wrap gap-2">
                {(isCampaignsExpanded
                  ? character.campaign_characters
                  : character.campaign_characters.slice(0, 3)
                ).map((campaign, index) => (
                  <Link
                    key={index}
                    href={`/campaigns/${campaign.id}`}
                    prefetch
                    className={getPillClasses('campaign', 'small')}
                  >
                    {campaign.name}
                  </Link>
                ))}
                {!isCampaignsExpanded && character.campaign_characters.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCampaigns();
                    }}
                    className={getDashedPillClasses('campaign', 'small')}
                    aria-label={`Show ${character.campaign_characters.length - 3} more campaigns`}
                  >
                    +{character.campaign_characters.length - 3} more
                  </button>
                )}
                {isCampaignsExpanded && character.campaign_characters.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCampaigns();
                    }}
                    className={getPillClasses('default', 'small')}
                    aria-label="Show fewer campaigns"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Organizations */}
          {character.organization_characters && character.organization_characters.length > 0 && (
            <div className="mb-2 pointer-events-auto">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">Groups</div>
              <div className="flex flex-wrap gap-2">
                {(isExpanded 
                  ? character.organization_characters 
                  : character.organization_characters.slice(0, 3)
                ).map((org, index) => (
                  <Link
                    key={index}
                    href={`/organizations/${org.organization?.id}`}
                    prefetch
                    className={getPillClasses('organization', 'small')}
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
                    className={getDashedPillClasses('organization', 'small')}
                    aria-label={`Show ${character.organization_characters.length - 3} more organizations`}
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
                    className={getPillClasses('default', 'small')}
                    aria-label="Show fewer organizations"
                  >
                    Show less
                  </button>
                )}
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
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
          <span className={getPillClasses(
            character.player_type === 'player' ? 'player' : 'npc',
            'small'
          )}>
            {character.player_type === 'player' ? 'Player' : 'NPC'}
          </span>
        </div>
      )}
    </article>
  );
}

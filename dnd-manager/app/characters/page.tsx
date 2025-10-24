"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrganizations, setExpandedOrganizations] = useState<Set<string>>(new Set());

  const toggleOrganizationExpansion = (characterId: string) => {
    setExpandedOrganizations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    async function fetchCharacters() {
      const supabase = createClient();

      try {
        // First, get the basic characters data
        const [charactersResult, organizationMemberCountsResult] = await Promise.all([
          supabase
            .from('characters')
            .select(`
              *,
              organization_characters (
                role,
                organization:organizations (id, name)
              )
            `)
            .order('name'),
          supabase.from('organization_characters').select('organization_id'),
        ])

        const characters = charactersResult.data ?? []
        const organizationMemberCounts = new Map<string, number>()
        organizationMemberCountsResult.data?.forEach(row => {
          const orgId = row.organization_id
          organizationMemberCounts.set(orgId, (organizationMemberCounts.get(orgId) || 0) + 1)
        })

        // If no characters, set empty array
        if (!characters || characters.length === 0) {
          setCharacters([]);
          setLoading(false);
          return;
        }

        // Get character IDs for additional queries
        const characterIds = characters.map(char => char.id)

        // Fetch session relationships
        const { data: sessionRelations } = await supabase
          .from('session_characters')
          .select(`
            session:sessions(id, name, campaign_id, session_date, created_at),
            character_id
          `)
          .in('character_id', characterIds)

        // Fetch campaign relationships
        const { data: campaignRelations } = await supabase
          .from('campaign_characters')
          .select(`
            campaign:campaigns(id, name),
            character_id
          `)
          .in('character_id', characterIds)

        const enrichedCharacters = characters.map(character => {
          const characterSessions = sessionRelations
            ?.filter(rel => rel.character_id === character.id)
            .map(rel => rel.session) || []

          const characterCampaigns = campaignRelations
            ?.filter(rel => rel.character_id === character.id)
            .map(rel => rel.campaign) || []

          const sortedOrganizations = (character.organization_characters || []).sort((a: any, b: any) => {
            const nameA = a.organization?.name || '';
            const nameB = b.organization?.name || '';
            return nameA.localeCompare(nameB);
          }) || []

          return {
            ...character,
            organization_characters: sortedOrganizations,
            session_characters: characterSessions,
            campaign_characters: characterCampaigns
          }
        })

        setCharacters(enrichedCharacters);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching characters:', error);
        setLoading(false);
      }
    }

    fetchCharacters();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">Characters</h1>
        </div>
        <div className="text-[var(--cyber-cyan)]">Loading characters...</div>
      </div>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">Characters</h1>
        </div>
        <div className="text-[var(--cyber-cyan)]">No characters found.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">Characters</h1>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {characters.map((character) => (
          <article
            key={character.id}
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
                      <span className="text-xs font-mono uppercase tracking-widest text-[var(--cyber-cyan)] opacity-60">Race:</span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">{character.race}</span>
                    </div>
                  )}
                  {character.class && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-[var(--cyber-cyan)] opacity-60">Class:</span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">{character.class}</span>
                    </div>
                  )}
                  {character.level && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-[var(--cyber-cyan)] opacity-60">Level:</span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">{character.level}</span>
                    </div>
                  )}
                </div>

                
                {/* Organizations */}
                {character.organization_characters && character.organization_characters.length > 0 && (
                  <div className="mb-3 pointer-events-auto">
                    <div className="text-xs font-mono uppercase tracking-widest text-[var(--cyber-cyan)] opacity-60 mb-2">Groups:</div>
                    <div className="flex flex-wrap gap-2">
                      {(expandedOrganizations.has(character.id) 
                        ? character.organization_characters 
                        : character.organization_characters.slice(0, 3)
                      ).map((org: any, index: number) => (
                        <Link
                          key={index}
                          href={`/organizations/${org.organization?.id}`}
                          className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                        >
                          {org.organization?.name || 'Unknown Org'}
                        </Link>
                      ))}
                      {!expandedOrganizations.has(character.id) && character.organization_characters.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleOrganizationExpansion(character.id);
                          }}
                          className="inline-flex items-center rounded-full border border-dashed border-[var(--cyber-magenta)]/50 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                        >
                          +{character.organization_characters.length - 3} more
                        </button>
                      )}
                      {expandedOrganizations.has(character.id) && character.organization_characters.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleOrganizationExpansion(character.id);
                          }}
                          className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
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
                      <span className="text-xs font-mono uppercase tracking-widest text-[var(--cyber-cyan)] opacity-60">Location:</span>
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
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono uppercase tracking-widest ${
                  character.player_type === 'player' ? 'border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--cyber-cyan)]/10 text-[var(--cyber-cyan)]' :
                  'border-[var(--cyber-magenta)] border-opacity-40 bg-[var(--cyber-magenta)]/10 text-[var(--cyber-magenta)]'
                }`}>
                  {character.player_type}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
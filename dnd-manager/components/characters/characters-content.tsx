"use client";

import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { CharacterSearch } from "@/components/ui/character-search";

interface Character {
  id: string;
  name: string;
  race: string | null;
  class: string | null;
  level: string | null;
  player_type: string;
  status: string | null;
  created_at: string;
  campaigns: Array<{
    campaign: {
      id: string;
      name: string;
    };
  }>;
  organization_characters: Array<{
    role: string;
    organization: {
      id: string;
      name: string;
    };
  }>;
  session_characters: Array<{
    character_id: string;
    session: {
      id: string;
      name: string;
      session_date: string | null;
      campaign_id: string | null;
      campaign: {
        id: string;
        name: string;
      } | null;
    };
  }>;
  campaign_characters: Array<{
    character_id: string;
    campaign: {
      id: string;
      name: string;
    };
  }>;
}

interface CharactersContentProps {
  characters: Character[];
}

export default function CharactersContent({ characters }: CharactersContentProps) {
  const { selectedCampaignId, isFilterActive } = useCampaignFilter();

  // Filter characters based on selected campaign
  const filteredCharacters = selectedCampaignId 
    ? characters.filter(character => {
        // Check if character is in any of their campaigns that match the selected campaign
        return character.campaigns.some(
          campaignRelation => campaignRelation.campaign.id === selectedCampaignId
        );
      })
    : characters;

  return (
    <div className="space-y-6">
      {isFilterActive && (
        <div className="rounded border border-[#ff00ff] border-opacity-30 bg-[#1a1a3e] p-4">
          <p className="text-sm text-[#ff00ff] font-mono uppercase tracking-wider">
            Showing characters from the selected campaign only
          </p>
        </div>
      )}
      
      <CharacterSearch characters={filteredCharacters} />
    </div>
  );
}

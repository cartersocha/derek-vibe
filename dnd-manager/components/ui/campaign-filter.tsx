"use client";

import { useState, useEffect, useRef } from "react";
import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
}

interface CampaignFilterProps {
  isCollapsed: boolean;
}

export default function CampaignFilter({ isCollapsed }: CampaignFilterProps) {
  const { selectedCampaignId, setSelectedCampaignId, clearFilter, isFilterActive } = useCampaignFilter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("campaigns")
          .select("id, name")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to fetch campaigns:", error);
          return;
        }

        setCampaigns(data || []);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const handleCampaignSelect = (campaignId: string | null) => {
    setSelectedCampaignId(campaignId);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        isCollapsed ? "w-14 h-10" : "w-full px-3 py-2"
      )}>
        <div className="animate-pulse text-xs text-gray-500">
          {isCollapsed ? "..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff]",
          isCollapsed
            ? "w-14 h-10 px-2"
            : "w-full px-3 py-2 text-sm",
          isFilterActive && "border-[#ff00ff] text-[#ff00ff] bg-[#1a1a3e]"
        )}
        title={isCollapsed ? (selectedCampaign?.name || "Filter by campaign") : undefined}
      >
        {isCollapsed ? (
          <span className="text-lg">⚔</span>
        ) : (
          <>
            <span className="truncate">
              {selectedCampaign ? selectedCampaign.name : "All Campaigns"}
            </span>
            <span className="text-xs ml-2">
              {isOpen ? "▲" : "▼"}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-2xl shadow-[#00ffff]/20">
          <div className="max-h-60 overflow-y-auto">
            <ul className="divide-y divide-[#1a1a3e]">
              <li>
                <button
                  type="button"
                  onClick={() => handleCampaignSelect(null)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[#1a1a3e]/60",
                    !selectedCampaignId ? "text-[#ff00ff]" : "text-[#00ffff]"
                  )}
                >
                  <span>All Campaigns</span>
                  {!selectedCampaignId && <span className="text-xs uppercase tracking-wider">Selected</span>}
                </button>
              </li>
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <button
                    type="button"
                    onClick={() => handleCampaignSelect(campaign.id)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[#1a1a3e]/60",
                      selectedCampaignId === campaign.id ? "text-[#ff00ff]" : "text-[#00ffff]"
                    )}
                  >
                    <span className="truncate">{campaign.name}</span>
                    {selectedCampaignId === campaign.id && (
                      <span className="text-xs uppercase tracking-wider">Selected</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

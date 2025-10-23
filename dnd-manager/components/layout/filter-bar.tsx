"use client";

import { useState, useEffect } from "react";
import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
}

export default function FilterBar() {
  const { selectedCampaignId, setSelectedCampaignId, isFilterActive } = useCampaignFilter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      const target = event.target as Element;
      if (!target.closest('[data-filter-bar]')) {
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

  const clearFilter = () => {
    setSelectedCampaignId(null);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="border-b border-[#00ffff] border-opacity-20 bg-[#0f0f23] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="animate-pulse text-sm text-gray-500">
            Loading filters...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="border-b border-[#00ffff] border-opacity-20 bg-[#0f0f23] px-4 py-3"
      data-filter-bar
    >
      <div className="flex items-center justify-between">
        {/* Filter Label */}
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-bold text-[#00ffff] uppercase tracking-wider">
            Filters
          </h3>
          {isFilterActive && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#ff00ff] font-mono uppercase tracking-wider">
                Active
              </span>
              <div className="w-2 h-2 bg-[#ff00ff] rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Campaign Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "flex items-center justify-between rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] px-3 py-2 text-sm min-w-[200px]",
                isFilterActive && "border-[#ff00ff] text-[#ff00ff] bg-[#1a1a3e]"
              )}
            >
              <span className="flex-1 min-w-0 truncate" title={selectedCampaign?.name || "All Campaigns"}>
                {selectedCampaign ? selectedCampaign.name : "All Campaigns"}
              </span>
              <span className="text-xs ml-2 flex-shrink-0">
                {isOpen ? "▲" : "▼"}
              </span>
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
                          <span className="flex-1 min-w-0 pr-2">
                            <span className="block truncate" title={campaign.name}>
                              {campaign.name}
                            </span>
                          </span>
                          {selectedCampaignId === campaign.id && (
                            <span className="text-xs uppercase tracking-wider flex-shrink-0">Selected</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Clear Filter Button */}
          {isFilterActive && (
            <button
              type="button"
              onClick={clearFilter}
              className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#ff00ff] hover:text-[#ff6ad5] transition-colors duration-200 border border-[#ff00ff] border-opacity-30 rounded hover:border-[#ff6ad5] hover:bg-[#ff00ff]/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Status */}
      {isFilterActive && (
        <div className="mt-2 text-xs text-[#ff00ff] font-mono uppercase tracking-wider">
          Showing content for: <span className="font-bold">{selectedCampaign?.name}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
}

interface CampaignFilterContextType {
  selectedCampaignId: string | null;
  setSelectedCampaignId: (campaignId: string | null) => void;
  clearFilter: () => void;
  isFilterActive: boolean;
}

const CampaignFilterContext = createContext<CampaignFilterContextType | undefined>(undefined);

const CAMPAIGN_FILTER_STORAGE_KEY = "campaign-filter";

export function CampaignFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCampaignId, setSelectedCampaignIdState] = useState<string | null>(null);
  const pathname = usePathname();

  // Load filter from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const stored = window.localStorage.getItem(CAMPAIGN_FILTER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "string") {
          setSelectedCampaignIdState(parsed);
        }
      } catch (error) {
        console.error("Failed to parse stored campaign filter", error);
        window.localStorage.removeItem(CAMPAIGN_FILTER_STORAGE_KEY);
      }
    }
  }, []);

  // Save filter to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (selectedCampaignId) {
      window.localStorage.setItem(CAMPAIGN_FILTER_STORAGE_KEY, JSON.stringify(selectedCampaignId));
    } else {
      window.localStorage.removeItem(CAMPAIGN_FILTER_STORAGE_KEY);
    }
  }, [selectedCampaignId]);

  const setSelectedCampaignId = useCallback((campaignId: string | null) => {
    setSelectedCampaignIdState(campaignId);
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedCampaignIdState(null);
  }, []);

  const isFilterActive = selectedCampaignId !== null;

  return (
    <CampaignFilterContext.Provider
      value={{
        selectedCampaignId,
        setSelectedCampaignId,
        clearFilter,
        isFilterActive,
      }}
    >
      {children}
    </CampaignFilterContext.Provider>
  );
}

export function useCampaignFilter() {
  const context = useContext(CampaignFilterContext);
  if (context === undefined) {
    throw new Error("useCampaignFilter must be used within a CampaignFilterProvider");
  }
  return context;
}

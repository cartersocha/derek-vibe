"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored !== null) return JSON.parse(stored);
    }
    return true; // default to collapsed
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const collapsedStored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      const isCollapsedStored = collapsedStored ? JSON.parse(collapsedStored) : true;
      const storedWidth = window.localStorage.getItem("sidebar-width");
      const parsed = storedWidth ? Number(storedWidth) : 200;
      const initialExpanded = Number.isFinite(parsed) ? parsed : 200;
      const clampedExpanded = Math.min(Math.max(initialExpanded, 64), 220);
      return isCollapsedStored ? 64 : clampedExpanded;
    }
    return 64;
  }); // Default width - matches DEFAULT_WIDTH from navbar

  // Removed separate init effect; initial state reads from localStorage

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

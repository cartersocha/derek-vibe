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
  // Hydration-safe defaults: always start collapsed and at collapsed width.
  // We load user preferences from localStorage AFTER mount to avoid SSR/client mismatches.
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(64); // collapsed width

  // Load persisted state on mount only (client-side)
  useEffect(() => {
    try {
      const storedCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      const nextCollapsed = storedCollapsed !== null ? JSON.parse(storedCollapsed) : true;

      const storedWidth = window.localStorage.getItem("sidebar-width");
      const parsedWidth = storedWidth ? Number(storedWidth) : 200;
      const initialExpanded = Number.isFinite(parsedWidth) ? parsedWidth : 200;
      const clampedExpanded = Math.min(Math.max(initialExpanded, 64), 220);

      setIsCollapsed(nextCollapsed);
      setSidebarWidth(nextCollapsed ? 64 : clampedExpanded);
    } catch {
      // Ignore parsing errors and keep defaults
    }
  }, []);

  // Removed separate init effect; initial state reads from localStorage

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, JSON.stringify(isCollapsed));
    } catch {
      // ignore write errors
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

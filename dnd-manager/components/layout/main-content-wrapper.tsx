"use client";

import { useSidebar } from "@/components/providers/sidebar-provider";

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebar();
  
  return (
    <main 
      className="pt-1"
      style={{
        marginLeft: `${sidebarWidth}px`
      }}
    >
      {children}
    </main>
  );
}

"use client";

import { useSidebar } from "@/components/providers/sidebar-provider";
import { useEffect, useState } from "react";

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return (
    <main 
      className="pt-1"
      style={{
        marginLeft: isMobile ? '0px' : `${sidebarWidth}px`
      }}
    >
      {children}
    </main>
  );
}

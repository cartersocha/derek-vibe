"use client";

import { useSidebar } from "@/components/providers/sidebar-provider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't use sidebar context on login page or during SSR
  if (!isClient || pathname === "/login") {
    return (
      <main className="pt-1">
        {children}
      </main>
    );
  }
  
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

"use client";

import { useSidebar } from "@/components/providers/sidebar-provider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { sidebarWidth } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
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
        // Avoid sidebar offset on login page, SSR, or mobile
        marginLeft: (!isClient || pathname === '/login' || isMobile) ? '0px' : `${sidebarWidth}px`
      }}
    >
      {children}
    </main>
  );
}

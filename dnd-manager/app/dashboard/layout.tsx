"use client";

import Navbar from "@/components/layout/navbar";
import { useSidebar } from "@/components/providers/sidebar-provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, sidebarWidth } = useSidebar();
  
  return (
    <div className="min-h-screen bg-[#0a0a1f] flex flex-col sm:flex-row">
      <Navbar />
      <main 
        className="flex-1 overflow-x-hidden overflow-y-auto px-2 py-4 sm:px-4 sm:py-6 md:p-6 md:pt-2 relative z-30"
        style={{
          marginLeft: isCollapsed ? '0px' : `${sidebarWidth}px`,
          marginTop: '4rem' // Account for topbar height
        }}
      >
        {children}
      </main>
    </div>
  );
}

"use client";

import Navbar from "@/components/layout/navbar";
import { useSidebar } from "@/components/providers/sidebar-provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="min-h-screen bg-[#0a0a1f] flex flex-col md:flex-row">
      <Navbar />
      <main
        className={`flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:p-6 md:pt-2 ${isCollapsed ? 'md:ml-0' : 'md:ml-[200px]'}`}
        style={{ 
          overflowAnchor: 'none',
          scrollBehavior: 'smooth'
        }}
      >
        {children}
      </main>
    </div>
  );
}

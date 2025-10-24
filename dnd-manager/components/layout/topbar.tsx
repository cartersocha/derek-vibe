"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", symbol: "🏠" },
  { href: "/campaigns", label: "Campaigns", symbol: "⚔" },
  { href: "/sessions", label: "Sessions", symbol: "✎" },
  { href: "/characters", label: "Characters", symbol: "♞" },
  { href: "/organizations", label: "Groups", symbol: "⚙" },
];

const CREATE_OPTIONS = [
  { href: "/campaigns/new", label: "New Campaign" },
  { href: "/sessions/new", label: "New Session" },
  { href: "/characters/new", label: "New Character" },
  { href: "/organizations/new", label: "New Group" },
];

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const { isCollapsed, toggleSidebar, sidebarWidth } = useSidebar();
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const supabase = createClient();
    
    try {
      // Search across all entities
      const [campaigns, sessions, characters, organizations] = await Promise.all([
        supabase
          .from('campaigns')
          .select('id, name, description')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('sessions')
          .select('id, name, description')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('characters')
          .select('id, name, description')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('organizations')
          .select('id, name, description')
          .ilike('name', `%${query}%`)
          .limit(5)
      ]);

      const results = [
        ...campaigns.data?.map(item => ({ ...item, type: 'campaign', url: `/campaigns/${item.id}` })) || [],
        ...sessions.data?.map(item => ({ ...item, type: 'session', url: `/sessions/${item.id}` })) || [],
        ...characters.data?.map(item => ({ ...item, type: 'character', url: `/characters/${item.id}` })) || [],
        ...organizations.data?.map(item => ({ ...item, type: 'organization', url: `/organizations/${item.id}` })) || []
      ];

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleResultClick = (url: string) => {
    router.push(url);
    setSearchQuery("");
    setShowResults(false);
  };

  // Handle click outside to close create menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCreateClick = () => {
    setShowCreateMenu(!showCreateMenu);
  };

  const handleCreateOptionClick = (href: string) => {
    router.push(href);
    setShowCreateMenu(false);
  };

  return (
    <header 
      className="fixed top-0 z-[60] bg-[#0a0a1f] backdrop-blur-sm"
      style={{
        width: '100vw', // Always full viewport width
        height: '4rem', // Fixed navbar height
        left: 0,
        right: 0,
        top: 0
      }}
    >
      <div className="flex items-center justify-between px-2 py-2 sm:px-4 lg:px-6">
        {/* Logo/Brand with Hamburger - always positioned on far left */}
        <div className="flex items-center gap-3" style={{ marginLeft: '0px' }}>
          {/* Hamburger Button - consistent left positioning in both states */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex items-center justify-center rounded text-[#00ffff] hover:text-[#ff00ff] transition-colors touch-target w-14 h-12 p-2"
            style={{
              marginLeft: '-24px' // Always use the same left positioning
            }}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Website Title - always next to hamburger like YouTube */}
          <Link
            href="/dashboard"
            className="retro-title text-base sm:text-lg md:text-xl font-bold text-[#00ffff] hover:text-[#ff00ff] transition-colors duration-200"
            style={{ "--retro-letter-spacing": "0.2em" } as React.CSSProperties}
          >
            RAT PALACE
          </Link>
        </div>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full px-4 py-2 pl-10 text-sm bg-[#1a1a3e] border border-[#00ffff] border-opacity-30 rounded text-[#00ffff] focus:outline-none focus:border-[#ff00ff] focus:border-opacity-60 transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#00ffff] opacity-60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a3e] border border-[#00ffff] border-opacity-30 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => {
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'campaign': return 'text-orange-400';
                      case 'session': return 'text-blue-400';
                      case 'character': return 'text-green-400';
                      case 'organization': return 'text-purple-400';
                      default: return 'text-[#ff00ff]';
                    }
                  };

                  const getTypeBgColor = (type: string) => {
                    switch (type) {
                      case 'campaign': return 'bg-orange-400/10 border-orange-400/20';
                      case 'session': return 'bg-blue-400/10 border-blue-400/20';
                      case 'character': return 'bg-green-400/10 border-green-400/20';
                      case 'organization': return 'bg-purple-400/10 border-purple-400/20';
                      default: return 'bg-[#ff00ff]/10 border-[#ff00ff]/20';
                    }
                  };

                  return (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result.url)}
                      className={`w-full px-4 py-3 text-left hover:bg-[#2a2a4e] transition-colors border-b border-[#00ffff] border-opacity-10 last:border-b-0 ${getTypeBgColor(result.type)}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-24 flex-shrink-0">
                          <span className={`text-xs font-bold ${getTypeColor(result.type)} uppercase tracking-wider`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#00ffff] truncate">
                            {result.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create Button and Mobile Menu Button */}
        <div className="flex items-center space-x-2">
          {/* Create Button */}
          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={handleCreateClick}
              aria-expanded={showCreateMenu}
              aria-label="Create new item"
              className="inline-flex items-center justify-center rounded border border-[#ff00ff] border-opacity-40 p-1.5 text-[#ff00ff] hover:border-[#ff00ff] hover:bg-[#ff00ff]/10 transition-colors min-h-[32px] min-w-[32px] bg-[#ff00ff]/5"
            >
              <span className="sr-only">Create new item</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {/* Create Menu Dropdown */}
            {showCreateMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#1a1a3e] border border-[#ff00ff] border-opacity-30 rounded shadow-lg z-50 min-w-[160px] max-w-[200px]">
                <div className="py-1">
                  {CREATE_OPTIONS.map((option) => (
                    <button
                      key={option.href}
                      onClick={() => handleCreateOptionClick(option.href)}
                      className="w-full px-4 py-2 text-left hover:bg-[#2a2a4e] transition-colors text-sm whitespace-nowrap"
                    >
                      <span className="text-[#00ffff] font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className="md:hidden inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-40 p-1.5 text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors min-h-[36px] min-w-[36px]"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden bg-[#0a0a1f] shadow-lg shadow-[#00ffff]/10",
          isMobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="px-3 py-1.5 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block w-full px-3 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors duration-200 min-h-[36px] flex items-center",
                  isActive
                    ? "bg-[#ff00ff] text-black shadow-lg shadow-[#ff00ff]/50"
                    : "text-[#00ffff] hover:bg-[#1a1a3e] hover:text-[#ff00ff]"
                )}
              >
                <span className="mr-3 text-lg">{link.symbol}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

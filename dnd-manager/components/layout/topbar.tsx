"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { createClient } from "@/lib/supabase/client";
import HamburgerIcon from "@/components/ui/hamburger-icon";
import PlusIcon from "@/components/ui/plus-icon";
import SearchIcon from "@/components/ui/search-icon";
import CloseIcon from "@/components/ui/close-icon";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "/icons/dashboards-24.png", symbol: "🏠" },
  { href: "/campaigns", label: "Campaigns", icon: "/icons/campaigns-24.png", symbol: "⚔" },
  { href: "/sessions", label: "Sessions", icon: "/icons/sessions-24.png", symbol: "✎" },
  { href: "/characters", label: "Characters", icon: "/icons/characters-24.png", symbol: "♞" },
  { href: "/organizations", label: "Groups", icon: "/icons/groups-24.png", symbol: "⚙" },
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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const { isCollapsed, toggleSidebar, sidebarWidth } = useSidebar();
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Search history management
  const addToSearchHistory = (query: string) => {
    if (query.trim() === "") return;
    
    console.log('Adding to search history:', query);
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      const newHistory = [query, ...filtered].slice(0, 10);
      console.log('New search history:', newHistory);
      localStorage.setItem('search-history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const loadSearchHistory = () => {
    try {
      const stored = localStorage.getItem('search-history');
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
  };

  // Load search history on component mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

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
          .select('id, name, notes')
          .or(`name.ilike.%${query}%,notes.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('characters')
          .select('id, name, backstory, race, class')
          .or(`name.ilike.%${query}%,backstory.ilike.%${query}%,race.ilike.%${query}%,class.ilike.%${query}%`)
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

      console.log('Desktop search query:', query);
      console.log('Desktop search results:', results);
      console.log('Desktop sessions data:', sessions.data);
      console.log('Desktop characters data:', characters.data);
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

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim();
      console.log('Enter key pressed, query:', query);
      if (query) {
        console.log('Adding to search history:', query);
        addToSearchHistory(query);
        performSearch(query);
      }
    }
  };

  const handleResultClick = (url: string, resultName?: string) => {
    // Save the full name/title of the clicked item to history
    if (resultName && resultName.trim()) {
      addToSearchHistory(resultName.trim());
    } else if (searchQuery.trim()) {
      // Fallback to search query if no result name provided
      addToSearchHistory(searchQuery.trim());
    }
    
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

  // Clear search when navigating to new page
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, [pathname]);

  const handleCreateClick = () => {
    setShowCreateMenu(!showCreateMenu);
  };

  const handleCreateOptionClick = (href: string) => {
    router.push(href);
    setShowCreateMenu(false);
  };

  return (
    <header 
      className="fixed top-0 z-[60] bg-[var(--bg-dark)] backdrop-blur-sm"
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
          {/* Desktop Hamburger Button - hidden on mobile, visible on desktop */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:inline-flex items-center justify-center rounded text-[var(--cyber-cyan)] hover-cyber transition-colors touch-target w-14 h-12 p-2"
            style={{
              marginLeft: '-24px', // Always use the same left positioning
              alignSelf: 'center', // Center vertically with the text
              transform: 'translateY(-2px)' // Move up slightly
            }}
          >
            <HamburgerIcon size="md" className="text-[var(--cyber-cyan)]" />
          </button>
          
          {/* Mobile Hamburger Button - only visible on mobile, positioned to the left of RAT PALACE */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className="md:hidden inline-flex items-center justify-center rounded border border-[var(--cyber-cyan)] border-opacity-40 p-1.5 text-[var(--cyber-cyan)] hover-cyber transition-colors min-h-[36px] min-w-[36px]"
          >
            <span className="sr-only">Toggle navigation</span>
            <HamburgerIcon 
              isOpen={isMobileMenuOpen} 
              size="sm" 
              className="text-[var(--cyber-cyan)]" 
            />
          </button>
          
          {/* Website Title - always next to hamburger like YouTube */}
          <Link
            href="/dashboard"
            className="retro-title glitch-subtle text-sm sm:text-base md:text-lg font-bold text-[var(--cyber-cyan)] hover-cyber transition-colors duration-200"
            data-text="RAT PALACE"
          >
            RAT PALACE
          </Link>
        </div>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex items-center justify-center flex-1" style={{ marginLeft: '-2rem' }}>
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowResults(true);
                } else {
                  setShowResults(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowResults(false), 300)}
              className="w-full px-4 py-2 pl-10 text-sm bg-[var(--bg-card)] border border-[var(--cyber-cyan)] border-opacity-30 rounded text-[var(--cyber-cyan)] focus:outline-none focus:border-[var(--cyber-magenta)] focus:border-opacity-60 transition-colors"
              aria-label="Search campaigns, characters, and sessions"
            />
            <SearchIcon size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-[var(--cyber-cyan)] opacity-60" />
            
            {/* Clear Search Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--cyber-cyan)] opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Clear search"
              >
                <CloseIcon size="sm" className="bg-[var(--cyber-cyan)] opacity-60 hover:opacity-100" />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {showResults && (
              <>
                {/* Search History - show when no query or no results */}
                {(!searchQuery.trim() || searchResults.length === 0) && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--cyber-cyan)] border-opacity-30 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-[var(--cyber-cyan)] border-opacity-20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Recent Searches</span>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-[var(--cyber-cyan)] opacity-60 hover:opacity-100 transition-opacity"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {searchHistory.map((historyItem, index) => {
                      // Try to find a matching result to get the type
                      const matchingResult = searchResults.find(result => 
                        result.name.toLowerCase().includes(historyItem.toLowerCase()) ||
                        historyItem.toLowerCase().includes(result.name.toLowerCase())
                      );
                      
                      const getTypeColor = (type: string) => {
                        switch (type) {
                          case 'campaign': return 'text-[var(--orange-400)]';
                          case 'session': return 'text-[var(--blue-400)]';
                          case 'character': return 'text-[var(--green-400)]';
                          case 'organization': return 'text-[var(--purple-400)]';
                          default: return 'text-[var(--cyber-magenta)]';
                        }
                      };

                      const getTypeBgColor = (type: string) => {
                        switch (type) {
                          case 'campaign': return 'bg-[var(--orange-400)]/10 border-[var(--orange-400)]/20';
                          case 'session': return 'bg-[var(--blue-400)]/10 border-[var(--blue-400)]/20';
                          case 'character': return 'bg-[var(--green-400)]/10 border-[var(--green-400)]/20';
                          case 'organization': return 'bg-[var(--purple-400)]/10 border-[var(--purple-400)]/20';
                          default: return 'bg-[var(--cyber-magenta)]/10 border-[var(--cyber-magenta)]/20';
                        }
                      };

                      const resultType = matchingResult?.type || 'search';
                      const typeColor = getTypeColor(resultType);
                      const typeBgColor = getTypeBgColor(resultType);

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(historyItem);
                            addToSearchHistory(historyItem);
                            performSearch(historyItem);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-[var(--cyber-cyan)]/10 hover:border-[var(--cyber-cyan)]/30 transition-colors border-b border-[var(--cyber-cyan)] border-opacity-10 last:border-b-0 ${typeBgColor}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-24 flex-shrink-0">
                              <span className={`text-xs font-bold ${typeColor} uppercase tracking-wider`}>
                                {resultType}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[var(--cyber-cyan)] truncate">
                                {historyItem}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Search Results */}
                {searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--cyber-cyan)] border-opacity-30 rounded shadow-lg z-50 max-h-64 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {searchResults.map((result, index) => {
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'campaign': return 'text-[var(--orange-400)]';
                      case 'session': return 'text-[var(--blue-400)]';
                      case 'character': return 'text-[var(--green-400)]';
                      case 'organization': return 'text-[var(--purple-400)]';
                      default: return 'text-[var(--cyber-magenta)]';
                    }
                  };

                  const getTypeBgColor = (type: string) => {
                    switch (type) {
                      case 'campaign': return 'bg-[var(--orange-400)]/10 border-[var(--orange-400)]/20';
                      case 'session': return 'bg-[var(--blue-400)]/10 border-[var(--blue-400)]/20';
                      case 'character': return 'bg-[var(--green-400)]/10 border-[var(--green-400)]/20';
                      case 'organization': return 'bg-[var(--purple-400)]/10 border-[var(--purple-400)]/20';
                      default: return 'bg-[var(--cyber-magenta)]/10 border-[var(--cyber-magenta)]/20';
                    }
                  };

                  return (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result.url, result.name)}
                      className={`w-full px-4 py-3 text-left hover:bg-[var(--cyber-cyan)]/10 hover:border-[var(--cyber-cyan)]/30 transition-colors border-b border-[var(--cyber-cyan)] border-opacity-10 last:border-b-0 ${getTypeBgColor(result.type)}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-24 flex-shrink-0">
                          <span className={`text-xs font-bold ${getTypeColor(result.type)} uppercase tracking-wider`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--cyber-cyan)] truncate">
                            {result.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create Button */}
        <div className="flex items-center space-x-2">
          {/* Create Button */}
          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={handleCreateClick}
              aria-expanded={showCreateMenu}
              aria-label="Create new item"
              className="inline-flex items-center justify-center rounded border border-[var(--cyber-magenta)] p-1.5 text-black hover:bg-[var(--cyber-magenta)]/80 transition-colors min-h-[32px] min-w-[32px] bg-[var(--cyber-magenta)]"
            >
              <span className="sr-only">Create new item</span>
              <PlusIcon size="sm" className="bg-black" />
            </button>

            {/* Create Menu Dropdown */}
            {showCreateMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--cyber-magenta)] border-opacity-30 rounded shadow-lg z-50 min-w-[160px] max-w-[200px]">
                <div className="py-1">
                  {CREATE_OPTIONS.map((option) => (
                    <button
                      key={option.href}
                      onClick={() => handleCreateOptionClick(option.href)}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--cyber-magenta)]/20 hover:text-[var(--cyber-magenta)] transition-colors text-sm whitespace-nowrap group"
                    >
                      <span className="text-[var(--cyber-cyan)] group-hover:text-[var(--cyber-magenta)] font-medium transition-colors">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden bg-[var(--bg-dark)] shadow-lg shadow-[var(--cyber-cyan)]/10",
          isMobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="px-3 py-1.5 space-y-1">
          {/* Search Bar - first item in mobile menu */}
          <div className="px-3 py-2 border-b border-[var(--cyber-cyan)] border-opacity-20">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                aria-label="Search campaigns, characters, and sessions"
                className="w-full px-3 py-2 pl-10 text-sm bg-[var(--bg-card)] border border-[var(--cyber-cyan)] border-opacity-30 rounded text-[var(--cyber-cyan)] focus:outline-none focus:border-[var(--cyber-magenta)] focus:border-opacity-60 transition-colors"
              />
              <SearchIcon size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-[var(--cyber-cyan)] opacity-60" />
              
              {/* Clear Search Button - Mobile */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--cyber-cyan)] opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Clear search"
                >
                  <CloseIcon size="sm" className="bg-[var(--cyber-cyan)] opacity-60 hover:opacity-100" />
                </button>
              )}
            </div>
            
            {/* Mobile Search Results */}
            {showResults && (
              <>
                {/* Mobile Search History - show when no query or no results */}
                {(!searchQuery.trim() || searchResults.length === 0) && searchHistory.length > 0 && (
                  <div className="mt-2 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 border-b border-[var(--cyber-cyan)] border-opacity-20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Recent Searches</span>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-[var(--cyber-cyan)] opacity-60 hover:opacity-100 transition-opacity"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {searchHistory.map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(historyItem);
                          addToSearchHistory(historyItem);
                          performSearch(historyItem);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--cyber-cyan)]/10 transition-colors border-b border-[var(--cyber-cyan)] border-opacity-10 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-[var(--cyber-cyan)] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-[var(--cyber-cyan)] break-words leading-tight">{historyItem}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Mobile Search Results */}
                {searchResults.length > 0 && (
              <div className="mt-2 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => {
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'campaign': return 'text-[var(--orange-400)]';
                      case 'session': return 'text-[var(--blue-400)]';
                      case 'character': return 'text-[var(--green-400)]';
                      case 'organization': return 'text-[var(--purple-400)]';
                      default: return 'text-[var(--cyber-magenta)]';
                    }
                  };
                  const getTypeBgColor = (type: string) => {
                    switch (type) {
                      case 'campaign': return 'bg-[var(--orange-400)]/10 border-[var(--orange-400)]/20';
                      case 'session': return 'bg-[var(--blue-400)]/10 border-[var(--blue-400)]/20';
                      case 'character': return 'bg-[var(--green-400)]/10 border-[var(--green-400)]/20';
                      case 'organization': return 'bg-[var(--purple-400)]/10 border-[var(--purple-400)]/20';
                      default: return 'bg-[var(--cyber-magenta)]/10 border-[var(--cyber-magenta)]/20';
                    }
                  };
                  return (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result.url, result.name)}
                      className={`w-full px-3 py-2 text-left hover:bg-[var(--cyber-cyan)]/10 transition-colors border-b border-[var(--cyber-cyan)] border-opacity-10 last:border-b-0 ${getTypeBgColor(result.type)}`}
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${getTypeColor(result.type)} uppercase tracking-wider`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-[var(--cyber-cyan)] break-words leading-tight">
                          {result.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
                )}
              </>
            )}
          </div>
          
          {/* Navigation Links */}
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
                    ? "bg-[var(--cyber-magenta)] text-black shadow-lg shadow-[var(--cyber-magenta)]/50"
                    : "text-[var(--cyber-cyan)] hover:bg-[var(--bg-card)] hover-cyber"
                )}
              >
                <span className="mr-3 text-lg">
                  {link.icon ? (
                    <div 
                      className="w-6 h-6 bg-[var(--cyber-cyan)]"
                      style={{
                        maskImage: `url(${link.icon})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskImage: `url(${link.icon})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center'
                      }}
                    />
                  ) : (
                    link.symbol
                  )}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

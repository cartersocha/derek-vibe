"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";

const NAV_LINKS = [
  { href: "/campaigns", label: "Campaigns", icon: "/icons/campaigns-24.png", symbol: "⚔" },
  { href: "/sessions", label: "Sessions", icon: "/icons/sessions-24.png", symbol: "✎" },
  { href: "/characters", label: "Characters", icon: "/icons/characters-24.png", symbol: "♞" },
  { href: "/organizations", label: "Groups", icon: "/icons/groups-24.png", symbol: "⚙" },
];

const DEFAULT_WIDTH = 200;
const COLLAPSED_WIDTH = 64; // Reduced to decrease margin between content and sidebar
const COLLAPSE_THRESHOLD = 120;
const INITIAL_MAX_WIDTH = 220;
const SIDEBAR_WIDTH_STORAGE_KEY = "sidebar-width";
const SIDEBAR_MODE_STORAGE_KEY = "sidebar-width-mode";
const SIDEBAR_MODE_CUSTOM = "custom";
const SIDEBAR_MODE_AUTO = "auto";

const clampWithMax = (value: number, maxWidth: number) => {
  return Math.min(Math.max(value, COLLAPSED_WIDTH), maxWidth);
};

export default function Navbar() {
  const pathname = usePathname();
  const { isCollapsed, setSidebarWidth, toggleSidebar } = useSidebar();
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const [maxWidth, setMaxWidth] = useState(INITIAL_MAX_WIDTH);
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const collapsedStored = window.localStorage.getItem("sidebar-collapsed");
      const isCollapsedStored = collapsedStored ? JSON.parse(collapsedStored) : true;
      const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      const parsed = storedWidth ? Number(storedWidth) : DEFAULT_WIDTH;
      const initialExpanded = Number.isFinite(parsed) ? parsed : DEFAULT_WIDTH;
      const clampedExpanded = Math.min(Math.max(initialExpanded, COLLAPSED_WIDTH), INITIAL_MAX_WIDTH);
      return isCollapsedStored ? COLLAPSED_WIDTH : clampedExpanded;
    }
    return COLLAPSED_WIDTH;
  });
  // Drag-related state removed
const widthFrameRef = useRef<number | null>(null);
const hasCustomWidthRef = useRef(false);
const measuredWidthRef = useRef(Math.max(DEFAULT_WIDTH, COLLAPSED_WIDTH));
const lastExpandedWidthRef = useRef(DEFAULT_WIDTH);
const hasAppliedAutoWidthRef = useRef(false);

  const clampWidth = useCallback((value: number) => clampWithMax(value, maxWidth), [maxWidth]);

  const updateWidth = useCallback(
    (value: number) => {
      // Don't update width if sidebar is collapsed
      if (isCollapsed) {
        return;
      }
      
      const clamped = clampWidth(value);

      if (typeof window === "undefined") {
        setWidth(clamped);
        return;
      }

      if (widthFrameRef.current !== null) {
        cancelAnimationFrame(widthFrameRef.current);
      }

      widthFrameRef.current = window.requestAnimationFrame(() => {
        widthFrameRef.current = null;
        setWidth(clamped);
      });
    },
    [clampWidth, isCollapsed]
  );

  // Use provider's isCollapsed as the primary source, but also consider width
  const shouldShowIconsOnly = isCollapsed || width <= COLLAPSE_THRESHOLD;

  // Drag functionality removed - only hamburger button toggle is used

  const toggleCollapse = useCallback(() => {
    // Use the provider's toggle function instead of managing width directly
    toggleSidebar();
  }, [toggleSidebar]);

  // Handle hamburger menu collapse - sync with provider state
  useEffect(() => {
    if (isCollapsed) {
      // When hamburger menu collapses, set to collapsed width (icon tabs mode)
      setWidth(COLLAPSED_WIDTH);
    } else {
      // When hamburger menu expands, restore to last expanded width or default
      const desired = hasCustomWidthRef.current ? lastExpandedWidthRef.current : DEFAULT_WIDTH;
      const clampedDesired = Math.min(Math.max(desired, COLLAPSED_WIDTH), maxWidth);
      setWidth(clampedDesired);
    }
  }, [isCollapsed, maxWidth]);

  const measureSidebarWidth = useCallback(() => {
    const measureNode = measurementRef.current;
    if (!measureNode) return;
    
    // Don't remeasure if sidebar is intentionally collapsed
    if (isCollapsed) {
      return;
    }
    
    const measured = Math.ceil(measureNode.scrollWidth + 16);
    const limitedMeasured = Math.min(measured, INITIAL_MAX_WIDTH);
    const clampedMeasured = Math.max(limitedMeasured, DEFAULT_WIDTH);
    measuredWidthRef.current = clampedMeasured;
    const nextMax = Math.min(Math.max(clampedMeasured, DEFAULT_WIDTH), INITIAL_MAX_WIDTH);
    setMaxWidth(nextMax);
    setWidth((prev) => {
      if (prev <= COLLAPSE_THRESHOLD) {
        return prev;
      }
      if (hasCustomWidthRef.current) {
        const clampedPrev = Math.min(Math.max(prev, COLLAPSED_WIDTH), nextMax);
        return clampedPrev;
      }
      if (!hasAppliedAutoWidthRef.current) {
        hasAppliedAutoWidthRef.current = true;
        const autoWidth = Math.min(Math.max(DEFAULT_WIDTH, COLLAPSED_WIDTH), nextMax);
        measuredWidthRef.current = autoWidth;
        lastExpandedWidthRef.current = autoWidth;
        return autoWidth;
      }
      return prev;
    });
  }, [isCollapsed]);

  // Separate effect to handle measurement after expansion
  useEffect(() => {
    if (!isCollapsed && width > COLLAPSE_THRESHOLD) {
      // Trigger a measurement after expansion to ensure proper sizing
      const timeoutId = setTimeout(() => {
        measureSidebarWidth();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isCollapsed, width, measureSidebarWidth]);


  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMode = window.localStorage.getItem(SIDEBAR_MODE_STORAGE_KEY);
    hasCustomWidthRef.current = storedMode === SIDEBAR_MODE_CUSTOM;

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (storedWidth) {
      const parsed = Number(storedWidth);
      if (!Number.isNaN(parsed)) {
        // Store the width for later use, but don't apply it if collapsed
        lastExpandedWidthRef.current = parsed;
        if (!isCollapsed) {
          setWidth((prev) => clampWidth(Number.isFinite(parsed) ? parsed : prev));
        }
      }
    }
  }, [clampWidth, isCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Only save expanded widths to localStorage
    if (!isCollapsed && width > COLLAPSE_THRESHOLD) {
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    }
    
    window.localStorage.setItem(
      SIDEBAR_MODE_STORAGE_KEY,
      hasCustomWidthRef.current ? SIDEBAR_MODE_CUSTOM : SIDEBAR_MODE_AUTO
    );
  }, [width, isCollapsed]);

  useEffect(() => {
    if (width > COLLAPSE_THRESHOLD) {
      lastExpandedWidthRef.current = width;
    }
  }, [width]);

  // Sync width changes with the provider
  useEffect(() => {
    setSidebarWidth(width);
  }, [width, setSidebarWidth]);

  // Immediate sync on mount to ensure provider has correct initial width
  useEffect(() => {
    setSidebarWidth(width);
  }, []); // Empty dependency array - runs once on mount

  // Cleanup effect removed - no more drag event listeners

  useLayoutEffect(() => {
    // Only measure if sidebar is not collapsed
    if (!isCollapsed) {
      measureSidebarWidth();
    }
  }, [measureSidebarWidth, isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      // Don't remeasure if sidebar is collapsed
      if (!isCollapsed) {
        window.requestAnimationFrame(measureSidebarWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureSidebarWidth, isCollapsed]);

  const sidebarStyles = {
    width: `${Math.round(width)}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "relative w-full hidden md:block md:fixed md:top-16 md:left-0 md:h-[calc(100vh-4rem)] md:flex-shrink-0 md:bg-[var(--bg-dark)] md:z-50",
        isCollapsed ? "md:transition-none" : "transition-[width] duration-300 ease-in-out"
      )}
      style={sidebarStyles}
    >

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden sm:flex sm:flex-1 sm:flex-col sm:overflow-hidden transition-all duration-300 ease-in-out",
          shouldShowIconsOnly && "items-center"
        )}
        role="presentation"
      >
        {/* Sidebar Header - hamburger now in topbar */}

        <div
          className={cn(
            "flex-1 py-1", // Remove excessive top padding
            shouldShowIconsOnly
              ? "px-4 overflow-hidden space-y-0 flex flex-col items-center" // No spacing, centered icons, no overflow
              : "px-4 overflow-hidden space-y-1"
          )}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={shouldShowIconsOnly ? link.label : undefined}
                aria-label={shouldShowIconsOnly ? link.label : undefined}
                className={cn(
                  "group relative flex items-center rounded transition-all duration-200 uppercase tracking-wider font-bold overflow-hidden h-12 p-2 touch-target",
                  shouldShowIconsOnly
                    ? "justify-center items-center w-14 text-sm" // Icons: narrow width, centered, smaller text
                    : "justify-start w-full text-xs", // Text: full width, left-aligned, smaller text
                  isActive
                    ? "bg-[var(--cyber-magenta)] text-white shadow-lg shadow-[var(--cyber-magenta)]/50"
                    : "text-[var(--cyber-cyan)] hover:bg-[var(--bg-card)] hover-cyber"
                )}
                style={{
                  fontFamily: 'var(--font-press-start), var(--font-geist-mono), monospace',
                  WebkitFontSmoothing: 'none',
                  fontSmoothing: 'never'
                } as React.CSSProperties}
              >
                {shouldShowIconsOnly ? (
                  // Collapsed state: show icon or symbol
                  link.icon ? (
                    <div 
                      className="w-6 h-6 bg-[var(--cyber-cyan)] drop-shadow-[0_0_6px_rgba(0,255,255,0.45)]"
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
                    <span
                      aria-hidden
                      className="flex items-center justify-center text-3xl leading-none text-[var(--cyber-cyan)] drop-shadow-[0_0_6px_rgba(0,255,255,0.45)] -mt-2.5"
                    >
                      {link.symbol}
                    </span>
                  )
                ) : (
                  // Expanded state: only text (no icons)
                  <span>{link.label}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {shouldShowIconsOnly && (
                  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[var(--cyber-cyan)] opacity-0 shadow-lg shadow-[var(--cyber-cyan)]/20 transition-opacity duration-150 group-hover:opacity-100"
                    style={{
                      fontFamily: 'var(--font-press-start), monospace',
                      WebkitFontSmoothing: 'none',
                      fontSmoothing: 'never'
                    } as React.CSSProperties}>
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </aside>
      {/* Resize handle removed - only hamburger button toggle is used */}

      {/* Hidden measurement node ensures max width tracks the farthest text */}
      <div
        ref={measurementRef}
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] hidden opacity-0 md:block"
      >
        <div className="flex w-max flex-col border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-dark)]">
          <div className="px-4 py-6">
            <div className="space-y-2">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="px-5 py-3 text-lg font-bold uppercase tracking-wider text-[var(--cyber-cyan)]"
                >
                  {link.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--cyber-cyan)] border-opacity-10 px-4 py-4">
            <span className="inline-flex gap-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]">
              Collapse
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

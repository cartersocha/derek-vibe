"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/campaigns", label: "Campaigns", symbol: "⚔" },
  { href: "/sessions", label: "Sessions", symbol: "✎" },
  { href: "/characters", label: "Characters", symbol: "♞" },
  { href: "/organizations", label: "Groups", symbol: "⚙" },
];

const DEFAULT_WIDTH = 200;
const COLLAPSED_WIDTH = 72;
const COLLAPSE_THRESHOLD = 120;
const INITIAL_MAX_WIDTH = 288;
const SIDEBAR_WIDTH_STORAGE_KEY = "sidebar-width";
const SIDEBAR_MODE_STORAGE_KEY = "sidebar-width-mode";
const SIDEBAR_MODE_CUSTOM = "custom";
const SIDEBAR_MODE_AUTO = "auto";

const clampWithMax = (value: number, maxWidth: number) => {
  return Math.min(Math.max(value, COLLAPSED_WIDTH), maxWidth);
};

export default function Navbar() {
  const pathname = usePathname();
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const [maxWidth, setMaxWidth] = useState(INITIAL_MAX_WIDTH);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
const dragState = useRef({ startX: 0, startWidth: DEFAULT_WIDTH });
const isDraggingRef = useRef(false);
const widthFrameRef = useRef<number | null>(null);
const hasCustomWidthRef = useRef(false);
const measuredWidthRef = useRef(Math.max(DEFAULT_WIDTH, COLLAPSED_WIDTH));
const lastExpandedWidthRef = useRef(DEFAULT_WIDTH);
const hasAppliedAutoWidthRef = useRef(false);

  const clampWidth = useCallback((value: number) => clampWithMax(value, maxWidth), [maxWidth]);

  const updateWidth = useCallback(
    (value: number) => {
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
    [clampWidth]
  );

  const isCollapsed = width <= COLLAPSE_THRESHOLD;

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const delta = event.clientX - dragState.current.startX;
      const nextWidth = dragState.current.startWidth + delta;
      updateWidth(nextWidth);
    },
    [updateWidth]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    if (widthFrameRef.current !== null) {
      cancelAnimationFrame(widthFrameRef.current);
      widthFrameRef.current = null;
    }
    setWidth((prev) => (prev <= COLLAPSE_THRESHOLD ? COLLAPSED_WIDTH : clampWidth(prev)));
  }, [clampWidth, handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (typeof window === "undefined" || window.matchMedia("(max-width: 767px)").matches) {
        return;
      }
      if (event.button !== 0) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      dragState.current = { startX: event.clientX, startWidth: width };
      hasCustomWidthRef.current = true;
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      event.preventDefault();
    },
    [handlePointerMove, handlePointerUp, width]
  );

  const toggleCollapse = useCallback(() => {
    setWidth((prev) => {
      if (prev <= COLLAPSE_THRESHOLD) {
        const desired = hasCustomWidthRef.current ? lastExpandedWidthRef.current : measuredWidthRef.current;
        const clampedDesired = Math.min(Math.max(desired, COLLAPSED_WIDTH), maxWidth);
        return clampedDesired;
      }
      lastExpandedWidthRef.current = prev;
      return COLLAPSED_WIDTH;
    });
  }, [maxWidth]);

  const measureSidebarWidth = useCallback(() => {
    const measureNode = measurementRef.current;
    if (!measureNode) return;
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
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMode = window.localStorage.getItem(SIDEBAR_MODE_STORAGE_KEY);
    hasCustomWidthRef.current = storedMode === SIDEBAR_MODE_CUSTOM;

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (storedWidth) {
      const parsed = Number(storedWidth);
      if (!Number.isNaN(parsed)) {
        setWidth((prev) => clampWidth(Number.isFinite(parsed) ? parsed : prev));
      }
    }
  }, [clampWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    window.localStorage.setItem(
      SIDEBAR_MODE_STORAGE_KEY,
      hasCustomWidthRef.current ? SIDEBAR_MODE_CUSTOM : SIDEBAR_MODE_AUTO
    );
  }, [width]);

  useEffect(() => {
    if (width > COLLAPSE_THRESHOLD) {
      lastExpandedWidthRef.current = width;
    }
  }, [width]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (widthFrameRef.current !== null) {
        cancelAnimationFrame(widthFrameRef.current);
        widthFrameRef.current = null;
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  useLayoutEffect(() => {
    measureSidebarWidth();
  }, [measureSidebarWidth]);

  useEffect(() => {
    const handleResize = () => {
      window.requestAnimationFrame(measureSidebarWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureSidebarWidth]);

  const sidebarStyles = {
    "--sidebar-width": `${Math.round(width)}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "relative w-full md:sticky md:top-0 md:self-start md:h-screen md:flex md:flex-col md:flex-shrink-0 md:bg-[#0f0f23] md:border-r md:border-[#00ffff] md:border-opacity-20 md:[width:var(--sidebar-width)] md:[max-width:calc(max-content+1.5rem)]",
        isDragging ? "md:transition-none" : "transition-[width] duration-300 ease-in-out"
      )}
      style={sidebarStyles}
    >
      {/* Mobile header */}
      <div className="md:hidden border-b border-[#00ffff] border-opacity-20 bg-[#0f0f23] sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 sm:py-4">
          <Link
            href="/dashboard"
            className="retro-title text-lg sm:text-xl font-bold text-[#00ffff] break-words"
            style={{ "--retro-letter-spacing": "0.24em" } as CSSProperties}
          >
            RAT PALACE
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className="inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-40 p-2 text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors min-h-[44px] min-w-[44px]"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              className="h-5 w-5"
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
        </div>

        <div
          id="mobile-nav"
          className={cn(
            "px-4 pb-4 space-y-2 bg-[#0f0f23] shadow-lg shadow-[#00ffff]/10",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
                  <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block w-full px-4 py-3 text-sm font-bold uppercase tracking-wider rounded transition-colors duration-200 min-h-[44px] flex items-center",
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

      {/* Desktop sidebar */}
      <aside
        onDoubleClick={toggleCollapse}
        className={cn(
          "hidden md:flex md:flex-1 md:flex-col md:overflow-hidden",
          isCollapsed && "items-center"
        )}
        role="presentation"
      >
        <div
          className={cn(
            "w-full border-b border-[#00ffff] border-opacity-10",
            isCollapsed ? "p-4" : "p-6"
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            <Link
              href="/dashboard"
              className={cn(
                "retro-title font-bold text-[#00ffff] leading-tight",
                isCollapsed && "text-center"
              )}
              style={
                {
                  "--retro-letter-spacing": isCollapsed ? "0.14em" : "0.22em",
                } as CSSProperties
              }
            >
              {isCollapsed ? (
                <>
                  <span
                    aria-hidden
                    className="text-2xl leading-none tracking-[0.14em] text-[#00ffff] drop-shadow-[0_0_10px_rgba(0,255,255,0.45)]"
                  >
                    R
                  </span>
                  <span className="sr-only">Rat Palace</span>
                </>
              ) : (
                <>
                  <span className="block text-xl leading-tight">RAT</span>
                  <span className="block text-xl leading-tight">PALACE</span>
                </>
              )}
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "flex-1 py-6 space-y-2",
            isCollapsed
              ? "px-2 overflow-y-visible"
              : "px-4 overflow-y-auto"
          )}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.label : undefined}
                aria-label={isCollapsed ? link.label : undefined}
                className={cn(
                  "group relative flex items-center rounded transition-all duration-200 uppercase tracking-wider font-bold overflow-hidden",
                  isCollapsed
                    ? "justify-center aspect-square w-14 p-0 text-xs"
                    : "px-5 py-3 text-lg",
                  isActive
                    ? "bg-[#ff00ff] text-black shadow-lg shadow-[#ff00ff]/50"
                    : "text-[#00ffff] hover:bg-[#1a1a3e] hover:text-[#ff00ff]"
                )}
              >
                <span className={cn(isCollapsed && "sr-only")}>{link.label}</span>
                {isCollapsed && (
                  <span
                    aria-hidden
                    className="text-3xl leading-none text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.45)] group-hover:text-[#ff00ff]"
                  >
                    {link.symbol}
                  </span>
                )}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded border border-[#00ffff] border-opacity-40 bg-[#0f0f23] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#00ffff] opacity-0 shadow-lg shadow-[#00ffff]/20 transition-opacity duration-150 group-hover:opacity-100">
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div
          className={cn(
            "hidden md:flex w-full border-t border-[#00ffff] border-opacity-10",
            isCollapsed
              ? "flex-col items-center gap-2 px-2 py-3"
              : "items-center justify-between gap-3 px-4 py-4"
          )}
        >
          <button
            type="button"
            aria-pressed={isCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapse}
            className={cn(
              "inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-30 text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors",
              isCollapsed ? "w-10 h-10" : "gap-2 px-3 py-2 text-xs uppercase tracking-[0.35em]"
            )}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isCollapsed ? (
                <path d="M9 6l6 6-6 6" />
              ) : (
                <path d="M15 6l-6 6 6 6" />
              )}
            </svg>
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onPointerDown={handlePointerDown}
        onDoubleClick={(event) => {
          event.preventDefault();
          toggleCollapse();
        }}
        className={cn(
          "hidden md:block absolute top-0 right-0 h-full w-2 cursor-col-resize select-none",
          isDragging ? "bg-[#ff00ff]/30" : "bg-transparent hover:bg-[#00ffff]/20"
        )}
      >
        <span className="sr-only">Drag to resize navigation</span>
      </div>

      {/* Hidden measurement node ensures max width tracks the farthest text */}
      <div
        ref={measurementRef}
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] hidden opacity-0 md:block"
      >
        <div className="flex w-max flex-col border border-[#00ffff] border-opacity-20 bg-[#0f0f23]">
          <div className="w-full border-b border-[#00ffff] border-opacity-10 p-6">
          <div className="flex items-center justify-between">
            <span
              className="retro-title font-bold text-[#00ffff]"
              style={{ "--retro-letter-spacing": "0.22em" } as CSSProperties}
            >
              <span className="block text-xl leading-tight">RAT</span>
              <span className="block text-xl leading-tight">PALACE</span>
            </span>
          </div>
        </div>
          <div className="px-4 py-6">
            <div className="space-y-2">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="px-5 py-3 text-lg font-bold uppercase tracking-wider text-[#00ffff]"
                >
                  {link.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[#00ffff] border-opacity-10 px-4 py-4">
            <span className="inline-flex gap-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]">
              Collapse
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

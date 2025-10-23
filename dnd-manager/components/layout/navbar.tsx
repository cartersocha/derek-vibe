"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";

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
  const { isCollapsed } = useSidebar();
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const [maxWidth, setMaxWidth] = useState(INITIAL_MAX_WIDTH);
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

  const isCollapsedFromWidth = width <= COLLAPSE_THRESHOLD;

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
        "relative w-full md:fixed md:top-[60px] md:left-0 md:h-[calc(100vh-60px)] md:flex md:flex-col md:flex-shrink-0 md:bg-[#0a0a1f] md:w-[200px] md:z-40",
        isDragging ? "md:transition-none" : "transition-[width] duration-300 ease-in-out",
        isCollapsed && "md:hidden"
      )}
      style={sidebarStyles}
    >

      {/* Desktop sidebar */}
      <aside
        onDoubleClick={toggleCollapse}
        className={cn(
          "hidden md:flex md:flex-1 md:flex-col md:overflow-hidden",
          isCollapsedFromWidth && "items-center"
        )}
        role="presentation"
      >

        <div
          className={cn(
            "flex-1 py-1 space-y-0.5",
            isCollapsedFromWidth
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
                title={isCollapsedFromWidth ? link.label : undefined}
                aria-label={isCollapsedFromWidth ? link.label : undefined}
                className={cn(
                  "group relative flex items-center rounded transition-all duration-200 uppercase tracking-wider font-bold overflow-hidden",
                  isCollapsedFromWidth
                    ? "justify-center aspect-square w-14 p-0 text-xs"
                    : "px-4 py-2 text-xs",
                  isActive
                    ? "bg-[#ff00ff] text-black shadow-lg shadow-[#ff00ff]/50"
                    : "text-[#00ffff] hover:bg-[#1a1a3e] hover:text-[#ff00ff]"
                )}
                style={{
                  fontFamily: 'var(--font-press-start), var(--font-geist-mono), monospace',
                  textShadow: isActive 
                    ? 'none' 
                    : '1px 1px 0 rgba(0, 255, 255, 0.5), -1px -1px 0 rgba(255, 0, 255, 0.5)',
                  WebkitFontSmoothing: 'none',
                  fontSmoothing: 'never'
                } as React.CSSProperties}
              >
                <span className={cn(isCollapsedFromWidth && "sr-only")}>{link.label}</span>
                {isCollapsedFromWidth && (
                  <span
                    aria-hidden
                    className="text-3xl leading-none text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.45)] group-hover:text-[#ff00ff]"
                  >
                    {link.symbol}
                  </span>
                )}
                {isCollapsedFromWidth && (
                  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded border border-[#00ffff] border-opacity-40 bg-[#0f0f23] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#00ffff] opacity-0 shadow-lg shadow-[#00ffff]/20 transition-opacity duration-150 group-hover:opacity-100">
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}
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
        <div className="flex w-max flex-col border border-[#00ffff] border-opacity-20 bg-[#0a0a1f]">
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

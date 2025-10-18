"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/campaigns", label: "Campaigns" },
    { href: "/sessions", label: "Sessions" },
    { href: "/characters", label: "Characters" },
  ];

  return (
    <div className="w-full md:w-64 md:flex md:flex-col md:bg-[#0f0f23] md:border-r md:border-[#00ffff] md:border-opacity-20">
      {/* Mobile header */}
      <div className="md:hidden border-b border-[#00ffff] border-opacity-20 bg-[#0f0f23]">
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-[#00ffff] glitch-subtle tracking-[0.2em] uppercase"
            data-text="TYRANNY"
          >
            TYRANNY
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className="inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-40 p-2 text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors"
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
            "px-4 pb-4 space-y-3 bg-[#0f0f23] shadow-lg shadow-[#00ffff]/10",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block w-full px-4 py-3 text-sm font-bold uppercase tracking-wider rounded transition-colors duration-200",
                  isActive
                    ? "bg-[#ff00ff] text-black shadow-lg shadow-[#ff00ff]/50"
                    : "text-[#00ffff] hover:bg-[#1a1a3e] hover:text-[#ff00ff]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => logout()}
            className="w-full px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#00ffff] border border-[#00ffff] border-opacity-30 rounded hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-1 md:flex-col">
        <div className="p-6">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-[#00ffff] glitch-subtle tracking-[0.15em] uppercase"
            data-text="TYRANNY OF DRAGONS"
          >
            TYRANNY
            <br />
            OF
            <br />
            DRAGONS
          </Link>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-3 text-lg font-bold uppercase tracking-wider transition-all duration-200 rounded",
                  isActive
                    ? "bg-[#ff00ff] text-black shadow-lg shadow-[#ff00ff]/50"
                    : "text-[#00ffff] hover:bg-[#1a1a3e] hover:text-[#ff00ff]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4">
          <button
            onClick={() => logout()}
            className="w-full px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#00ffff] hover:text-[#ff00ff] transition-colors duration-200 border border-[#00ffff] border-opacity-30 rounded hover:border-[#ff00ff]"
          >
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}

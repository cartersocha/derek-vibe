"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/campaigns", label: "Campaigns" },
    { href: "/sessions", label: "Sessions" },
    { href: "/characters", label: "Characters" },
  ];

  return (
    <nav className="w-64 bg-[#0f0f23] border-r border-[#00ffff] border-opacity-20 flex flex-col">
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
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block px-4 py-3 text-lg font-bold uppercase tracking-wider transition-all duration-200 rounded",
              pathname.startsWith(link.href)
                ? "bg-[#ff00ff] text-black shadow-lg shadow-[#ff00ff]/50"
                : "text-[#00ffff] hover:bg-[#1a1a3e] hover:text-[#ff00ff]"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="p-4">
        <button
          onClick={() => logout()}
          className="w-full px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#00ffff] hover:text-[#ff00ff] transition-colors duration-200 border border-[#00ffff] border-opacity-30 rounded hover:border-[#ff00ff]"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

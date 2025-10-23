"use client";

import { usePathname } from "next/navigation";
import Topbar from "./topbar";

export default function ConditionalTopbar() {
  const pathname = usePathname();
  
  // Don't render topbar on login page
  if (pathname === "/login") {
    return null;
  }
  
  return <Topbar />;
}

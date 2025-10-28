"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Topbar from "./topbar";

export default function ConditionalTopbar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render topbar on login page or during SSR
  if (!isClient || pathname === "/login") {
    return null;
  }
  
  return <Topbar />;
}

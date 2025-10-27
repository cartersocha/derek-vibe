import type { Metadata } from "next";
import "./login.css";

export const metadata: Metadata = {
  title: "Login - Rat Palace Adventures",
  description: "Access your D&D campaign manager",
  robots: "noindex, nofollow", // Prevent indexing of login page
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

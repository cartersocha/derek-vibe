import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import AutoCapitalizeProvider from "@/components/providers/auto-capitalize-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import ConditionalTopbar from "@/components/layout/conditional-topbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rat Palace Adventures",
  description: "Manage your D&D campaigns, characters, and sessions",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} antialiased`}
      >
        <AutoCapitalizeProvider>
          <SidebarProvider>
            <ConditionalTopbar />
            {children}
          </SidebarProvider>
        </AutoCapitalizeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

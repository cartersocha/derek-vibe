import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import AutoCapitalizeProvider from "@/components/providers/auto-capitalize-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import ConditionalTopbar from "@/components/layout/conditional-topbar";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false, // Don't preload this heavy font
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} antialiased`}
      >
        {isLoginPage ? (
          <div className="login-body">
            {children}
          </div>
        ) : (
          <AutoCapitalizeProvider>
            <SidebarProvider>
              <ConditionalTopbar />
              <MainContentWrapper>
                {children}
              </MainContentWrapper>
            </SidebarProvider>
          </AutoCapitalizeProvider>
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AutoCapitalizeProvider from "@/components/providers/auto-capitalize-provider";

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
          {children}
        </AutoCapitalizeProvider>
        <Analytics />
      </body>
    </html>
  );
}

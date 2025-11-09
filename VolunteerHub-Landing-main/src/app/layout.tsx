import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";
import SiteHeader from "@/components/site-header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "One Marketplace for Verified Student Volunteering",
  description:
    "Discover verified volunteering opportunities, track hours, and build your reputation. Tools for students, organizers, and schools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body suppressHydrationWarning className="antialiased bg-background text-foreground">
        <ClientBody>
          <SiteHeader />
          {children}
        </ClientBody>
      </body>
    </html>
  );
}

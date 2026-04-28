import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import WarmupOnLoad from "./components/WarmupOnLoad";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnviroSim - Simulate today, Protect Tomorrow",
  description: "Predictive environmental analytics platform for Bangalore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-black dark:text-white transition-colors duration-300">
        <WarmupOnLoad />
        {children}
      </body>
    </html>
  );
}

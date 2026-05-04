import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  keywords: ["environmental simulation", "Bangalore", "flood prediction", "pollution monitoring", "climate analytics", "urban planning"],
  authors: [{ name: "EnviroSim Team" }],
  creator: "EnviroSim",
  publisher: "EnviroSim",
  openGraph: {
    title: "EnviroSim - Predictive Environmental Analytics",
    description: "Advanced platform for simulating environmental scenarios in Bangalore",
    url: "https://enviro-sim.vercel.app",
    siteName: "EnviroSim",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EnviroSim - Simulate today, Protect Tomorrow",
    description: "Predictive environmental analytics platform for Bangalore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "FwcMpT2gilEoGyHuXGI0ebPuCfzpq6Zvaq5r76-lV54",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "EnviroSim",
    "description": "Predictive environmental analytics platform for Bangalore",
    "url": "https://enviro-sim.vercel.app",
    "applicationCategory": "Environmental Simulation",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "EnviroSim Team"
    }
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-black dark:text-white transition-colors duration-300">
        <WarmupOnLoad />
        {children}
      </body>
    </html>
  );
}

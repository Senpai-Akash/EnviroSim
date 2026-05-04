// import Map from "./components/Map";
import Component from "./components/ui/landing-page"; // Import the landing page component
import { metadata } from "next";

export const metadata = {
  title: "EnviroSim - Predictive Environmental Analytics for Bangalore",
  description: "Simulate environmental scenarios, predict floods, pollution, and climate impacts in Bangalore. Interactive platform for urban planning and environmental protection.",
  keywords: ["environmental simulation", "Bangalore", "flood prediction", "pollution monitoring", "climate analytics", "urban planning"],
  alternates: {
    canonical: "https://enviro-sim.vercel.app",
  },
  openGraph: {
    title: "EnviroSim - Simulate Today, Protect Tomorrow",
    description: "Advanced environmental simulation platform for Bangalore's sustainable future.",
    url: "https://enviro-sim.vercel.app",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      <Component/>
      
    </main>
  );
}

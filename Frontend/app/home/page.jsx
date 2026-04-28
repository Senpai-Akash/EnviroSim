"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Cloud, Droplets, Thermometer, TrendingUp, Zap } from "lucide-react";
import Map from "@/app/components/Map";
import { simulate } from "@/app/utils/api";

const Home = () => {
  const [predictionData, setPredictionData] = useState(null);
  const [sliderValues] = useState({
    pollution: 45,
    flood: 30,
    temperature: 60,
  });
  const [predictionLoading, setPredictionLoading] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      setPredictionLoading(true);
      try {
        const data = await simulate({
          temperature: 28,
          pollution: 50,
          rainfall: 45,
          vegetation: 60,
          month: new Date().getMonth() + 1,
        });
        setPredictionData(data);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      } finally {
        setPredictionLoading(false);
      }
    };

    fetchPrediction();
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Landing Section */}
      <section className="pt-32 pb-20 px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400 font-semibold">Real-Time Environmental Intelligence</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Monitor Bangalore&apos;s
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Environmental Risk</span>
                </h1>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                Get ML-powered predictions for air pollution, flood risks, and heat stress across 26+ neighborhoods in Bangalore. Visualize risks on interactive heatmaps and explore what-if scenarios.
              </p>
              
              {/* Key Benefits */}
              <div className="grid grid-cols-2 gap-4 py-6">
                {[
                  { icon: TrendingUp, text: "Real-time Monitoring" },
                  { icon: Zap, text: "AI Predictions" },
                  { icon: MapPin, text: "26+ Areas" },
                  { icon: Cloud, text: "Live Data" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Explore Map
                </button>
                <Link href="/simulate" className="px-8 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all duration-300 flex items-center justify-center gap-2">
                  <span>Advanced Simulation</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right - Stats Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">System Overview</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "26+", label: "Neighborhoods", icon: MapPin },
                    { value: "3", label: "Risk Factors", icon: Cloud },
                    { value: "ML", label: "Powered", icon: Zap },
                    { value: "24/7", label: "Monitoring", icon: TrendingUp },
                  ].map(({ value, label, icon: Icon }, i) => (
                    <div key={i} className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-center">
                      <Icon className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">What We Monitor</p>
                  <div className="space-y-2">
                    {[
                      { icon: Cloud, text: "Air Pollution (PM2.5)", color: "text-orange-600 dark:text-orange-400" },
                      { icon: Droplets, text: "Flood Risk Probability", color: "text-blue-600 dark:text-blue-400" },
                      { icon: Thermometer, text: "Heat Stress Index", color: "text-red-600 dark:text-red-400" },
                    ].map(({ icon: Icon, text, color }, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-8 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            {/* Left Column - Controls & Features */}
            <div className="space-y-4">
              {/* Risk Control Panel */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-6 shadow-xl shadow-black/10 dark:shadow-black/40">
                <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Risk Control Panel</h2>
                <div className="space-y-6">
                  {[
                    { type: 'pollution', icon: Cloud, label: 'Air Pollution', color: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' },
                    { type: 'flood', icon: Droplets, label: 'Flood Risk', color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
                    { type: 'temperature', icon: Thermometer, label: 'Heat Stress', color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400' },
                  ].map(({ type, icon: Icon, label, color, textColor }) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${color}`}>
                          <Icon className={`w-4 h-4 ${textColor}`} />
                        </div>
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {label}
                        </label>
                        <span className="ml-auto text-lg font-bold text-slate-900 dark:text-white">{sliderValues[type]}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            type === 'pollution' ? 'bg-orange-500' :
                            type === 'flood' ? 'bg-blue-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${sliderValues[type]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area Insights */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-6 shadow-xl shadow-black/10 dark:shadow-black/40">
                <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Area Insights</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Highest Pollution Risk</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">Whitefield</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Highest Flood Risk</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">Bellandur</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Highest Heat Risk</span>
                    <span className="font-bold text-red-600 dark:text-red-400">Electronic City</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href="/simulate"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
              >
                <span>Advanced Simulation</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Column - Map */}
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/80 p-4 shadow-2xl shadow-black/20 dark:shadow-black/40">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400 font-semibold">Environmental Map</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Bangalore Risk Heatmap</h2>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-200 dark:bg-slate-800/75 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300 font-semibold">
                  {predictionLoading ? "Updating" : "Live"}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-950/75">
                <div className="relative h-[55vh] min-h-full w-full bg-white dark:bg-slate-800">
                  <Map 
                    predictionData={predictionData}
                    predictionLoading={predictionLoading}
                    sliderValues={sliderValues}
                  />
                </div>
              </div>

              {/* Map Legend */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Risk Levels</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-slate-700 dark:text-slate-300">High &gt; 70%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-slate-700 dark:text-slate-300">Medium 40-70%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-700 dark:text-slate-300">Low &lt; 40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-12 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-4">EnviroSim</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Environmental risk intelligence for Bangalore powered by machine learning.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                <li><a href="/home" className="hover:text-slate-900 dark:hover:text-white transition">Map Viewer</a></li>
                <li><a href="/simulate" className="hover:text-slate-900 dark:hover:text-white transition">Simulation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                <li><a href="/documentation" className="hover:text-slate-900 dark:hover:text-white transition">Documentation</a></li>
                <li><a href="/documentation#api" className="hover:text-slate-900 dark:hover:text-white transition">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                <li><a href="/documentation#privacy" className="hover:text-slate-900 dark:hover:text-white transition">Privacy</a></li>
                <li><a href="/documentation#terms" className="hover:text-slate-900 dark:hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 EnviroSim. Environmental Intelligence for Bangalore.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;

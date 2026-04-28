"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Layers, MapPin, Activity } from "lucide-react";
import { simulate } from "@/app/utils/api";

const INITIAL_CENTER = [12.9716, 77.5946];
const INITIAL_ZOOM = 12;
const BANGALORE_BOUNDS = [
  [12.82, 77.43],
  [13.14, 77.78],
];

// Expanded Bangalore-only area layer data with more locations
const BANGALORE_AREAS = [
  { area: "Majestic", lat: 12.9767, lng: 77.5713, pollution: 1.22, flood: 0.95, temperature: 1.12 },
  { area: "Koramangala", lat: 12.9352, lng: 77.6245, pollution: 1.08, flood: 1.08, temperature: 1.18 },
  { area: "Indiranagar", lat: 12.9784, lng: 77.6408, pollution: 1.12, flood: 0.82, temperature: 1.08 },
  { area: "Whitefield", lat: 12.9698, lng: 77.7500, pollution: 1.18, flood: 1.00, temperature: 1.15 },
  { area: "Electronic City", lat: 12.8399, lng: 77.6770, pollution: 1.05, flood: 0.92, temperature: 1.16 },
  { area: "Hebbal", lat: 13.0358, lng: 77.5970, pollution: 1.00, flood: 1.20, temperature: 0.96 },
  { area: "KR Puram", lat: 13.0075, lng: 77.6951, pollution: 1.16, flood: 1.28, temperature: 1.08 },
  { area: "Bellandur", lat: 12.9304, lng: 77.6784, pollution: 1.10, flood: 1.35, temperature: 1.10 },
  { area: "Jayanagar", lat: 12.9250, lng: 77.5938, pollution: 0.92, flood: 0.86, temperature: 0.98 },
  { area: "Malleshwaram", lat: 13.0031, lng: 77.5643, pollution: 0.95, flood: 0.78, temperature: 0.94 },
  { area: "Yelahanka", lat: 13.1007, lng: 77.5963, pollution: 0.86, flood: 0.98, temperature: 0.90 },
  { area: "Banashankari", lat: 12.9152, lng: 77.5736, pollution: 0.94, flood: 0.88, temperature: 0.97 },
  { area: "Vijayanagar", lat: 12.9567, lng: 77.5401, pollution: 0.99, flood: 0.91, temperature: 1.02 },
  { area: "Bhoopathy Garden", lat: 12.9631, lng: 77.5934, pollution: 1.04, flood: 0.93, temperature: 1.06 },
  { area: "Frazer Town", lat: 12.9732, lng: 77.6071, pollution: 1.07, flood: 0.89, temperature: 1.04 },
  { area: "Richmond Town", lat: 12.9647, lng: 77.6134, pollution: 1.09, flood: 0.87, temperature: 1.05 },
  { area: "Shantinagar", lat: 12.9856, lng: 77.6012, pollution: 1.14, flood: 1.03, temperature: 1.09 },
  { area: "Mathikere", lat: 13.0189, lng: 77.5821, pollution: 1.06, flood: 1.11, temperature: 1.01 },
  { area: "Rajajinagar", lat: 13.0019, lng: 77.5489, pollution: 0.98, flood: 0.95, temperature: 0.99 },
  { area: "Seshadripuram", lat: 13.0070, lng: 77.5766, pollution: 1.00, flood: 0.92, temperature: 1.00 },
  { area: "Ramamurthy Nagar", lat: 13.0245, lng: 77.6389, pollution: 1.13, flood: 1.19, temperature: 1.11 },
  { area: "Kalyamnagar", lat: 12.9420, lng: 77.7089, pollution: 1.11, flood: 1.14, temperature: 1.13 },
  { area: "Sankey Road", lat: 13.0044, lng: 77.5925, pollution: 0.97, flood: 0.84, temperature: 0.96 },
  { area: "Cantonment", lat: 13.0162, lng: 77.5947, pollution: 0.93, flood: 0.81, temperature: 0.93 },
  { area: "CV Raman Nagar", lat: 12.9669, lng: 77.6545, pollution: 1.10, flood: 0.99, temperature: 1.07 },
  { area: "Sarjapur", lat: 12.8893, lng: 77.7151, pollution: 1.04, flood: 1.06, temperature: 1.08 },
];

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function riskLabel(score) {
  if (score >= 75) return "Critical";
  if (score >= 55) return "High";
  if (score >= 35) return "Moderate";
  return "Low";
}

function pm25Risk(pm25) {
  if (typeof pm25 !== "number") return 0;
  if (pm25 <= 12) return (pm25 / 12) * 8;
  if (pm25 <= 35.4) return 8 + ((pm25 - 12) / 23.4) * 12;
  if (pm25 <= 55) return 20 + ((pm25 - 35.4) / 19.6) * 20;
  if (pm25 <= 150) return 40 + ((pm25 - 55) / 95) * 25;
  if (pm25 <= 250) return 65 + ((pm25 - 150) / 100) * 20;
  return clamp(85 + ((pm25 - 250) / 250) * 15);
}

function tempRisk(tempC) {
  if (typeof tempC !== "number" || tempC <= 28) return 0;
  if (tempC <= 33) return 5 + ((tempC - 28) / 5) * 10;
  if (tempC <= 37) return 15 + ((tempC - 33) / 4) * 25;
  if (tempC <= 40) return 40 + ((tempC - 37) / 3) * 30;
  if (tempC <= 43) return 70 + ((tempC - 40) / 3) * 20;
  return clamp(90 + ((tempC - 43) / 5) * 10);
}

function getModelScores(predictionData) {
  const prediction = predictionData?.prediction;
  const envRisk = prediction?.environmental_risk;
  const flood = typeof envRisk?.flood_risk_score === "number"
    ? envRisk.flood_risk_score
    : (typeof prediction?.flood_risk_probability === "number" ? prediction.flood_risk_probability * 100 : 0);
  const pollution = typeof envRisk?.air_quality_risk_score === "number"
    ? envRisk.air_quality_risk_score
    : pm25Risk(prediction?.predicted_pm25_next_day);
  const temperature = typeof envRisk?.heat_stress_risk_score === "number"
    ? envRisk.heat_stress_risk_score
    : tempRisk(prediction?.predicted_temp_max_next_day);
  const combined = typeof envRisk?.combined_risk_score === "number"
    ? envRisk.combined_risk_score
    : flood * 0.34 + pollution * 0.33 + temperature * 0.33;

  return {
    flood: clamp(flood),
    pollution: clamp(pollution),
    temperature: clamp(temperature),
    combined: clamp(combined),
    label: envRisk?.combined_risk_label || riskLabel(combined),
    pm25: prediction?.predicted_pm25_next_day,
    temp: prediction?.predicted_temp_max_next_day,
  };
}

function getNearestBangaloreArea(lat, lng) {
  return BANGALORE_AREAS.reduce((nearest, area) => {
    const distance = Math.hypot(area.lat - lat, area.lng - lng);
    return distance < nearest.distance ? { area, distance } : nearest;
  }, { area: BANGALORE_AREAS[0], distance: Infinity }).area;
}

export default function Map({ predictionData, predictionLoading = false, sliderValues = {} }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayersRef = useRef({});
  const [searchQuery, setSearchQuery] = useState("");
  const [areaLabel, setAreaLabel] = useState("Bangalore");
  const [mapReady, setMapReady] = useState(false);
  const [isHeatmapPanelOpen, setIsHeatmapPanelOpen] = useState(false);
  const [areaPredictions, setAreaPredictions] = useState({});
  const [activeHeatmaps, setActiveHeatmaps] = useState({
    pollution: false,
    flood: false,
    temperature: false,
  });
  const modelScores = getModelScores(predictionData);

  // FETCH PREDICTIONS FOR ALL AREAS
  useEffect(() => {
    const fetchAreaPredictions = async () => {
      try {
        const predictions = {};
        
        for (const area of BANGALORE_AREAS) {
          try {
            const data = await simulate({
              temperature: 28,
              pollution: 50,
              rainfall: 45,
              vegetation: 60,
              month: new Date().getMonth() + 1,
            });
            predictions[area.area] = data;
          } catch (error) {
            console.error(`Error fetching prediction for ${area.area}:`, error);
          }
        }
        
        setAreaPredictions(predictions);
      } catch (error) {
        console.error('Error fetching area predictions:', error);
      }
    };

    if (mapReady) {
      fetchAreaPredictions();
    }
  }, [mapReady]);

  const getRiskData = (type) => {
    return BANGALORE_AREAS.map((point) => {
      const areaPred = areaPredictions[point.area];
      const scores = getModelScores(areaPred);
      let baseScore = scores[type];
      
      // Apply slider adjustment if present
      if (sliderValues && typeof sliderValues[type] === 'number') {
        baseScore = sliderValues[type];
      }
      
      const score = clamp(baseScore * point[type], 5, 100);
      const intensity = score / 100;
      
      return {
        ...point,
        intensity,
        score: Math.round(score),
        label: `${riskLabel(score)} ${type} risk`,
        realData: !!areaPred,
      };
    });
  };

  // LOCATION SEARCH FUNCTIONALITY
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    try {
      const bangaloreQuery = /bengaluru|bangalore/i.test(searchQuery)
        ? searchQuery
        : `${searchQuery}, Bengaluru, Karnataka`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=77.43,13.14,77.78,12.82&q=${encodeURIComponent(
          bangaloreQuery
        )}`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        mapInstanceRef.current.setView([parseFloat(lat), parseFloat(lon)], 14);
        const nearestArea = getNearestBangaloreArea(parseFloat(lat), parseFloat(lon));
        setAreaLabel(nearestArea.area || display_name?.split(",").slice(0, 2).join(", ") || searchQuery);
        setSearchQuery("");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // HEATMAP LAYER TOGGLE FUNCTIONALITY
  const addHeatmapLayer = async (type) => {
    const LeafletModule = await import("leaflet");
    const L = LeafletModule.default || LeafletModule;
    const map = mapInstanceRef.current;
    const points = getRiskData(type);

    if (!map) return;

    if (!map.getPane('heatmapPane')) {
      map.createPane('heatmapPane');
      map.getPane('heatmapPane').style.zIndex = 650;
    }

    // Updated color schemes: Red (high) → Yellow/Orange (medium) → Green/Blue (low)
    const colors = {
      pollution: { high: "#FF0000", mid: "#FFB500", low: "#00B050" },
      flood: { high: "#CC0000", mid: "#FF9800", low: "#2196F3" },
      temperature: { high: "#8B0000", mid: "#FF6B35", low: "#4DB8FF" },
    };

    const color = colors[type];
    const layerGroup = L.layerGroup();

    points.forEach((point) => {
      const radius = 950 + point.intensity * 1450;
      
      // Gradient: Red (>70%) → Orange (40-70%) → Green (<40%)
      let fillColor;
      if (point.intensity > 0.7) {
        // High risk: Red zone
        fillColor = color.high;
      } else if (point.intensity > 0.4) {
        // Medium risk: interpolate between orange and yellow
        const factor = (point.intensity - 0.4) / 0.3; // 0 to 1
        fillColor = tintColor(color.mid, color.low, factor);
      } else {
        // Low risk: Green/Blue
        fillColor = color.low;
      }

      L.circle([point.lat, point.lng], {
        color: "#333",
        weight: 2,
        opacity: 0.8,
        fillColor: fillColor,
        fillOpacity: 0.42,
        radius: radius,
        pane: 'heatmapPane',
      })
        .bindPopup(
          `<strong>${point.area}</strong><br/>${point.label}<br/>Area-adjusted model risk: ${point.score}%${point.realData ? '<br/><span style="color:#0ea5e9">✓ Real simulation data</span>' : ''}`
        )
        .bindTooltip(`${point.area}: ${point.score}%`, {
          direction: "top",
          opacity: 0.85,
          sticky: true,
        })
        .addTo(layerGroup);
    });

    layerGroup.addTo(map);
    heatmapLayersRef.current[type] = layerGroup;
  };

  // Update heatmap when prediction data or slider values change (but DON'T toggle)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    Object.keys(activeHeatmaps).forEach((type) => {
      if (!activeHeatmaps[type]) return; // Skip if not active
      
      // Remove old layer
      removeHeatmapLayer(type);
      
      // Add new layer with updated data
      addHeatmapLayer(type);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionData, sliderValues, mapReady]);

  const removeHeatmapLayer = (type) => {
    const map = mapInstanceRef.current;
    if (map && heatmapLayersRef.current[type]) {
      map.removeLayer(heatmapLayersRef.current[type]);
      heatmapLayersRef.current[type] = null;
      delete heatmapLayersRef.current[type];
    }
  };

  const toggleHeatmap = async (type) => {
    if (!mapReady || !mapInstanceRef.current) {
      console.warn('Map not ready yet');
      return;
    }
    
    // First remove if it exists
    if (activeHeatmaps[type]) {
      removeHeatmapLayer(type);
    } else {
      // Then add if toggling on
      await addHeatmapLayer(type);
    }
    
    // Update state after toggling
    setActiveHeatmaps((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // COLOR INTERPOLATION HELPER
  const tintColor = (color1, color2, factor) => {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    const r = Math.round(((c1 >> 16) & 255) * factor + ((c2 >> 16) & 255) * (1 - factor));
    const g = Math.round(
      (((c1 >> 8) & 255) * factor + ((c2 >> 8) & 255) * (1 - factor))
    );
    const b = Math.round(((c1 & 255) * factor + (c2 & 255) * (1 - factor)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  // MAP INITIALIZATION
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const LeafletModule = await import("leaflet");
        const L = LeafletModule.default || LeafletModule;

        if (!isMounted || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          scrollWheelZoom: true,
          dragging: true,
          zoomControl: true,
          maxBounds: BANGALORE_BOUNDS,
          maxBoundsViscosity: 0.8,
        }).setView(INITIAL_CENTER, INITIAL_ZOOM);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapInstanceRef.current = map;
        map.invalidateSize();

        map.on("moveend", () => {
          const center = map.getCenter();
          const nearestArea = getNearestBangaloreArea(center.lat, center.lng);
          setAreaLabel(`${nearestArea.area}, Bengaluru`);
        });
        
        // Give map time to fully initialize before allowing interactions
        setTimeout(() => {
          if (isMounted) {
            setMapReady(true);
          }
        }, 500);
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    }

    initMap();

    return () => {
      isMounted = false;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {/* MAP CONTAINER */}
      <div
        ref={mapRef}
        className="map pointer-events-auto"
        style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
        aria-label="Bangalore map"
      />

      <div className="absolute left-4 top-4 z-[700] w-[min(340px,calc(100%-2rem))] rounded-lg border border-slate-700/70 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur pointer-events-auto">
        <div className="mb-3 flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200">Risk In This Area</p>
            <p className="truncate text-[11px] text-slate-400">{areaLabel}</p>
          </div>
          <span className={`ml-auto rounded px-2 py-1 text-[10px] font-semibold ${
            modelScores.combined < 35 ? "bg-green-500/15 text-green-300" :
            modelScores.combined < 55 ? "bg-yellow-500/15 text-yellow-300" :
            modelScores.combined < 75 ? "bg-orange-500/15 text-orange-300" :
            "bg-red-500/15 text-red-300"
          }`}>
            {predictionLoading ? "Updating" : modelScores.label}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between rounded-md bg-slate-900/80 px-3 py-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-300" />
            <span className="text-xs text-slate-300">Combined ML risk</span>
          </div>
          <span className="text-lg font-bold text-white">{Math.round(modelScores.combined)}%</span>
        </div>

        <div className="space-y-2 text-xs">
          {[
            ["Flood", modelScores.flood, "bg-blue-400", `${Math.round(modelScores.flood)}%`],
            ["Pollution", modelScores.pollution, "bg-orange-400", typeof modelScores.pm25 === "number" ? `${modelScores.pm25} PM2.5` : "--"],
            ["Temperature", modelScores.temperature, "bg-red-400", typeof modelScores.temp === "number" ? `${modelScores.temp}°C` : "--"],
          ].map(([label, score, colorClass, detail]) => (
            <div key={label} className="grid grid-cols-[78px_1fr_58px] items-center gap-2">
              <span className="text-slate-300">{label}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="truncate text-right text-slate-300" title={detail}>{detail}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setIsHeatmapPanelOpen(!isHeatmapPanelOpen)}
        className="fixed z-40 flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 pointer-events-auto"
        style={{ bottom: '8px', right: '16px', zIndex: 40 }}
        aria-label="Toggle heatmap panel"
        title={isHeatmapPanelOpen ? "Close heatmaps" : "Open heatmaps"}
      >
        <Layers className="w-6 h-6" />
      </button>

      {/* HEATMAP TOGGLE UI COMPONENT */}
      {isHeatmapPanelOpen && (
      <div className="fixed right-4 z-50 bg-white rounded-lg shadow-xl p-4 border border-gray-200 w-80 pointer-events-auto animate-in fade-in slide-in-from-bottom-2" style={{ bottom: '60px', right: '16px', zIndex: 9999 }}>
        {/* SEARCH LOCATION INSIDE HEATMAP MENU */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <form onSubmit={handleLocationSearch} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-800">Search Bengaluru Area</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Koramangala, Hebbal..."
                  className="w-full px-3 py-2 pl-9 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Go
              </button>
            </div>
          </form>
        </div>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
          <Layers className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-800">Bengaluru Area Layers</h3>
        </div>

        <div className="space-y-2">
          {/* Pollution Heatmap Toggle */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={activeHeatmaps.pollution}
              onChange={() => toggleHeatmap("pollution")}
              className="w-4 h-4 text-orange-500 rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800">Air Pollution</p>
              <p className="text-xs text-gray-500">Area-adjusted PM2.5 risk</p>
            </div>
          </label>

          {/* Flood Heatmap Toggle */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={activeHeatmaps.flood}
              onChange={() => toggleHeatmap("flood")}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800">Flood Risk</p>
              <p className="text-xs text-gray-500">Area-adjusted flood risk</p>
            </div>
          </label>

          {/* Temperature Heatmap Toggle */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={activeHeatmaps.temperature}
              onChange={() => toggleHeatmap("temperature")}
              className="w-4 h-4 text-red-500 rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800">Heat Islands</p>
              <p className="text-xs text-gray-500">Area-adjusted heat risk</p>
            </div>
          </label>
        </div>

        {/* Legend Section */}
        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
          <p className="font-medium mb-2">Risk Levels:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High Risk &gt; 70%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium Risk 40-70%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Low Risk &lt; 40%</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

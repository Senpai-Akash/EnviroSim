"use client";

import { useEffect } from "react";
import { warmup, warmupMlService } from "@/app/utils/api";

const WARMUP_STORAGE_KEY = "enviro-warmup-fired";

export default function WarmupOnLoad() {
  useEffect(() => {
    const performWarmup = async () => {
      // Check if already warmed up in this session
      if (typeof window !== "undefined" && sessionStorage.getItem(WARMUP_STORAGE_KEY)) {
        console.log("[Warmup] Already warmed up in this session");
        return;
      }

      try {
        console.log("[Warmup] Starting backend warmup...");
        
        // Warmup backend first to get ML service URL
        const backendResult = await warmup();
        console.log("[Warmup] Backend warmed", backendResult);
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem(WARMUP_STORAGE_KEY, "true");
        }

        // Start ML warmup in background (don't wait - it takes 30-40 seconds)
        if (backendResult?.mlService) {
          console.log("[Warmup] Backend ready! Starting background ML warmup (can take 30-40 seconds)...");
          
          // Fire and forget - ML warmup happens in background without blocking
          warmupMlService(backendResult.mlService)
            .then((mlResult) => {
              console.log("[Warmup] ✅ Background ML service now warmed and ready", mlResult);
            })
            .catch((mlErr) => {
              console.warn("[Warmup] ⚠️ Background ML service warmup encountered issues:", mlErr.message);
            });
        }
        
        console.log("[Warmup] Frontend ready! ML warming in background...");
      } catch (err) {
        console.error("[Warmup] Backend warmup failed:", {
          message: err.message,
          error: err,
        });
      }
    };

    // Ensure we're in the browser
    if (typeof window !== "undefined") {
      performWarmup();
    }
  }, []);

  return null;
}

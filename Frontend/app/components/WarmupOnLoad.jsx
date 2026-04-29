"use client";

import { useEffect } from "react";
import { warmup } from "@/app/utils/api";

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
        console.log("[Warmup] Starting warmup request...");
        const result = await warmup();
        console.log("[Warmup] Success:", result);
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem(WARMUP_STORAGE_KEY, "true");
        }
      } catch (err) {
        console.error("[Warmup] Failed (will retry on next API call):", {
          message: err.message,
          error: err,
        });
        // Don't mark as warmed so retry happens on first API call
      }
    };

    // Ensure we're in the browser
    if (typeof window !== "undefined") {
      performWarmup();
    }
  }, []);

  return null;
}

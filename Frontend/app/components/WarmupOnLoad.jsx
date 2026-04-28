"use client";

import { useEffect } from "react";
import { warmup } from "@/app/utils/api";

export default function WarmupOnLoad() {
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("enviro-warmup-fired")) {
      return;
    }

    sessionStorage.setItem("enviro-warmup-fired", "true");
    warmup().catch((err) => {
      console.warn("Warmup request failed:", err.message);
    });
  }, []);

  return null;
}

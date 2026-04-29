export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const DEFAULT_SIMULATION_VALUES = {
  rainfall: 45,
  temperature: 30,
  pollution: 30,
  vegetation: 60,
  month: 1,
};

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildSimulationPayload(data = {}) {
  const rainfall = toNumber(data.rainfall, DEFAULT_SIMULATION_VALUES.rainfall);
  const temperature = toNumber(
    data.temperature,
    DEFAULT_SIMULATION_VALUES.temperature
  );
  const pollution = toNumber(
    data.pollution,
    data.humidity ?? DEFAULT_SIMULATION_VALUES.pollution
  );
  const vegetation = toNumber(
    data.vegetation,
    DEFAULT_SIMULATION_VALUES.vegetation
  );
  const month = Math.trunc(
    toNumber(data.month, DEFAULT_SIMULATION_VALUES.month)
  );

  return {
    rainfall,
    temperature,
    pollution,
    vegetation,
    month: Math.min(12, Math.max(1, month)),
  };
}

export async function simulate(data = {}, isRetry = false) {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  const payload = buildSimulationPayload(data);
  console.log("[Simulate] Request payload:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed = null;

      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      const message =
        parsed?.fallback?.suggestion ||
        parsed?.error?.message ||
        `Simulate request failed (${res.status})`;

      throw new Error(message);
    }

    return await res.json();
  } catch (err) {
    console.error("[Simulate] Error in API call:", err.message);
    
    // If first attempt and ML might still be warming up, wait and retry
    if (!isRetry && err.message.includes("ML")) {
      console.log("[Simulate] ML service might still be warming up. Waiting 5 seconds before retry...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      return simulate(data, true); // Retry once
    }
    
    throw err;
  }
}

const MAX_WARMUP_RETRIES = 5;
const WARMUP_RETRY_DELAY_MS = 2000; // 2 seconds between retries
const ML_WARMUP_TIMEOUT_MS = 50000; // 50 seconds for ML service (cold start takes 30-40s)
const ML_MAX_RETRIES = 6; // More retries for ML since it takes longer
const ML_RETRY_DELAY_MS = 3000; // 3 seconds between ML retries

export async function warmup(retryCount = 0) {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  try {
    console.log(`[API Warmup - Backend] Attempt ${retryCount + 1}/${MAX_WARMUP_RETRIES + 1} to ${BACKEND_URL}/warmup`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const res = await fetch(`${BACKEND_URL}/warmup`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Warmup request failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log("[API Warmup - Backend] Success", data);
    return data;
  } catch (err) {
    console.error(`[API Warmup - Backend] Attempt ${retryCount + 1} failed:`, err.message);

    // Retry if we haven't exceeded max retries
    if (retryCount < MAX_WARMUP_RETRIES) {
      console.log(`[API Warmup - Backend] Retrying in ${WARMUP_RETRY_DELAY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, WARMUP_RETRY_DELAY_MS));
      return warmup(retryCount + 1);
    }

    throw err;
  }
}

export async function warmupMlService(mlUrl, retryCount = 0) {
  if (!mlUrl) {
    throw new Error("ML service URL is not available");
  }

  // Normalize URL - remove trailing slashes and /docs, /openapi.json
  const normalizedUrl = mlUrl
    .replace(/\/+$/, "")
    .replace(/\/docs$/, "")
    .replace(/\/openapi\.json$/, "");

  const warmupTargets = [
    `${normalizedUrl}/`,
    `${normalizedUrl}/health`,
  ];

  try {
    console.log(`[API Warmup - ML] Attempt ${retryCount + 1}/${ML_MAX_RETRIES + 1} to ${normalizedUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ML_WARMUP_TIMEOUT_MS);

    // Try the root endpoint first, fallback to health endpoint
    let lastError;
    for (const target of warmupTargets) {
      try {
        const res = await fetch(target, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok || res.status < 500) {
          // Success or at least server is responding
          clearTimeout(timeoutId);
          const text = await res.text();
          console.log(`[API Warmup - ML] Success (${res.status}) from ${target}`);
          return { status: res.status, url: target };
        }
      } catch (err) {
        lastError = err;
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error("ML service did not respond");
  } catch (err) {
    console.error(`[API Warmup - ML] Attempt ${retryCount + 1} failed:`, err.message);

    // Retry if we haven't exceeded max retries
    if (retryCount < ML_MAX_RETRIES) {
      console.log(`[API Warmup - ML] Retrying in ${ML_RETRY_DELAY_MS}ms (${retryCount + 1}/${ML_MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, ML_RETRY_DELAY_MS));
      return warmupMlService(mlUrl, retryCount + 1);
    }

    throw err;
  }
}

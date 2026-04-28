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

export async function simulate(data = {}) {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  const payload = buildSimulationPayload(data);
  console.log("Simulate payload:", payload);

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
    console.error("Error in API call:", err);
    throw err;
  }
}

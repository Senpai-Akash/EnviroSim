/**
 * Backend /simulate contract tests.
 * Run: cd Backend && node test_simulate.js
 *
 * Requires: Python inference service on :8000, backend on :6969
 */

// changed the url
const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:6969";

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSimulationPayload(data = {}) {
  const rainfall = toNumber(data.rainfall, 45);
  const temperature = toNumber(data.temperature, 30);
  const pollution = toNumber(data.pollution, data.humidity ?? 30);
  const vegetation = toNumber(data.vegetation, 60);
  const month = Math.trunc(toNumber(data.month, 1));

  return {
    rainfall,
    temperature,
    pollution,
    vegetation,
    month,
  };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.error(`  ❌ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

async function postSimulate(body) {
  const res = await fetch(`${BACKEND}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

(async () => {
  console.log("Backend /simulate contract tests\n");

  await test("GET /health returns ok", async () => {
    const res = await fetch(`${BACKEND}/health`);
    assert(res.ok, `status ${res.status}`);
    const data = await res.json();
    assert(data.status === "ok", "status not ok");
  });

  await test("POST /simulate with valid input returns prediction", async () => {
    const { status, data } = await postSimulate({
      temperature: 30, pollution: 50, rainfall: 80, vegetation: 40,
    });
    assert(status === 200, `status ${status}`);
    assert(data.status === "ok", `status: ${data.status}`);
    assert(data.source === "ml-inference", `source: ${data.source}`);
    assert(typeof data.prediction.flood_risk_probability === "number", "missing flood_risk");
    assert(typeof data.prediction.predicted_pm25_next_day === "number", "missing pm25");
    assert(typeof data.prediction.predicted_temp_max_next_day === "number", "missing temp");
    assert(
      data.prediction.metadata.vegetation_source === "Data/cleaned-data/vegetation-dummy.csv",
      "missing vegetation source metadata"
    );
  });

  await test("POST /simulate echoes input back", async () => {
    const { data } = await postSimulate({
      temperature: 20, pollution: 10, rainfall: 5, vegetation: 80,
    });
    assert(data.input.temperature === 20, "temperature mismatch");
    assert(data.input.rainfall === 5, "rainfall mismatch");
  });

  await test("POST /simulate rejects out-of-range temperature", async () => {
    const { status, data } = await postSimulate({ temperature: 999 });
    assert(status === 400, `expected 400, got ${status}`);
    assert(data.errors.length > 0, "expected validation errors");
  });

  await test("POST /simulate uses default month if not provided", async () => {
    const { data } = await postSimulate({ temperature: 25 });
    assert(data.input.month >= 1 && data.input.month <= 12, "bad month");
  });

  await test("POST /simulate prediction flood_risk is between 0 and 1", async () => {
    const { data } = await postSimulate({
      temperature: 25, pollution: 30, rainfall: 45, vegetation: 60,
    });
    const prob = data.prediction.flood_risk_probability;
    assert(prob >= 0 && prob <= 1, `flood prob out of range: ${prob}`);
  });

  console.log("\nDone.");
})();

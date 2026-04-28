const axios = require("axios");

const ML_REQUEST_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 65000);
const ML_WARM_TIMEOUT_MS = Number(process.env.ML_WARM_TIMEOUT_MS || 10000);
const ML_RETRY_COUNT = Number(process.env.ML_RETRY_COUNT || 2);
const ML_RETRY_BASE_DELAY_MS = Number(process.env.ML_RETRY_BASE_DELAY_MS || 1200);
const ML_WARM_CACHE_MS = Number(process.env.ML_WARM_CACHE_MS || 10 * 60 * 1000);

let lastWarmSuccessAt = 0;

function getConfiguredMlUrl() {
  return (
    process.env.PY_INFERENCE_URL ||
    process.env.ML_URL ||
    "http://127.0.0.1:8000"
  )
    .replace(/\/+$/, "")
    .replace(/\/docs$/, "")
    .replace(/\/openapi\.json$/, "");
}

function getMlEndpoints() {
  const baseUrl = getConfiguredMlUrl();
  return {
    baseUrl,
    predictUrl: `${baseUrl}/predict`,
    healthUrl: `${baseUrl}/health`,
    rootUrl: `${baseUrl}/`,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createDeadlineSignal(timeoutMs) {
  if (typeof AbortController === "undefined") {
    return {
      signal: undefined,
      cleanup: () => {},
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSimulationPayload(body = {}) {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    if (Array.isArray(body.features)) {
      const [rainfall, temperature, pollution, vegetation, month] = body.features;
      return {
        rainfall,
        temperature,
        pollution,
        vegetation,
        month,
      };
    }

    return {
      temperature: body.temperature,
      rainfall: body.rainfall,
      pollution: body.pollution ?? body.humidity,
      vegetation: body.vegetation,
      month: body.month,
    };
  }

  return {};
}

function validateSimulationPayload(rawPayload = {}) {
  const payload = {
    temperature: toNumber(rawPayload.temperature, 25),
    rainfall: toNumber(rawPayload.rainfall, 45),
    pollution: toNumber(rawPayload.pollution ?? rawPayload.humidity, 30),
    vegetation: toNumber(rawPayload.vegetation, 60),
    month: Math.trunc(toNumber(rawPayload.month, new Date().getMonth() + 1)),
  };

  const rules = [
    ["temperature", payload.temperature, -10, 65],
    ["rainfall", payload.rainfall, 0, 1000],
    ["pollution", payload.pollution, 0, 600],
    ["vegetation", payload.vegetation, 0, 100],
    ["month", payload.month, 1, 12],
  ];

  const errors = [];

  for (const [field, value, min, max] of rules) {
    if (!isFiniteNumber(value)) {
      errors.push({
        field,
        message: `${field} must be a finite number`,
      });
      continue;
    }

    if (value < min || value > max) {
      errors.push({
        field,
        message: `${field} must be between ${min} and ${max}`,
      });
    }
  }

  return {
    payload,
    errors,
  };
}

function sanitizeAxiosError(err) {
  return {
    message: err.message,
    code: err.code || null,
    status: err.response?.status || null,
    responseBody: err.response?.data || null,
    responseHeaders: err.response?.headers || null,
  };
}

function isRetriableError(err) {
  if (err.response?.status >= 500) {
    return true;
  }

  return [
    "ECONNABORTED",
    "ETIMEDOUT",
    "ECONNRESET",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ERR_CANCELED",
  ].includes(err.code);
}

function isTimeoutLikeError(err) {
  return (
    err.code === "ECONNABORTED" ||
    err.code === "ETIMEDOUT" ||
    err.code === "ERR_CANCELED" ||
    /timeout/i.test(err.message || "")
  );
}

async function warmMlServiceIfNeeded(options = {}) {
  const { force = false } = options;
  const now = Date.now();
  if (!force && now - lastWarmSuccessAt < ML_WARM_CACHE_MS) {
    return {
      ok: true,
      cached: true,
      status: "warm",
      targetUrl: getMlEndpoints().rootUrl,
    };
  }

  const { rootUrl, healthUrl } = getMlEndpoints();
  const warmTarget = rootUrl || healthUrl;
  const { signal, cleanup } = createDeadlineSignal(ML_WARM_TIMEOUT_MS + 1000);

  try {
    const response = await axios.get(warmTarget, {
      timeout: ML_WARM_TIMEOUT_MS,
      signal,
      validateStatus: () => true,
    });

    lastWarmSuccessAt = Date.now();
    console.log("[simulate] ML warm-up result", {
      url: warmTarget,
      status: response.status,
      data: response.data,
    });
    return {
      ok: response.status >= 200 && response.status < 500,
      cached: false,
      status: "warm",
      targetUrl: warmTarget,
      upstreamStatus: response.status,
      data: response.data,
    };
  } catch (err) {
    console.warn("[simulate] ML warm-up failed", {
      url: warmTarget,
      ...sanitizeAxiosError(err),
    });
    return {
      ok: false,
      cached: false,
      status: "warming",
      targetUrl: warmTarget,
      error: sanitizeAxiosError(err),
    };
  } finally {
    cleanup();
  }
}

async function callMlPredictWithRetry(payload) {
  const { predictUrl } = getMlEndpoints();
  let lastError;

  for (let attempt = 0; attempt <= ML_RETRY_COUNT; attempt += 1) {
    const startedAt = Date.now();
    const { signal, cleanup } = createDeadlineSignal(ML_REQUEST_TIMEOUT_MS + 5000);

    try {
      const { rainfall, temperature, pollution, vegetation, month } = payload;
      const mlPayload = {
        features: [rainfall, temperature, pollution, vegetation, month],
      };

      console.log("ML PAYLOAD:", mlPayload);

      const response = await axios.post(predictUrl, mlPayload, {
        timeout: ML_REQUEST_TIMEOUT_MS,
        signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[simulate] ML success", {
        predictUrl,
        attempt: attempt + 1,
        durationMs: Date.now() - startedAt,
        status: response.status,
      });

      lastWarmSuccessAt = Date.now();
      return response.data;
    } catch (err) {
      lastError = err;
      const errorDetails = sanitizeAxiosError(err);

      console.error("[simulate] ML request failed", {
        predictUrl,
        attempt: attempt + 1,
        durationMs: Date.now() - startedAt,
        ...errorDetails,
      });

      if (attempt >= ML_RETRY_COUNT || !isRetriableError(err)) {
        break;
      }

      const backoffMs = ML_RETRY_BASE_DELAY_MS * (2 ** attempt);
      await sleep(backoffMs);
    } finally {
      cleanup();
    }
  }

  throw lastError;
}

function buildErrorResponse(err, payload) {
  const timeout = isTimeoutLikeError(err);
  const upstreamStatus = err.response?.status || null;

  return {
    ok: false,
    error: {
      type: timeout ? "ml_timeout" : "ml_service_error",
      message: timeout
        ? "ML service is taking longer than expected. The server may be waking up."
        : "ML service request failed",
      retryable: timeout || upstreamStatus >= 500 || upstreamStatus === null,
      upstreamStatus,
      inferenceUrl: getMlEndpoints().predictUrl,
      details: err.response?.data || err.message,
    },
    fallback: {
      prediction: null,
      input: payload,
      suggestion: "Server waking up, retry in a few seconds",
    },
  };
}

const simulateController = async (req, res) => {
  const normalizedPayload = normalizeSimulationPayload(req.body);
  const { payload, errors } = validateSimulationPayload(normalizedPayload);

  if (errors.length > 0) {
    return res.status(400).json({
      ok: false,
      error: {
        type: "validation_error",
        message: "Invalid simulation payload",
      },
      errors,
      input: normalizedPayload,
    });
  }

  try {
    await warmMlServiceIfNeeded();
    const prediction = await callMlPredictWithRetry(payload);

    return res.json({
      ok: true,
      status: "ok",
      source: "ml-inference",
      input: payload,
      prediction,
    });
  } catch (err) {
    const errorResponse = buildErrorResponse(err, payload);
    const statusCode = isTimeoutLikeError(err) ? 504 : 502;

    return res.status(statusCode).json(errorResponse);
  }
};

module.exports = {
  simulateController,
  getConfiguredMlUrl,
  getMlEndpoints,
  warmMlServiceIfNeeded,
};

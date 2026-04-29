const express = require("express");
const cors = require("cors");
const {
  simulateController,
  getMlEndpoints,
  warmMlServiceIfNeeded,
} = require("./controllers/simulate");

const app = express();

// CORS configuration that allows both production and local development
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://enviro-sim.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    mlService: getMlEndpoints().baseUrl,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    message: "Backend is running",
    mlService: getMlEndpoints().baseUrl,
  });
});

app.get("/warmup", async (req, res) => {
  console.log("[Backend] Warmup request received from:", req.get("origin"));
  const warmupResult = await warmMlServiceIfNeeded({ force: true });

  if (warmupResult.ok) {
    console.log("[Backend] Warmup successful");
    return res.json({
      status: "Backend + ML warmed",
      service: "backend",
      mlService: getMlEndpoints().baseUrl,
      warmup: warmupResult,
    });
  }

  console.log("[Backend] Warmup in progress");
  return res.json({
    status: "Backend awake, ML warming",
    service: "backend",
    mlService: getMlEndpoints().baseUrl,
    warmup: warmupResult,
  });
});

app.post("/simulate", simulateController);

const PORT = process.env.PORT || 6969;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  warmMlServiceIfNeeded({ force: true }).catch((err) => {
    console.warn("Initial ML warm-up failed", err.message);
  });
});

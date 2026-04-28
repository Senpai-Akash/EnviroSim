const express = require("express");
const cors = require("cors");
const {
  simulateController,
  getMlEndpoints,
  warmMlServiceIfNeeded,
} = require("./controllers/simulate");

const app = express();

app.use(cors({
  origin: "https://enviro-sim.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

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

app.post("/simulate", simulateController);

const PORT = process.env.PORT || 6969;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  warmMlServiceIfNeeded().catch((err) => {
    console.warn("Initial ML warm-up failed", err.message);
  });
});

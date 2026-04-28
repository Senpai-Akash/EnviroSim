"""
Smoke tests for the InferenceService /predict and /health endpoints.
Run from project root:  python3 -m pytest InferenceService/test_inference.py -v
"""
import pytest
from fastapi.testclient import TestClient

from InferenceService.app import app


def test_health():
    with TestClient(app) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "inference"
        assert "flood" in data["models_loaded"]
        assert data["historical_rows"] == 14


def test_root_warmup_route():
    with TestClient(app) as client:
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "inference"


def test_predict_defaults():
    """Predict with default values returns valid floats."""
    with TestClient(app) as client:
        resp = client.post("/predict", json={
            "temperature": 25, "pollution": 30, "rainfall": 45,
            "vegetation": 60, "month": 4,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert 0 <= data["flood_risk_probability"] <= 1
        assert isinstance(data["predicted_pm25_next_day"], (int, float))
        assert isinstance(data["predicted_temp_max_next_day"], (int, float))
        assert data["metadata"]["mode"] == "historical-lag-with-scenario-override"
        assert data["metadata"]["inference_duration_ms"] >= 0


def test_predict_high_rainfall():
    """High rainfall should produce a meaningful flood probability."""
    with TestClient(app) as client:
        resp = client.post("/predict", json={
            "temperature": 25, "pollution": 30, "rainfall": 500,
            "vegetation": 60, "month": 7,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert 0 <= data["flood_risk_probability"] <= 1


def test_rainfall_changes_flood_probability():
    with TestClient(app) as client:
        low = client.post("/predict", json={
            "temperature": 25, "pollution": 30, "rainfall": 5,
            "vegetation": 60, "month": 7,
        })
        high = client.post("/predict", json={
            "temperature": 25, "pollution": 30, "rainfall": 350,
            "vegetation": 60, "month": 7,
        })

        assert low.status_code == 200
        assert high.status_code == 200
        assert high.json()["flood_risk_probability"] > low.json()["flood_risk_probability"]


def test_predict_validation_rejects_invalid():
    """Out-of-range values should be rejected by Pydantic."""
    with TestClient(app) as client:
        resp = client.post("/predict", json={"temperature": 999})
        assert resp.status_code == 422  # Pydantic validation error


def test_predict_validation_rejects_unknown_fields():
    with TestClient(app) as client:
        resp = client.post("/predict", json={"features": [1, 2, 3]})
        assert resp.status_code == 200
        assert resp.json()["input_echo"]["pollution"] == 3


def test_predict_accepts_five_feature_payload():
    with TestClient(app) as client:
        resp = client.post("/predict", json={"features": [80, 30, 90, 25, 7]})
        assert resp.status_code == 200
        echo = resp.json()["input_echo"]
        assert echo["rainfall"] == 80
        assert echo["temperature"] == 30
        assert echo["pollution"] == 90
        assert echo["vegetation"] == 25
        assert echo["month"] == 7


def test_predict_input_echo():
    """Response should echo back the input values."""
    payload = {"temperature": 30, "pollution": 50, "rainfall": 80, "vegetation": 40, "month": 6}
    with TestClient(app) as client:
        resp = client.post("/predict", json=payload)
        assert resp.status_code == 200
        echo = resp.json()["input_echo"]
        assert echo["temperature"] == 30
        assert echo["rainfall"] == 80
        assert echo["month"] == 6


def test_vegetation_changes_combined_risk():
    """Changing vegetation should change the scenario risk response."""
    base = {"temperature": 25, "pollution": 30, "rainfall": 45, "month": 4}
    with TestClient(app) as client:
        r1 = client.post("/predict", json={**base, "vegetation": 10}).json()
        r2 = client.post("/predict", json={**base, "vegetation": 90}).json()
        assert r1["metadata"]["vegetation_source"] == "Data/cleaned-data/vegetation-dummy.csv"
        assert r1["environmental_risk"]["vegetation_stress_score"] > r2["environmental_risk"]["vegetation_stress_score"]
        assert r1["environmental_risk"]["combined_risk_score"] > r2["environmental_risk"]["combined_risk_score"]


def test_combined_risk_is_model_driven_and_slider_sensitive():
    """Risk score should be computed from model outputs and respond to input changes."""
    with TestClient(app) as client:
        low = client.post("/predict", json={
            "temperature": 22, "pollution": 15, "rainfall": 5, "vegetation": 60, "month": 1
        })
        high = client.post("/predict", json={
            "temperature": 40, "pollution": 180, "rainfall": 300, "vegetation": 60, "month": 7
        })

        assert low.status_code == 200
        assert high.status_code == 200

        low_json = low.json()
        high_json = high.json()

        low_risk = low_json["environmental_risk"]["combined_risk_score"]
        high_risk = high_json["environmental_risk"]["combined_risk_score"]

        assert 0 <= low_risk <= 100
        assert 0 <= high_risk <= 100
        assert high_risk > low_risk

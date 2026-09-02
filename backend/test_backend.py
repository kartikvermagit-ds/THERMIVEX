from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("PASS: /health")

        # 2. Facilities
        res = client.get("/api/v1/facilities")
        assert res.status_code == 200, f"Facilities failed: {res.text}"
        data = res.json()
        assert len(data.get("features", [])) > 0, "No facilities found"
        print(f"PASS: /api/v1/facilities (Loaded {len(data['features'])} industrial facilities)")

        # 3. Incidents feed
        res = client.get("/api/v1/incidents/feed")
        assert res.status_code == 200, f"Incidents feed failed: {res.text}"
        feed = res.json()
        assert len(feed.get("features", [])) > 0, "No initial incidents in feed"
        first_id = feed["features"][0]["properties"]["id"]
        print(f"PASS: /api/v1/incidents/feed (Retrieved {len(feed['features'])} incidents, top incident: {first_id})")

        # 4. Investigate dossier
        res = client.get(f"/api/v1/incidents/{first_id}/investigate")
        assert res.status_code == 200, f"Investigate failed: {res.text}"
        dossier = res.json()
        assert "explainability_tree_shap" in dossier, "TreeSHAP explainability missing"
        print(f"PASS: /api/v1/incidents/{first_id}/investigate (TreeSHAP factors: {len(dossier['explainability_tree_shap'])})")

        # 5. Simulate scenario
        res = client.post("/api/v1/pipeline/simulate/dahej_chemical_explosion")
        assert res.status_code == 201, f"Simulation failed: {res.text}"
        sim_res = res.json()
        assert sim_res["severity"] == "CRITICAL", f"Expected CRITICAL, got {sim_res['severity']}"
        assert sim_res["risk_score"] >= 90, f"Expected risk >= 90, got {sim_res['risk_score']}"
        print(f"PASS: /api/v1/pipeline/simulate (Dahej Explosion classified as {sim_res['classification']} with Risk {sim_res['risk_score']})")

        # 6. Dispatch alert
        res = client.post("/api/v1/alerts/dispatch", json={
            "incident_id": sim_res["incident_id"],
            "recipient": "DAHEJ_FIRE_CONTROL_ROOM",
            "channel": "TELEGRAM_BOT"
        })
        assert res.status_code == 202, f"Alert dispatch failed: {res.text}"
        print("PASS: /api/v1/alerts/dispatch (Emergency dispatch logged)")

        # 7. Dossier Report JSON
        res = client.get(f"/api/v1/reports/dossier/{sim_res['incident_id']}/json")
        assert res.status_code == 200, f"Report JSON failed: {res.text}"
        print("PASS: /api/v1/reports/dossier/json")

    print("\nALL BACKEND API TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()

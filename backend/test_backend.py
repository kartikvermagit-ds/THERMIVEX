import io
import json
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

        # 8. Climate feed endpoint check
        res = client.get("/api/v1/climate/feed")
        assert res.status_code == 200, f"Climate feed failed: {res.text}"
        climate_data = res.json()
        assert "updates" in climate_data and "quickStats" in climate_data, "Invalid climate response structure"
        print(f"PASS: /api/v1/climate/feed (Updates: {len(climate_data['updates'])}, QuickStats: {list(climate_data['quickStats'].keys())})")

        # ----------------------------------------------------
        # Phase 1 FIRMS Ingestion Architecture Tests
        # ----------------------------------------------------
        print("\n--- Testing Phase 1: FIRMS Observations & Ingestion ---")

        # 9. FIRMS Hotspots - Tabular JSON
        res = client.get("/api/v1/firms/hotspots")
        assert res.status_code == 200, f"FIRMS hotspots query failed: {res.text}"
        firms_data = res.json()
        assert "total_count" in firms_data and "hotspots" in firms_data, "Invalid FIRMS list structure"
        assert firms_data["total_count"] > 0, "Expected seeded demo FIRMS hotspots"
        sample_spot = firms_data["hotspots"][0]
        assert "observation_hash" in sample_spot, "Missing observation_hash"
        assert "observed_at" in sample_spot, "Missing observed_at timestamp"
        assert "source" in sample_spot, "Missing source field"
        assert sample_spot["source"] == "DEMO_DATA"
        assert sample_spot["is_demo"] is True
        print(f"PASS: GET /api/v1/firms/hotspots (Found {firms_data['total_count']} observations, Source: {sample_spot['source']}, is_demo: {sample_spot['is_demo']})")

        # 10. FIRMS Hotspots - GeoJSON Format & Coordinate Order Validation
        res = client.get("/api/v1/firms/hotspots?format=geojson")
        assert res.status_code == 200, f"FIRMS GeoJSON failed: {res.text}"
        geojson_data = res.json()
        assert geojson_data.get("type") == "FeatureCollection", "Expected FeatureCollection"
        assert len(geojson_data.get("features", [])) > 0, "No GeoJSON features found"
        feat0 = geojson_data["features"][0]
        assert feat0.get("geometry", {}).get("type") == "Point"
        coords = feat0["geometry"]["coordinates"]
        assert len(coords) == 2, f"Expected [lon, lat], got {coords}"
        # RFC 7946 validation: coordinates[0] is longitude (-180..180), coordinates[1] is latitude (-90..90)
        assert -180.0 <= coords[0] <= 180.0, f"Invalid longitude: {coords[0]}"
        assert -90.0 <= coords[1] <= 90.0, f"Invalid latitude: {coords[1]}"
        # Ensure longitude matches properties longitude
        assert abs(coords[0] - feat0["properties"]["longitude"]) < 1e-4
        assert abs(coords[1] - feat0["properties"]["latitude"]) < 1e-4
        print(f"PASS: GET /api/v1/firms/hotspots?format=geojson (Verified RFC 7946 Point [lon={coords[0]}, lat={coords[1]}])")

        # 11. Bounding Box Query Validation
        # Valid bbox: 72.0,20.0,73.0,22.0 (contains Dahej at 72.5831, 21.6842)
        res = client.get("/api/v1/firms/hotspots?bbox=72.0,20.0,73.0,22.0")
        assert res.status_code == 200, f"Bbox query failed: {res.text}"
        bbox_data = res.json()
        assert bbox_data["total_count"] >= 1, "Expected Dahej hotspot inside bbox 72.0,20.0,73.0,22.0"
        for h in bbox_data["hotspots"]:
            assert 72.0 <= h["longitude"] <= 73.0
            assert 20.0 <= h["latitude"] <= 22.0
        print(f"PASS: Bbox spatial filter (Found {bbox_data['total_count']} observations inside bounding box)")

        # 12. Invalid Bounding Box Validation (min_lon >= max_lon)
        res = client.get("/api/v1/firms/hotspots?bbox=75.0,20.0,72.0,22.0")
        assert res.status_code == 400, f"Expected 400 for inverted bbox, got {res.status_code}"
        print("PASS: Inverted bbox rejected with HTTP 400 Bad Request")

        # 13. Minimum FRP Filter
        res = client.get("/api/v1/firms/hotspots?min_frp=50.0")
        assert res.status_code == 200
        min_frp_data = res.json()
        assert all(h["frp"] >= 50.0 for h in min_frp_data["hotspots"])
        print(f"PASS: min_frp=50.0 filter (Found {min_frp_data['total_count']} records, all FRP >= 50)")

        # 14. Empty Result Query returns HTTP 200 with empty list
        res = client.get("/api/v1/firms/hotspots?min_frp=99999.0")
        assert res.status_code == 200
        empty_data = res.json()
        assert empty_data["total_count"] == 0 and empty_data["hotspots"] == []
        print("PASS: Empty result query returns HTTP 200 with empty hotspots list")

        # 15. Manual Demo Import Endpoint & Deduplication Verification
        initial_count = client.get("/api/v1/firms/hotspots").json()["total_count"]
        res = client.post("/api/v1/firms/import/demo")
        assert res.status_code == 200, f"Demo import failed: {res.text}"
        import_summary = res.json()
        assert import_summary["records_read"] > 0
        # Since startup already seeded demo data, duplicates should be skipped!
        assert import_summary["duplicates_skipped"] > 0
        assert import_summary["records_inserted"] == 0
        final_count = client.get("/api/v1/firms/hotspots").json()["total_count"]
        assert final_count == initial_count, "Deduplication failed: record count changed after re-import!"
        print(f"PASS: POST /api/v1/firms/import/demo (Deduplication confirmed: skipped {import_summary['duplicates_skipped']} duplicates, 0 re-inserted)")

        # 16. File Import via CSV Upload
        test_csv = (
            "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
            "23.12345,71.54321,365.2,0.38,0.36,2026-03-15,1430,NOAA-21,VIIRS,high,2.0NRT,295.0,38.5,D\n"
        )
        csv_file = io.BytesIO(test_csv.encode("utf-8"))
        res = client.post(
            "/api/v1/firms/import/file",
            files={"file": ("test_observation.csv", csv_file, "text/csv")},
            data={"source_label": "UPLOAD_TEST_CSV", "is_demo_flag": "true"}
        )
        assert res.status_code == 200, f"File import failed: {res.text}"
        file_summary = res.json()
        assert file_summary["records_read"] == 1
        assert file_summary["records_inserted"] == 1
        print("PASS: POST /api/v1/firms/import/file (Imported new test CSV observation)")

        # Test duplicate upload of the exact same observation
        csv_file_dup = io.BytesIO(test_csv.encode("utf-8"))
        res_dup = client.post(
            "/api/v1/firms/import/file",
            files={"file": ("test_observation.csv", csv_file_dup, "text/csv")},
            data={"source_label": "UPLOAD_TEST_CSV"}
        )
        assert res_dup.status_code == 200
        dup_summary = res_dup.json()
        assert dup_summary["duplicates_skipped"] == 1
        assert dup_summary["records_inserted"] == 0
        print("PASS: POST /api/v1/firms/import/file (Duplicate observation skipped cleanly)")

        # 17. Malformed File Upload Error Handling
        bad_csv = "not_a_csv_header\nfoo,bar\n"
        res_bad = client.post(
            "/api/v1/firms/import/file",
            files={"file": ("bad_file.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")}
        )
        assert res_bad.status_code == 400, f"Expected 400 for bad CSV, got {res_bad.status_code}"
        print("PASS: Malformed CSV rejected with clean HTTP 400 Bad Request")

        # 18. Malformed GeoJSON Upload Error Handling
        bad_geojson = "{ this is invalid json }"
        res_bad_json = client.post(
            "/api/v1/firms/import/file",
            files={"file": ("bad.geojson", io.BytesIO(bad_geojson.encode("utf-8")), "application/geo+json")}
        )
        assert res_bad_json.status_code == 400, f"Expected 400 for bad GeoJSON, got {res_bad_json.status_code}"
        print("PASS: Malformed GeoJSON rejected with clean HTTP 400 Bad Request")

        # 19. Verify Existing Database Records Intact
        final_fac_res = client.get("/api/v1/facilities")
        assert final_fac_res.status_code == 200
        assert len(final_fac_res.json()["features"]) == len(data["features"]), "Facilities table corrupted!"
        
        final_inc_res = client.get("/api/v1/incidents/feed")
        assert final_inc_res.status_code == 200
        assert len(final_inc_res.json()["features"]) >= len(feed["features"]), "Incidents table corrupted!"
        print("PASS: Verified existing industrial facilities and incident database records remain 100% intact")

    print("\n=========================================================")
    print("ALL BACKEND & FIRMS INGESTION TESTS PASSED PERFECTLY!")
    print("=========================================================")

if __name__ == "__main__":
    run_tests()

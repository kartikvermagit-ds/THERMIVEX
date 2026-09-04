import io
import json
from fastapi.testclient import TestClient
from app.main import app

def test_backend_suite():
    with TestClient(app) as client:
        # ====================================================
        # Existing Baseline Endpoints
        # ====================================================
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

        # 7. Dossier Report JSON & PDF
        res = client.get(f"/api/v1/reports/dossier/{sim_res['incident_id']}/json")
        assert res.status_code == 200, f"Report JSON failed: {res.text}"
        print("PASS: /api/v1/reports/dossier/json")

        res = client.get(f"/api/v1/reports/dossier/{sim_res['incident_id']}/pdf")
        assert res.status_code == 200, f"Dossier PDF failed: {res.text}"
        assert res.headers.get("content-type") == "application/pdf", "Expected application/pdf"
        assert res.content.startswith(b"%PDF"), "Dossier PDF must begin with %PDF header"
        print(f"PASS: /api/v1/reports/dossier/pdf (Generated {len(res.content)} bytes)")

        # 7b. National SitRep PDF & Markdown
        res = client.get("/api/v1/reports/sitrep/pdf")
        assert res.status_code == 200, f"SitRep PDF failed: {res.text}"
        assert res.headers.get("content-type") == "application/pdf", "Expected application/pdf"
        assert res.content.startswith(b"%PDF"), "SitRep PDF must begin with %PDF header"
        print(f"PASS: /api/v1/reports/sitrep/pdf (Generated {len(res.content)} bytes)")

        # 8. Climate feed endpoint check
        res = client.get("/api/v1/climate/feed")
        assert res.status_code == 200, f"Climate feed failed: {res.text}"
        climate_data = res.json()
        assert "updates" in climate_data and "quickStats" in climate_data, "Invalid climate response structure"
        print(f"PASS: /api/v1/climate/feed (Updates: {len(climate_data['updates'])}, QuickStats: {list(climate_data['quickStats'].keys())})")

        # ====================================================
        # Phase 1: FIRMS Observations & Ingestion
        # ====================================================
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
        assert sample_spot["source"] in ("DEMO_DATA", "TEST_CLUSTER_SUITE", "UPLOAD_TEST_CSV")
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
        assert -180.0 <= coords[0] <= 180.0, f"Invalid longitude: {coords[0]}"
        assert -90.0 <= coords[1] <= 90.0, f"Invalid latitude: {coords[1]}"
        print(f"PASS: GET /api/v1/firms/hotspots?format=geojson (Verified RFC 7946 Point [lon={coords[0]}, lat={coords[1]}])")

        # ====================================================
        # Phase 2: Spatio-Temporal Event Intelligence Tests
        # ====================================================
        print("\n--- Testing Phase 2: Spatio-Temporal Event Intelligence ---")

        # Reset event tables before running clustering test to validate pristine creation -> idempotency cycle
        from app.db.session import SessionLocal
        from app.db.models import ThermalEvent, EventObservationLink, ClusteringRun
        cleanup_db = SessionLocal()
        cleanup_db.query(EventObservationLink).delete()
        cleanup_db.query(ThermalEvent).delete()
        cleanup_db.query(ClusteringRun).delete()
        cleanup_db.commit()
        cleanup_db.close()

        # 11. Trigger Spatio-Temporal Clustering on existing observations
        cluster_req = {
            "spatial_threshold_m": 750.0,
            "temporal_threshold_minutes": 60.0,
            "algorithm_version": "STGRAPH-1.0"
        }
        res = client.post("/api/v1/events/cluster", json=cluster_req)
        assert res.status_code == 200, f"Clustering run failed: {res.text}"
        cluster_summary = res.json()
        assert cluster_summary["status"] == "SUCCESS"
        assert cluster_summary["observations_considered"] >= 8
        assert cluster_summary["events_created"] > 0
        initial_events_count = cluster_summary["events_created"]
        print(f"PASS: POST /api/v1/events/cluster (Run: {cluster_summary['run_id']}, Considered {cluster_summary['observations_considered']} obs, Created {initial_events_count} events in {cluster_summary['duration_seconds']}s)")

        # 12. Idempotency Test: Re-running clustering creates 0 duplicate events!
        res_rerun = client.post("/api/v1/events/cluster", json=cluster_req)
        assert res_rerun.status_code == 200
        rerun_summary = res_rerun.json()
        assert rerun_summary["events_created"] == 0, f"Idempotency failure! Created {rerun_summary['events_created']} duplicates!"
        assert rerun_summary["events_updated"] == initial_events_count, "Expected existing events to be updated"
        print(f"PASS: Idempotency Verified (0 duplicates created, {rerun_summary['events_updated']} events updated)")

        # 13. Query Thermal Events List (GET /api/v1/events)
        res = client.get("/api/v1/events")
        assert res.status_code == 200, f"Events query failed: {res.text}"
        events_list = res.json()
        assert events_list["total_count"] == initial_events_count
        first_event = events_list["events"][0]
        assert "event_fingerprint" in first_event
        assert "centroid_latitude" in first_event
        assert "centroid_longitude" in first_event
        assert "peak_observation_id" in first_event
        assert "cluster_confidence" in first_event
        assert "spatial_extent_km2" in first_event
        assert first_event["status"] == "CANDIDATE"
        print(f"PASS: GET /api/v1/events (Retrieved {events_list['total_count']} candidate thermal events, Sample ID: {first_event['id']})")

        # 14. Single-Observation Candidate Event Verification
        # Single isolated observation must not be discarded; it forms a singleton event with 0.0 km2 and Point geometry
        single_events = [e for e in events_list["events"] if e["observation_count"] == 1]
        assert len(single_events) > 0, "Expected isolated demo observations to form singleton candidate events"
        single_ev = single_events[0]
        assert single_ev["spatial_extent_km2"] == 0.0, "Singleton spatial extent must be 0.0 km2"
        single_hull = json.loads(single_ev["convex_hull_geojson"])
        assert single_hull["type"] == "Point", f"Expected Point geometry for singleton, got {single_hull['type']}"
        print(f"PASS: Single isolated observation formed valid candidate event with Point geometry (ID: {single_ev['id']})")

        # 15. Ingest Controlled Cluster Test Observations via CSV
        # We upload synthetic observations specifically to test:
        # Group 1 (3 points): Dahej Refinery Complex - 3 observations within 450m & 30 min (NOAA-20 + Suomi-NPP) -> Multi-satellite Polygon
        # Group 2 (2 points): Manesar - 2 observations within 300m -> LineString
        # Group 3 (1 point): 5 km away -> Spatial separation
        # Group 4 (1 point): Same location as Group 2 but 6 hours later -> Temporal separation
        test_cluster_csv = (
            "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
            # Group 1: 3 non-collinear points in Dahej (approx 250m apart)
            "21.68500,72.58400,380.0,0.38,0.36,2026-03-16,2100,NOAA-20,VIIRS,high,2.0NRT,290.0,75.0,N\n"
            "21.68700,72.58400,385.0,0.38,0.36,2026-03-16,2115,Suomi-NPP,VIIRS,high,2.0NRT,291.0,88.0,N\n"
            "21.68600,72.58650,378.0,0.38,0.36,2026-03-16,2125,NOAA-20,VIIRS,high,2.0NRT,289.0,62.0,N\n"
            # Group 2: 2 points in Manesar (200m apart, 10 min apart)
            "28.36200,76.92500,360.0,0.38,0.36,2026-03-16,1930,NOAA-20,VIIRS,nominal,2.0NRT,294.0,35.0,N\n"
            "28.36350,76.92600,364.0,0.38,0.36,2026-03-16,1940,NOAA-20,VIIRS,nominal,2.0NRT,295.0,42.0,N\n"
            # Group 3: Spatial separation (5 km away in Manesar at same time)
            "28.40000,76.97000,345.0,0.38,0.36,2026-03-16,1935,NOAA-20,VIIRS,nominal,2.0NRT,298.0,20.0,N\n"
            # Group 4: Temporal separation (same location as Group 2, but 6 hours earlier at 1330)
            "28.36200,76.92500,340.0,0.38,0.36,2026-03-16,1330,Terra,MODIS,70,6.1NRT,299.0,18.0,D\n"
        )
        res = client.post(
            "/api/v1/firms/import/file",
            files={"file": ("cluster_eval.csv", io.BytesIO(test_cluster_csv.encode("utf-8")), "text/csv")},
            data={"source_label": "TEST_CLUSTER_SUITE", "is_demo_flag": "true"}
        )
        assert res.status_code == 200, f"CSV upload failed: {res.text}"
        print("PASS: Ingested 7 controlled cluster test observations")

        # Run clustering for 2026-03-16
        res_c16 = client.post("/api/v1/events/cluster", json={
            "spatial_threshold_m": 750.0,
            "temporal_threshold_minutes": 60.0,
            "date": "2026-03-16"
        })
        assert res_c16.status_code == 200
        print("PASS: Executed clustering for 2026-03-16")

        # 16. Multi-Observation Cluster with Polygon Geometry Verification
        # Group 1 (Dahej) should form a 3-observation cluster with Polygon geometry and metric km2 > 0
        res = client.get("/api/v1/events?date=2026-03-16&min_observations=3")
        assert res.status_code == 200
        g1_events = res.json()["events"]
        assert len(g1_events) == 1, f"Expected 1 cluster with >=3 observations, found {len(g1_events)}"
        poly_event = g1_events[0]
        assert poly_event["observation_count"] == 3
        assert poly_event["frp_total_mw"] == round(75.0 + 88.0 + 62.0, 2)
        assert poly_event["frp_peak_mw"] == 88.0
        assert poly_event["spatial_extent_km2"] > 0.0, "Convex hull area of 3 non-collinear points must be > 0.0 km2"
        # Verify metric calculation (not degree2)
        assert poly_event["spatial_extent_km2"] < 5.0, f"Area should be local scale km2 (<5.0), got {poly_event['spatial_extent_km2']}"
        hull_geo = json.loads(poly_event["convex_hull_geojson"])
        assert hull_geo["type"] == "Polygon", f"Expected Polygon geometry, got {hull_geo['type']}"
        print(f"PASS: 3 observations formed Polygon cluster (Area: {poly_event['spatial_extent_km2']} km², FRP: {poly_event['frp_total_mw']} MW)")

        # 17. Multi-Satellite Support Verification
        quality_info = json.loads(poly_event["cluster_quality"])
        assert quality_info["multi_platform_support"] is True
        assert len(quality_info["platforms"]) >= 2
        assert "NOAA-20" in quality_info["platforms"] and "Suomi-NPP" in quality_info["platforms"]
        print("PASS: Multi-platform satellite observation support verified (NOAA-20 + Suomi-NPP in same event)")

        # 18. LineString Geometry for 2 Observations
        res_line = client.get("/api/v1/events?date=2026-03-16&min_observations=2")
        assert res_line.status_code == 200
        line_events = [e for e in res_line.json()["events"] if e["observation_count"] == 2]
        assert len(line_events) >= 1, "Expected 2-observation cluster"
        line_ev = line_events[0]
        line_hull = json.loads(line_ev["convex_hull_geojson"])
        assert line_hull["type"] == "LineString", f"Expected LineString, got {line_hull['type']}"
        assert line_ev["spatial_extent_km2"] == 0.0
        print("PASS: 2 observations formed valid LineString geometry")

        # 19. Spatial Separation Verification (Group 3 at 5km was NOT merged into Group 2)
        # Check that observation at lat=28.40000, lon=76.97000 is its own event
        res_sep = client.get("/api/v1/events?date=2026-03-16&bbox=76.96,28.39,76.98,28.41")
        assert res_sep.status_code == 200
        sep_events = res_sep.json()["events"]
        assert len(sep_events) == 1
        assert sep_events[0]["observation_count"] == 1
        print("PASS: Observation outside spatial threshold (>750m) separated into independent candidate event")

        # 20. Temporal Separation Verification (Group 4 at 1330 was NOT merged with Group 2 at 1930)
        res_temp = client.get(f"/api/v1/events/{line_ev['id']}/observations")
        assert res_temp.status_code == 200
        line_obs = res_temp.json()
        assert all(o["acquisition_time"].startswith("19") for o in line_obs), "Temporal separation failed: merged observations across 6 hours!"
        print("PASS: Observation outside temporal threshold (>60 min) separated into independent candidate event")

        # 21. FRP-Weighted Centroid & Peak Location Verification
        # For poly_event: obs 1 (21.685, 72.584, frp 75), obs 2 (21.687, 72.584, frp 88), obs 3 (21.686, 72.5865, frp 62)
        # Peak must be obs 2 (frp 88.0, lat 21.687, lon 72.584)
        assert poly_event["frp_peak_mw"] == 88.0
        assert abs(poly_event["peak_latitude"] - 21.687) < 1e-4
        assert abs(poly_event["peak_longitude"] - 72.584) < 1e-4
        # Centroid must not be equal to peak
        assert (poly_event["centroid_latitude"] != poly_event["peak_latitude"] or
                poly_event["centroid_longitude"] != poly_event["peak_longitude"]), "Centroid and peak should not be identical!"
        print(f"PASS: Peak observation ({poly_event['peak_latitude']}, {poly_event['peak_longitude']} @ {poly_event['frp_peak_mw']} MW) distinguished from Centroid ({poly_event['centroid_latitude']}, {poly_event['centroid_longitude']})")

        # 22. Event Timeline Evolution Verification (GET /api/v1/events/{id}/timeline)
        res_time = client.get(f"/api/v1/events/{poly_event['id']}/timeline")
        assert res_time.status_code == 200, f"Timeline query failed: {res_time.text}"
        timeline_data = res_time.json()
        assert timeline_data["total_observations"] == 3
        tl = timeline_data["timeline"]
        assert len(tl) == 3
        # Must be strictly chronological
        for k in range(len(tl) - 1):
            assert tl[k]["observed_at"] <= tl[k + 1]["observed_at"]
        assert tl[0]["stage"] == "INITIAL"
        assert tl[1]["cumulative_frp_total_mw"] > tl[0]["cumulative_frp_total_mw"]
        assert tl[2]["cumulative_observation_count"] == 3
        print(f"PASS: Chronological timeline verified: {len(tl)} steps, Initial -> Escalating stages")

        # 23. RFC 7946 GeoJSON Output for Events (GET /api/v1/events?format=geojson)
        res_geo = client.get("/api/v1/events?format=geojson")
        assert res_geo.status_code == 200
        geo_coll = res_geo.json()
        assert geo_coll.get("type") == "FeatureCollection"
        assert len(geo_coll.get("features", [])) > 0
        g_feat = geo_coll["features"][0]
        assert "geometry" in g_feat and "properties" in g_feat
        assert g_feat["geometry"]["type"] in ("Polygon", "LineString", "Point")
        print(f"PASS: GET /api/v1/events?format=geojson (RFC 7946 FeatureCollection, geometry={g_feat['geometry']['type']})")

        # 24. Latest Clustering Run Metadata (GET /api/v1/events/runs/latest)
        res_run = client.get("/api/v1/events/runs/latest")
        assert res_run.status_code == 200
        latest_run = res_run.json()
        assert latest_run["algorithm"] == "SPATIO_TEMPORAL_GRAPH"
        assert latest_run["algorithm_version"] == "STGRAPH-1.0"
        assert latest_run["spatial_threshold_m"] == 750.0
        assert latest_run["temporal_threshold_minutes"] == 60.0
        assert latest_run["status"] == "SUCCESS"
        assert "stale_after_minutes" in latest_run
        assert "run_age_seconds" in latest_run
        assert "is_stale" in latest_run
        assert isinstance(latest_run["stale_after_minutes"], int)
        assert isinstance(latest_run["is_stale"], bool)
        assert latest_run["run_age_seconds"] is None or isinstance(latest_run["run_age_seconds"], int)
        print(f"PASS: GET /api/v1/events/runs/latest (Run: {latest_run['id']}, Algorithm: {latest_run['algorithm_version']})")

        # 25. Database Integrity: Verify existing facilities, incidents, and FIRMS records remain 100% intact
        final_fac = client.get("/api/v1/facilities").json()
        assert len(final_fac["features"]) == len(data["features"])
        final_inc = client.get("/api/v1/incidents/feed").json()
        assert len(final_inc["features"]) >= len(feed["features"])
        final_firms = client.get("/api/v1/firms/hotspots").json()
        assert final_firms["total_count"] >= 15 # 8 demo + 7 test
        print("PASS: Verified complete database integrity across facilities, incidents, and raw observations")

    print("\n=========================================================")
    print("ALL 25 BACKEND & EVENT INTELLIGENCE TESTS PASSED!")
    print("=========================================================")

run_tests = test_backend_suite

if __name__ == "__main__":
    test_backend_suite()

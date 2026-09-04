import math
import json
import uuid
import hashlib
import statistics
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional, Set
import networkx as nx
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.logging import logger
from app.db.models import FirmsHotspot, ThermalEvent, EventObservationLink, ClusteringRun
from app.services.osm_service import haversine_distance_meters
from app.schemas.event_schemas import (
    EventClusterSummary,
    EventTimelineItem,
    EventTimelineResponse
)

def compute_local_metric_coordinates(
    points: List[Tuple[float, float]], # (lat, lon)
    origin_lat: float,
    origin_lon: float
) -> List[Tuple[float, float]]: # (x_meters, y_meters)
    """
    Projects WGS84 (lat, lon) coordinates onto a local metric tangent plane
    centered at (origin_lat, origin_lon) using an equidistant azimuthal projection.
    Avoids distorted degree-squared area calculations.
    """
    R = 6371000.0 # Earth radius in meters
    origin_lat_rad = math.radians(origin_lat)
    origin_lon_rad = math.radians(origin_lon)

    local_coords = []
    for lat, lon in points:
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)

        x = (lon_rad - origin_lon_rad) * math.cos(origin_lat_rad) * R
        y = (lat_rad - origin_lat_rad) * R
        local_coords.append((x, y))

    return local_coords

def monotone_chain_convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Andrew's Monotone Chain algorithm to compute the 2D convex hull of a set of 2D points in O(n log n).
    Returns hull vertices in counter-clockwise order.
    """
    # Remove duplicates and sort primarily by x, then by y
    unique_pts = sorted(list(set(points)), key=lambda p: (p[0], p[1]))
    if len(unique_pts) <= 2:
        return unique_pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    # Lower hull
    lower = []
    for p in unique_pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    # Upper hull
    upper = []
    for p in reversed(unique_pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    # Concatenate lower and upper hulls (last point of each is first of other)
    return lower[:-1] + upper[:-1]

def calculate_polygon_metric_area_km2(metric_vertices: List[Tuple[float, float]]) -> float:
    """
    Calculates the planar metric area in km² using the Shoelace formula on local metric coordinates.
    """
    n = len(metric_vertices)
    if n < 3:
        return 0.0

    area_m2 = 0.0
    for i in range(n):
        j = (i + 1) % n
        area_m2 += metric_vertices[i][0] * metric_vertices[j][1]
        area_m2 -= metric_vertices[j][0] * metric_vertices[i][1]

    area_m2 = abs(area_m2) / 2.0
    area_km2 = area_m2 / 1_000_000.0
    return round(area_km2, 4)

def generate_cluster_geometry(
    hotspots: List[FirmsHotspot],
    centroid_lat: float,
    centroid_lon: float
) -> Tuple[Optional[str], Optional[str], float]:
    """
    Generates convex hull GeoJSON, bounding box GeoJSON, and spatial extent in km².
    - 1 observation: Point geometry (0.0 km²)
    - 2 observations: LineString geometry (0.0 km²)
    - >=3 observations: Polygon convex hull (metric km² via local tangent plane projection)
    Returns: (convex_hull_geojson, bounding_box_geojson, spatial_extent_km2)
    """
    n = len(hotspots)
    if n == 0:
        return None, None, 0.0

    # Calculate Bounding Box
    all_lats = [h.latitude for h in hotspots]
    all_lons = [h.longitude for h in hotspots]
    min_lat, max_lat = min(all_lats), max(all_lats)
    min_lon, max_lon = min(all_lons), max(all_lons)

    # GeoJSON coordinates order: [longitude, latitude]
    bbox_coords = [
        [round(min_lon, 5), round(min_lat, 5)],
        [round(max_lon, 5), round(min_lat, 5)],
        [round(max_lon, 5), round(max_lat, 5)],
        [round(min_lon, 5), round(max_lat, 5)],
        [round(min_lon, 5), round(min_lat, 5)]
    ]
    bounding_box_geojson = json.dumps({"type": "Polygon", "coordinates": [bbox_coords]})

    if n == 1:
        h = hotspots[0]
        hull_geojson = json.dumps({
            "type": "Point",
            "coordinates": [round(h.longitude, 5), round(h.latitude, 5)]
        })
        return hull_geojson, bounding_box_geojson, 0.0

    if n == 2:
        h1, h2 = hotspots[0], hotspots[1]
        hull_geojson = json.dumps({
            "type": "LineString",
            "coordinates": [
                [round(h1.longitude, 5), round(h1.latitude, 5)],
                [round(h2.longitude, 5), round(h2.latitude, 5)]
            ]
        })
        return hull_geojson, bounding_box_geojson, 0.0

    # 3 or more observations: Compute convex hull
    # Project to local metric plane centered at cluster centroid
    pts_geo = [(h.latitude, h.longitude) for h in hotspots]
    pts_metric = compute_local_metric_coordinates(pts_geo, centroid_lat, centroid_lon)

    metric_hull = monotone_chain_convex_hull(pts_metric)
    area_km2 = calculate_polygon_metric_area_km2(metric_hull)

    if len(metric_hull) < 3:
        # Collinear observations
        coords = [[round(h.longitude, 5), round(h.latitude, 5)] for h in hotspots]
        hull_geojson = json.dumps({"type": "LineString", "coordinates": coords})
        return hull_geojson, bounding_box_geojson, 0.0

    # Convert metric hull vertices back to WGS84 for GeoJSON output
    R = 6371000.0
    origin_lat_rad = math.radians(centroid_lat)
    origin_lon_rad = math.radians(centroid_lon)

    hull_wgs84 = []
    for x, y in metric_hull:
        lat_rad = origin_lat_rad + (y / R)
        lon_rad = origin_lon_rad + (x / (R * math.cos(origin_lat_rad)))
        hull_wgs84.append([round(math.degrees(lon_rad), 5), round(math.degrees(lat_rad), 5)])

    # Close polygon ring
    if hull_wgs84[0] != hull_wgs84[-1]:
        hull_wgs84.append(hull_wgs84[0])

    hull_geojson = json.dumps({"type": "Polygon", "coordinates": [hull_wgs84]})
    return hull_geojson, bounding_box_geojson, area_km2

def calculate_cluster_confidence(
    hotspots: List[FirmsHotspot],
    spatial_extent_km2: float,
    duration_minutes: float
) -> Tuple[float, str]:
    """
    Computes cluster confidence (0-100) representing quality and coherence of the spatial-temporal cluster.
    THIS IS NOT FIRE CONFIDENCE. It is Cluster Quality/Coherence.
    Returns: (confidence_score, quality_json_str)
    """
    count = len(hotspots)
    platforms = sorted(list(set(h.satellite for h in hotspots)))
    instruments = sorted(list(set(h.instrument for h in hotspots)))

    # 1. Base confidence
    score = 50.0

    # 2. Observation count bonus: up to +25
    obs_bonus = min(25.0, (count - 1) * 8.0)
    score += obs_bonus

    # 3. Multi-platform satellite support: +15
    if len(platforms) >= 2:
        score += 15.0

    # 4. Temporal coherence bonus: +10 if observed within 45 minutes
    if count >= 2 and duration_minutes <= 45.0:
        score += 10.0

    # 5. Sensor detection confidence: +5 if high confidence flag present
    if any(str(h.confidence).lower() in ("h", "high", "100", "90") for h in hotspots):
        score += 5.0

    # Spatial Compactness assessment
    if spatial_extent_km2 <= 0.4:
        compactness = "HIGH"
    elif spatial_extent_km2 <= 1.5:
        compactness = "MEDIUM"
    else:
        compactness = "EXPANDED"

    # Temporal Coherence assessment
    if duration_minutes <= 30.0:
        coherence = "HIGH"
    elif duration_minutes <= 60.0:
        coherence = "MEDIUM"
    else:
        coherence = "SPANNED"

    score = max(40.0, min(98.0, round(score, 1)))

    quality_dict = {
        "cluster_confidence": score,
        "platforms": platforms,
        "platform_count": len(platforms),
        "instruments": instruments,
        "spatial_compactness": compactness,
        "temporal_coherence": coherence,
        "multi_platform_support": len(platforms) >= 2,
        "description": "Multi-platform satellite observation support" if len(platforms) >= 2 else "Single-platform observation cluster"
    }

    return score, json.dumps(quality_dict)

def run_spatio_temporal_clustering(
    db: Session,
    spatial_threshold_m: float = 750.0,
    temporal_threshold_minutes: float = 60.0,
    date_filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    is_demo_filter: Optional[bool] = None,
    algorithm_version: str = "STGRAPH-1.0"
) -> EventClusterSummary:
    """
    Executes spatio-temporal graph clustering on FIRMS observations.
    Builds an undirected graph where edges satisfy:
      haversine_distance(u, v) <= spatial_threshold_m
      AND
      abs(u.observed_at - v.observed_at) <= temporal_threshold_minutes

    Connected components form candidate thermal events.
    Controls spatial chain-expansion. Retains singletons.
    Idempotent: updates existing events if exact observation set was previously clustered.
    """
    start_time = datetime.now(timezone.utc).replace(tzinfo=None)
    run_id = f"RUN-{start_time.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # 1. Fetch eligible FIRMS observations
    query = db.query(FirmsHotspot)
    if date_filter:
        clean_date = date_filter.strip().replace("/", "-")
        query = query.filter(FirmsHotspot.acquisition_date == clean_date)
    if start_date:
        clean_s = start_date.strip().replace("/", "-")
        query = query.filter(FirmsHotspot.acquisition_date >= clean_s)
    if end_date:
        clean_e = end_date.strip().replace("/", "-")
        query = query.filter(FirmsHotspot.acquisition_date <= clean_e)
    if is_demo_filter is not None:
        query = query.filter(FirmsHotspot.is_demo == is_demo_filter)

    observations = query.order_by(FirmsHotspot.observed_at).all()
    n_obs = len(observations)

    clustering_run = ClusteringRun(
        id=run_id,
        algorithm="SPATIO_TEMPORAL_GRAPH",
        algorithm_version=algorithm_version,
        spatial_threshold_m=spatial_threshold_m,
        temporal_threshold_minutes=temporal_threshold_minutes,
        observations_considered=n_obs,
        events_created=0,
        events_updated=0,
        started_at=start_time,
        status="IN_PROGRESS"
    )
    db.add(clustering_run)
    db.commit()

    if n_obs == 0:
        clustering_run.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        clustering_run.status = "SUCCESS"
        db.commit()
        return EventClusterSummary(
            run_id=run_id,
            algorithm="SPATIO_TEMPORAL_GRAPH",
            algorithm_version=algorithm_version,
            spatial_threshold_m=spatial_threshold_m,
            temporal_threshold_minutes=temporal_threshold_minutes,
            observations_considered=0,
            events_created=0,
            events_updated=0,
            duration_seconds=0.0,
            status="SUCCESS"
        )

    # 2. Build Spatio-Temporal Graph
    G = nx.Graph()
    for obs in observations:
        G.add_node(obs.id, record=obs)

    # Pairwise comparison to build edges
    # For large n, indexing can be applied; for current dataset, pairwise check
    for i in range(n_obs):
        u = observations[i]
        for j in range(i + 1, n_obs):
            v = observations[j]

            # Temporal condition check
            dt_min = abs((u.observed_at - v.observed_at).total_seconds()) / 60.0
            if dt_min > temporal_threshold_minutes:
                continue

            # Spatial condition check
            dist_m = haversine_distance_meters(u.latitude, u.longitude, v.latitude, v.longitude)
            if dist_m <= spatial_threshold_m:
                G.add_edge(u.id, v.id, distance=dist_m, time_diff=dt_min)

    # 3. Extract Connected Components
    candidate_components = list(nx.connected_components(G))

    # Controlled Chain Expansion:
    # If any component's maximum pairwise distance exceeds 2.5x spatial threshold,
    # subdivide using distance to component core/sub-components to avoid runaway chaining
    final_components: List[Set[str]] = []
    max_cluster_diameter_m = spatial_threshold_m * 2.5

    for comp in candidate_components:
        comp_nodes = list(comp)
        if len(comp_nodes) <= 2:
            final_components.append(comp)
            continue

        # Check maximum distance between nodes in component
        sub_obs = [G.nodes[nid]["record"] for nid in comp_nodes]
        max_dist = 0.0
        for i in range(len(sub_obs)):
            for j in range(i + 1, len(sub_obs)):
                d = haversine_distance_meters(
                    sub_obs[i].latitude, sub_obs[i].longitude,
                    sub_obs[j].latitude, sub_obs[j].longitude
                )
                if d > max_dist:
                    max_dist = d

        if max_dist <= max_cluster_diameter_m:
            final_components.append(comp)
        else:
            # Subdivide component using minimum-cut or radius from most intense hotspot
            logger.info(f"Subdividing chained cluster (diameter {max_dist:.1f}m > limit {max_cluster_diameter_m:.1f}m)")
            sub_graph = G.subgraph(comp_nodes)
            # Retain communities via greedy modularity or connected components after pruning longest edges
            edges_sorted = sorted(sub_graph.edges(data=True), key=lambda x: x[2].get("distance", 0), reverse=True)
            temp_sub = sub_graph.copy()
            for u_e, v_e, data_e in edges_sorted:
                temp_sub.remove_edge(u_e, v_e)
                # Check if max diameter is now satisfied in all parts
                sub_parts = list(nx.connected_components(temp_sub))
                all_ok = True
                for p in sub_parts:
                    p_obs = [G.nodes[n]["record"] for n in p]
                    p_d = max([haversine_distance_meters(a.latitude, a.longitude, b.latitude, b.longitude)
                               for a in p_obs for b in p_obs] or [0.0])
                    if p_d > max_cluster_diameter_m:
                        all_ok = False
                        break
                if all_ok:
                    final_components.extend(sub_parts)
                    break
            else:
                final_components.append(comp)

    # 4. Synthesize Persistent Thermal Events
    events_created = 0
    events_updated = 0

    for comp in final_components:
        member_hotspots = [G.nodes[nid]["record"] for nid in comp]
        member_hotspots.sort(key=lambda h: h.observed_at)

        # Generate deterministic event fingerprint
        fingerprint_input = "|".join(sorted(h.observation_hash for h in member_hotspots))
        event_fingerprint = hashlib.sha256(fingerprint_input.encode("utf-8")).hexdigest()

        # Timestamps
        first_obs = member_hotspots[0].observed_at
        last_obs = member_hotspots[-1].observed_at
        duration = max(0.0, (last_obs - first_obs).total_seconds() / 60.0)

        # Radiometrics
        frp_vals = [h.frp for h in member_hotspots]
        frp_total = round(sum(frp_vals), 2)
        frp_peak = round(max(frp_vals), 2)
        frp_mean = round(statistics.mean(frp_vals), 2)
        frp_median = round(statistics.median(frp_vals), 2)
        max_bright = round(max(h.brightness_temperature for h in member_hotspots), 2)

        # Centroid: FRP-weighted coordinates
        if frp_total > 0:
            centroid_lat = sum(h.latitude * h.frp for h in member_hotspots) / frp_total
            centroid_lon = sum(h.longitude * h.frp for h in member_hotspots) / frp_total
        else:
            centroid_lat = statistics.mean(h.latitude for h in member_hotspots)
            centroid_lon = statistics.mean(h.longitude for h in member_hotspots)

        centroid_lat = round(centroid_lat, 5)
        centroid_lon = round(centroid_lon, 5)

        # Peak observation
        peak_obs = max(member_hotspots, key=lambda h: h.frp)

        # Geometry & Hull
        convex_hull_geo, bbox_geo, area_km2 = generate_cluster_geometry(
            member_hotspots, centroid_lat, centroid_lon
        )

        # Cluster Quality & Confidence
        conf_score, quality_json = calculate_cluster_confidence(
            member_hotspots, area_km2, duration
        )

        is_demo_flag = any(h.is_demo for h in member_hotspots)

        # Event title
        obs_count = len(member_hotspots)
        if obs_count == 1:
            title = f"Single-Observation Thermal Anomaly ({peak_obs.satellite} / {peak_obs.instrument})"
        else:
            title = f"Thermal Anomaly Cluster ({obs_count} observations • Peak: {frp_peak} MW)"

        # Check existing event by fingerprint (Idempotency)
        existing_event = db.query(ThermalEvent).filter(ThermalEvent.event_fingerprint == event_fingerprint).first()

        if existing_event:
            # Update existing event
            existing_event.title = title
            existing_event.first_observed_at = first_obs
            existing_event.last_observed_at = last_obs
            existing_event.duration_minutes = duration
            existing_event.centroid_latitude = centroid_lat
            existing_event.centroid_longitude = centroid_lon
            existing_event.peak_observation_id = peak_obs.id
            existing_event.peak_latitude = peak_obs.latitude
            existing_event.peak_longitude = peak_obs.longitude
            existing_event.convex_hull_geojson = convex_hull_geo
            existing_event.bounding_box_geojson = bbox_geo
            existing_event.spatial_extent_km2 = area_km2
            existing_event.observation_count = obs_count
            existing_event.frp_total_mw = frp_total
            existing_event.frp_peak_mw = frp_peak
            existing_event.frp_mean_mw = frp_mean
            existing_event.frp_median_mw = frp_median
            existing_event.max_brightness_kelvin = max_bright
            existing_event.cluster_confidence = conf_score
            existing_event.cluster_quality = quality_json
            existing_event.clustering_algorithm_version = algorithm_version
            existing_event.clustering_run_id = run_id
            existing_event.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            events_updated += 1
            event_id = existing_event.id
        else:
            # Create new event
            date_prefix = first_obs.strftime("%Y%m%d")
            event_id = f"EVT-{date_prefix}-{uuid.uuid4().hex[:6].upper()}"

            new_event = ThermalEvent(
                id=event_id,
                event_fingerprint=event_fingerprint,
                title=title,
                first_observed_at=first_obs,
                last_observed_at=last_obs,
                duration_minutes=duration,
                centroid_latitude=centroid_lat,
                centroid_longitude=centroid_lon,
                peak_observation_id=peak_obs.id,
                peak_latitude=peak_obs.latitude,
                peak_longitude=peak_obs.longitude,
                convex_hull_geojson=convex_hull_geo,
                bounding_box_geojson=bbox_geo,
                spatial_extent_km2=area_km2,
                observation_count=obs_count,
                frp_total_mw=frp_total,
                frp_peak_mw=frp_peak,
                frp_mean_mw=frp_mean,
                frp_median_mw=frp_median,
                max_brightness_kelvin=max_bright,
                cluster_confidence=conf_score,
                cluster_quality=quality_json,
                status="CANDIDATE",
                is_demo=is_demo_flag,
                clustering_algorithm_version=algorithm_version,
                clustering_run_id=run_id,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                updated_at=datetime.now(timezone.utc).replace(tzinfo=None)
            )
            db.add(new_event)
            db.flush()

            # Insert observation links
            for h in member_hotspots:
                d_m = round(haversine_distance_meters(centroid_lat, centroid_lon, h.latitude, h.longitude), 1)
                link = EventObservationLink(
                    event_id=event_id,
                    hotspot_id=h.id,
                    distance_to_centroid_m=d_m,
                    observed_at=h.observed_at,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None)
                )
                db.add(link)

            events_created += 1

    # 5. Complete Clustering Run
    end_time = datetime.now(timezone.utc).replace(tzinfo=None)
    duration_sec = round((end_time - start_time).total_seconds(), 2)

    clustering_run.completed_at = end_time
    clustering_run.events_created = events_created
    clustering_run.events_updated = events_updated
    clustering_run.status = "SUCCESS"
    db.commit()

    total_clustered_obs = sum(len(c) for c in final_components)
    obs_unclustered = max(0, n_obs - total_clustered_obs)
    events_suppressed = 0

    return EventClusterSummary(
        run_id=run_id,
        algorithm="SPATIO_TEMPORAL_GRAPH",
        algorithm_version=algorithm_version,
        spatial_threshold_m=spatial_threshold_m,
        temporal_threshold_minutes=temporal_threshold_minutes,
        observations_considered=n_obs,
        events_created=events_created,
        events_updated=events_updated,
        observations_unclustered=obs_unclustered,
        events_suppressed=events_suppressed,
        duration_seconds=duration_sec,
        status="SUCCESS"
    )

def build_event_timeline(event: ThermalEvent, db: Session) -> EventTimelineResponse:
    """
    Builds a chronological evolution timeline of member observations for the candidate thermal event.
    Calculates cumulative metrics, FRP escalation rate, and stage tags.
    """
    links = db.query(EventObservationLink).filter(EventObservationLink.event_id == event.id).order_by(EventObservationLink.observed_at).all()
    hotspot_ids = [l.hotspot_id for l in links]

    if not hotspot_ids:
        return EventTimelineResponse(
            event_id=event.id,
            first_observed_at=event.first_observed_at,
            last_observed_at=event.last_observed_at,
            total_observations=0,
            timeline=[]
        )

    hotspots = db.query(FirmsHotspot).filter(FirmsHotspot.id.in_(hotspot_ids)).order_by(FirmsHotspot.observed_at).all()

    timeline_items: List[EventTimelineItem] = []
    cum_frp = 0.0
    current_peak_frp = 0.0
    prev_frp = 0.0
    prev_observed_at: Optional[datetime] = None
    prev_extent_km2: Optional[float] = None
    accumulated_hotspots: List[FirmsHotspot] = []

    for idx, h in enumerate(hotspots, start=1):
        accumulated_hotspots.append(h)
        cum_frp += h.frp
        prev_peak = current_peak_frp if idx > 1 else None
        current_peak_frp = max(current_peak_frp, h.frp)

        # Time interval since previous observation
        time_since_prev = None
        if prev_observed_at:
            time_since_prev = round(max(0.0, (h.observed_at - prev_observed_at).total_seconds() / 60.0), 1)
        prev_observed_at = h.observed_at

        # FRP delta percent vs previous observation
        delta_pct = None
        if prev_frp > 0:
            delta_pct = round(((h.frp - prev_frp) / prev_frp) * 100.0, 1)
        prev_frp = h.frp

        # Geometry of points up to step i
        _, _, step_extent_km2 = generate_cluster_geometry(
            accumulated_hotspots, event.centroid_latitude, event.centroid_longitude
        )

        # Spatial extent delta vs previous step
        extent_delta = None
        if prev_extent_km2 is not None:
            extent_delta = round(step_extent_km2 - prev_extent_km2, 4)
        prev_extent_km2 = step_extent_km2

        # Step cluster confidence
        step_duration = (h.observed_at - accumulated_hotspots[0].observed_at).total_seconds() / 60.0
        step_conf, _ = calculate_cluster_confidence(accumulated_hotspots, step_extent_km2, step_duration)

        # Stage classification (Observation evolution stages only)
        if idx == 1:
            stage = "INITIAL"
        elif idx in (2, 3):
            stage = "FORMING"
        elif delta_pct is not None and delta_pct >= 50.0:
            stage = "ESCALATING"
        elif delta_pct is not None and delta_pct <= -40.0:
            stage = "COOLING"
        elif idx >= 4:
            stage = "PERSISTING"
        else:
            stage = "FORMING"

        item = EventTimelineItem(
            step=idx,
            observed_at=h.observed_at,
            hotspot_id=h.id,
            cumulative_observation_count=idx,
            cumulative_frp_total_mw=round(cum_frp, 2),
            current_frp_peak_mw=round(current_peak_frp, 2),
            previous_frp_peak_mw=round(prev_peak, 2) if prev_peak is not None else None,
            frp_delta_percent=delta_pct,
            time_since_previous_minutes=time_since_prev,
            spatial_extent_km2=step_extent_km2,
            spatial_extent_delta_km2=extent_delta,
            new_observations=1,
            stage=stage,
            satellite=h.satellite,
            instrument=h.instrument,
            latitude=h.latitude,
            longitude=h.longitude,
            frp=h.frp,
            cluster_confidence=step_conf
        )
        timeline_items.append(item)

    return EventTimelineResponse(
        event_id=event.id,
        first_observed_at=event.first_observed_at,
        last_observed_at=event.last_observed_at,
        total_observations=len(timeline_items),
        timeline=timeline_items
    )

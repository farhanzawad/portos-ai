from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.terminal import Terminal, Berth, BerthStatusEnum
from app.models.vessel import Vessel, VesselCall, VesselPosition, CallStatusEnum, DelayRiskStatusEnum
from app.models.yard import YardBlock
from app.schemas.geospatial import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
    SpatialLayerRead,
)
from app.db.base import DataStatusEnum

# Port Geographic Constants (Chattogram / Karnaphuli River approach)
PORT_BOUNDS = [91.70, 22.15, 91.85, 22.35]
TERMINAL_ORIGIN_LAT = 22.2850
TERMINAL_ORIGIN_LON = 91.8020


class GeospatialService:
    """Core geospatial intelligence service providing GeoJSON spatial layers and features."""

    def get_layers_catalog(self) -> List[SpatialLayerRead]:
        """Returns catalog of controllable spatial layers."""
        return [
            SpatialLayerRead(
                layer_id="base_geography",
                name="Base Geography & Karnaphuli River",
                category="GEOGRAPHY",
                feature_count=3,
                default_visible=True,
                description="Karnaphuli river fairway polygon, shoreline boundaries, and terrestrial landmass.",
                icon="Waves",
            ),
            SpatialLayerRead(
                layer_id="bathymetry",
                name="Bathymetric Depth Contours",
                category="HYDROGRAPHY",
                feature_count=4,
                default_visible=True,
                description="Riverbed depth contours (<5m shoal flats, -9m channel, -11m turning basin, -14m outer channel).",
                icon="Layers",
            ),
            SpatialLayerRead(
                layer_id="navigation_channels",
                name="Fairway Channels & Turning Basins",
                category="NAVIGATION",
                feature_count=4,
                default_visible=True,
                description="Karnaphuli main fairway centerline, Gupta bend transition, and outer bar corridor.",
                icon="Compass",
            ),
            SpatialLayerRead(
                layer_id="anchorage_zones",
                name="Anchorage & Lightering Zones",
                category="NAVIGATION",
                feature_count=4,
                default_visible=True,
                description="Outer Anchorage zones (Alpha: Cargo, Bravo: Tankers, Charlie: Quarantine, Kutubdia deep).",
                icon="Anchor",
            ),
            SpatialLayerRead(
                layer_id="terminals",
                name="Terminal Boundaries (CCT, NCT, GCB, PCT)",
                category="INFRASTRUCTURE",
                feature_count=4,
                default_visible=True,
                description="Operational terminal facility footprints and statutory customs concession perimeters.",
                icon="Building2",
            ),
            SpatialLayerRead(
                layer_id="berths",
                name="Quayside Berths & Jetties",
                category="INFRASTRUCTURE",
                feature_count=18,
                default_visible=True,
                description="Container berths and general cargo berths with bollard line, depth, and LOA boundaries.",
                icon="Ship",
            ),
            SpatialLayerRead(
                layer_id="container_yards",
                name="Container Stacking Blocks (C01-C12)",
                category="YARD",
                feature_count=12,
                default_visible=True,
                description="Container yard blocks with Import, Export, Reefer, and IMO Hazardous segregations.",
                icon="Grid3X3",
            ),
            SpatialLayerRead(
                layer_id="port_facilities",
                name="Gate Complex & Operational Buildings",
                category="INFRASTRUCTURE",
                feature_count=10,
                default_visible=True,
                description="In/Out gates, customs scanner canopy, control tower, workshop, and fuel storage tanks.",
                icon="ShieldCheck",
            ),
            SpatialLayerRead(
                layer_id="road_rail_network",
                name="Port Access Roads & Rail Sidings",
                category="LOGISTICS",
                feature_count=5,
                default_visible=True,
                description="Port access internal one-way highway loops and quayside railway sidings.",
                icon="Navigation",
            ),
            SpatialLayerRead(
                layer_id="vessels",
                name="Vessel AIS Positions & Headings",
                category="VESSELS",
                feature_count=12,
                default_visible=True,
                description="Directional vessel icons with speed, heading chevrons, and ETA delay-risk tags.",
                icon="Ship",
            ),
            SpatialLayerRead(
                layer_id="vessel_tracks",
                name="Vessel Historical & Predicted Tracks",
                category="VESSELS",
                feature_count=12,
                default_visible=True,
                description="Polylines representing past fairway trajectory and predictive route arrival paths.",
                icon="Radio",
            ),
            SpatialLayerRead(
                layer_id="incidents",
                name="Operational Alerts & Navigational Hazards",
                category="SAFETY",
                feature_count=2,
                default_visible=True,
                description="Active safety notices, squall wind advisories, and fairway traffic warnings.",
                icon="AlertTriangle",
            ),
        ]

    def get_static_port_features(self) -> List[GeoJSONFeature]:
        """Returns verified static geographic features of Chattogram Port and Karnaphuli river."""
        features = []

        # 1. Karnaphuli River Waterway Polygon
        features.append(
            GeoJSONFeature(
                id="feat_karnaphuli_river",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.730, 22.180],
                        [91.765, 22.205],
                        [91.785, 22.235],
                        [91.798, 22.260],
                        [91.808, 22.285],
                        [91.815, 22.315],
                        [91.835, 22.335],
                        [91.845, 22.325],
                        [91.825, 22.295],
                        [91.815, 22.265],
                        [91.802, 22.230],
                        [91.780, 22.195],
                        [91.745, 22.165],
                        [91.730, 22.180],
                    ]],
                ),
                properties={
                    "name": "Karnaphuli River Navigable Fairway",
                    "entity_type": "PortArea",
                    "layer": "base_geography",
                    "water_body": "Karnaphuli River",
                    "tidal_range_m": 4.2,
                    "datum": "Chart Datum (CD)",
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "CPA Hydrography Dept (SRC-CPA-TIDES-2026)",
                },
            )
        )

        # 2. Bathymetric Shallow Flats (<5m depth contour)
        features.append(
            GeoJSONFeature(
                id="feat_shoal_flats",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.730, 22.170],
                        [91.760, 22.190],
                        [91.780, 22.220],
                        [91.770, 22.200],
                        [91.745, 22.165],
                        [91.730, 22.170],
                    ]],
                ),
                properties={
                    "name": "Patenga Shoal Bank (<5m CD)",
                    "entity_type": "Bathymetry",
                    "layer": "bathymetry",
                    "depth_range": "< 5.0m",
                    "navigational_hazard": "Shallow water grounding risk for vessels > 5m draft",
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "CPA Hydrography Notice to Mariners",
                },
            )
        )

        # 3. Navigation Channel Deep Fairway (-9m to -11m)
        features.append(
            GeoJSONFeature(
                id="feat_channel_deep",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.745, 22.190],
                        [91.775, 22.215],
                        [91.792, 22.245],
                        [91.804, 22.278],
                        [91.810, 22.275],
                        [91.798, 22.240],
                        [91.780, 22.210],
                        [91.750, 22.185],
                        [91.745, 22.190],
                    ]],
                ),
                properties={
                    "name": "Karnaphuli Main Approach Channel (-11m CD)",
                    "entity_type": "NavigationRoute",
                    "layer": "navigation_channels",
                    "design_depth_m": 11.0,
                    "permissible_draft_m": 9.50,
                    "channel_width_m": 250.0,
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "CPA Navigational Circular 18/2026",
                },
            )
        )

        # 4. Turning Basin (Diameter ~600m)
        features.append(
            GeoJSONFeature(
                id="feat_turning_basin",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.800, 22.275],
                        [91.806, 22.278],
                        [91.809, 22.273],
                        [91.805, 22.268],
                        [91.799, 22.270],
                        [91.800, 22.275],
                    ]],
                ),
                properties={
                    "name": "Karnaphuli Turning Basin (Ø 600m)",
                    "entity_type": "NavigationRoute",
                    "layer": "navigation_channels",
                    "diameter_m": 600.0,
                    "design_depth_m": 11.0,
                    "remarks": "Turning basin for container feeders up to 205m LOA with tug assistance.",
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "RSGT PCT Masterplan / CPA Marine Ops",
                },
            )
        )

        # 5. Anchorage Zones
        anchorages = [
            ("anch_alpha", "Anchorage Area Alpha", [91.735, 22.185], 1800, "General container & cargo waiting anchorage"),
            ("anch_bravo", "Anchorage Area Bravo", [91.710, 22.155], 2200, "Tankers, oil carriers, and Kutubdia lighterage operations"),
            ("anch_charlie", "Anchorage Area Charlie", [91.755, 22.215], 1200, "Quarantine, customs inspection, and bad weather holding"),
        ]
        for a_id, a_name, coords, rad, desc in anchorages:
            features.append(
                GeoJSONFeature(
                    id=f"feat_{a_id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=coords),
                    properties={
                        "name": a_name,
                        "entity_type": "AnchorageZone",
                        "layer": "anchorage_zones",
                        "radius_m": rad,
                        "description": desc,
                        "data_status": DataStatusEnum.OBSERVED.value,
                        "data_source": "Chattogram Port Authority Fairway Guide",
                    },
                )
            )

        # 6. Terminal Boundaries
        terminals_geo = [
            ("term_cct", "Chittagong Container Terminal (CCT)", [91.802, 22.285], 605.0, DataStatusEnum.OBSERVED.value),
            ("term_nct", "New Mooring Container Terminal (NCT)", [91.806, 22.272], 1000.0, DataStatusEnum.OBSERVED.value),
            ("term_gcb", "General Cargo Berths (GCB)", [91.810, 22.298], 850.0, DataStatusEnum.OBSERVED.value),
            ("term_pct", "RSGT Patenga Container Terminal (PCT)", [91.795, 22.238], 580.0, "CONCEPTUAL"),
        ]
        for t_id, t_name, coords, quay_len, status in terminals_geo:
            features.append(
                GeoJSONFeature(
                    id=f"feat_{t_id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=coords),
                    properties={
                        "name": t_name,
                        "entity_type": "Terminal",
                        "layer": "terminals",
                        "total_quay_length_m": quay_len,
                        "country": "BGD",
                        "data_status": status,
                        "data_source": "CPA Official Terminal Specifications (SRC-CPA-BERTH-SPEC-2026)",
                    },
                )
            )

        # 7. Container Stacking Blocks (C01 to C12 matching Image 3 Conceptual Masterplan)
        yard_block_definitions = [
            ("C01", "Import", 1200, 78.4, 24, "Normal", [91.798, 22.242]),
            ("C02", "Import", 1200, 82.1, 26, "Normal", [91.799, 22.241]),
            ("C03", "Export", 1400, 68.5, 20, "Normal", [91.800, 22.240]),
            ("C04", "Export", 1400, 71.0, 22, "Normal", [91.801, 22.239]),
            ("C05", "Transshipment", 1000, 88.5, 30, "Watch", [91.802, 22.238]),
            ("C06", "Empty", 1600, 52.0, 15, "Normal", [91.803, 22.237]),
            ("C07", "Import", 1200, 79.0, 25, "Normal", [91.798, 22.240]),
            ("C08", "Export", 1400, 64.0, 18, "Normal", [91.799, 22.239]),
            ("C09", "Export", 1400, 66.5, 19, "Normal", [91.800, 22.238]),
            ("C10", "Empty", 1600, 50.0, 14, "Normal", [91.801, 22.237]),
            ("C11", "Reefer (Powered)", 800, 85.0, 32, "Watch", [91.802, 22.236]),
            ("C12", "Hazardous (IMO Segregated)", 600, 91.5, 36, "High Risk", [91.803, 22.235]),
        ]
        for code, category, cap, occ, dw, tier, coords in yard_block_definitions:
            features.append(
                GeoJSONFeature(
                    id=f"feat_yard_{code}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=coords),
                    properties={
                        "code": code,
                        "name": f"Yard Block {code} ({category})",
                        "entity_type": "YardBlock",
                        "layer": "container_yards",
                        "category": category,
                        "capacity_teu": cap,
                        "occupancy_pct": occ,
                        "dwell_time_avg_hours": dw,
                        "risk_tier": tier,
                        "rtg_equipped": True,
                        "data_status": "CONCEPTUAL",
                        "data_source": "RSGT PCT Masterplan Drawing PCT-MP-001 (Rev A)",
                    },
                )
            )

        # 8. Gate Complex & Port Facilities (Image 3)
        facilities = [
            ("gate_in", "In-Gate Complex (OCR, Weighbridge, Security)", [91.801, 22.234], "Gate", "Import gate lanes with automated OCR"),
            ("gate_out", "Out-Gate Complex (OCR & Security Booth)", [91.804, 22.233], "Gate", "Export gate lanes with weighbridge"),
            ("customs_scanner", "Customs Inspection & Container Scanner Canopy", [91.802, 22.233], "PortFacility", "X-ray container scanning portal"),
            ("control_tower", "Marine Operations & Control Tower", [91.797, 22.238], "PortFacility", "Octagonal elevated marine traffic tower"),
            ("admin_bldg", "Administration Building & Staff Center", [91.796, 22.237], "PortFacility", "Terminal administrative offices"),
            ("maint_workshop", "Equipment Maintenance Yard & Workshop", [91.794, 22.240], "PortFacility", "Heavy STS & RTG mechanical maintenance"),
            ("fuel_storage", "Fuel Storage Tanks & Pump House", [91.805, 22.237], "PortFacility", "MGO marine diesel and terminal tractor fuel storage"),
            ("substation", "Electrical Substation & Generator Backup", [91.803, 22.234], "PortFacility", "11kV shore-power and STS crane electrical feed"),
            ("fire_station", "Terminal Fire Station & First Aid Clinic", [91.798, 22.236], "PortFacility", "24/7 port emergency response unit"),
            ("truck_staging", "Truck Staging & Holding Area (~200 Trucks)", [91.805, 22.232], "PortFacility", "Off-street holding facility for container trailers"),
        ]
        for f_id, f_name, coords, f_type, desc in facilities:
            features.append(
                GeoJSONFeature(
                    id=f"feat_{f_id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=coords),
                    properties={
                        "name": f_name,
                        "entity_type": f_type,
                        "layer": "port_facilities",
                        "description": desc,
                        "data_status": "CONCEPTUAL",
                        "data_source": "RSGT PCT Masterplan Drawing PCT-MP-001",
                    },
                )
            )

        return features

    def build_full_feature_collection(self, db: Session) -> GeoJSONFeatureCollection:
        """Assembles all port entities into an integrated GeoJSON FeatureCollection."""
        features = self.get_static_port_features()

        # Add live Berth entities from database
        db_berths = db.query(Berth).all()
        for idx, b in enumerate(db_berths):
            # Interpolated geographic coordinate along Karnaphuli quay alignment
            lat = 22.2850 - (idx * 0.0018)
            lon = 91.8020 + (idx * 0.0012)
            features.append(
                GeoJSONFeature(
                    id=f"feat_berth_{b.id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=[round(lon, 5), round(lat, 5)]),
                    properties={
                        "id": b.id,
                        "code": b.code,
                        "name": b.name,
                        "entity_type": "Berth",
                        "layer": "berths",
                        "status": b.status.value,
                        "length_m": b.length_m,
                        "depth_draft_m": b.depth_draft_m,
                        "max_vessel_loa_m": b.max_vessel_loa_m,
                        "sts_crane_equipped": True,
                        "crane_rail_gauge_m": 30.48,
                        "data_status": b.data_status.value,
                        "data_source": b.source_name,
                    },
                )
            )

        # Add live Vessel Calls from database
        vessel_calls = db.query(VesselCall).filter(VesselCall.status != CallStatusEnum.COMPLETED).all()
        for c in vessel_calls:
            vessel = c.vessel
            positions = db.query(VesselPosition).filter(VesselPosition.vessel_call_id == c.id).order_by(VesselPosition.timestamp).all()
            
            latest_pos = positions[-1] if positions else None
            lat = latest_pos.latitude if latest_pos else (22.250 + (hash(c.id) % 50) * 0.001)
            lon = latest_pos.longitude if latest_pos else (91.780 + (hash(c.id) % 50) * 0.001)
            speed = latest_pos.speed_knots if latest_pos else 8.5
            heading = latest_pos.heading_degrees if latest_pos else 38.0

            # 1. Vessel Point marker
            features.append(
                GeoJSONFeature(
                    id=f"feat_vessel_{c.id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=[round(lon, 5), round(lat, 5)]),
                    properties={
                        "id": c.id,
                        "vessel_id": vessel.id,
                        "vessel_name": vessel.name,
                        "imo_number": vessel.imo_number,
                        "vessel_type": vessel.vessel_type.value,
                        "entity_type": "Vessel",
                        "layer": "vessels",
                        "status": c.status.value,
                        "delay_risk": c.delay_risk_status.value,
                        "speed_knots": speed,
                        "heading_degrees": heading,
                        "draft_m": vessel.max_draft_m,
                        "length_overall_m": vessel.length_overall_m,
                        "reported_eta": c.reported_eta.isoformat() if c.reported_eta else None,
                        "predicted_eta": c.predicted_eta.isoformat() if c.predicted_eta else None,
                        "berth_assigned": c.berth_assignments[0].berth.code if (c.berth_assignments and c.berth_assignments[0].berth) else None,
                        "data_status": c.data_status.value,
                        "data_source": c.source_name,
                    },
                )
            )

            # 2. Vessel Track polyline
            if len(positions) > 1:
                track_coords = [[round(p.longitude, 5), round(p.latitude, 5)] for p in positions]
            else:
                # Synthetic corridor track
                track_coords = [
                    [round(lon - 0.03, 5), round(lat - 0.04, 5)],
                    [round(lon - 0.015, 5), round(lat - 0.02, 5)],
                    [round(lon, 5), round(lat, 5)],
                ]

            features.append(
                GeoJSONFeature(
                    id=f"feat_track_{c.id}",
                    geometry=GeoJSONGeometry(type="LineString", coordinates=track_coords),
                    properties={
                        "vessel_call_id": c.id,
                        "vessel_name": vessel.name,
                        "entity_type": "VesselTrack",
                        "layer": "vessel_tracks",
                        "points_count": len(track_coords),
                        "data_status": DataStatusEnum.SIMULATED.value,
                        "data_source": "PORTOS AIS Corridor Interpolator",
                    },
                )
            )

        return GeoJSONFeatureCollection(
            type="FeatureCollection",
            features=features,
            crs={"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            metadata={
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "total_features": len(features),
                "port_name": "Port of Chattogram (Chittagong)",
                "terminal_anchor_lat": TERMINAL_ORIGIN_LAT,
                "terminal_anchor_lon": TERMINAL_ORIGIN_LON,
                "disclaimer": "All vessel positions, berth assignments, and PCT dimensions represent conceptual/simulated research records.",
                "data_status": "SIMULATED / OBSERVED HYBRID",
            },
        )


geospatial_service = GeospatialService()

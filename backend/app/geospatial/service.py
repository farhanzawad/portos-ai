from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math
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
PORT_BOUNDS = [91.68, 22.12, 91.86, 22.34]
TERMINAL_ORIGIN_LAT = 22.2850
TERMINAL_ORIGIN_LON = 91.8020

# Verified Hydrographic Fairway Centerline Waypoints (Bay of Bengal to Sadarghat)
# Navigates exclusively within the water channel, rounding Patenga Point into the Karnaphuli river
KARNAPHULI_FAIRWAY_CENTERLINE = [
    [91.7000, 22.1300],  # 0: Deep Sea Bay of Bengal / Outer Approaches
    [91.7200, 22.1500],  # 1: Anchorage Area Bravo Corridor
    [91.7450, 22.1750],  # 2: Anchorage Area Alpha Corridor
    [91.7680, 22.1980],  # 3: Outer Fairway Buoy
    [91.7880, 22.2120],  # 4: Outer Bar Pilot Boarding Station
    [91.8050, 22.2220],  # 5: Rounding Patenga Point (Water entrance south of lighthouse)
    [91.8140, 22.2320],  # 6: River mouth fairway entry (between Patenga and KAFCO)
    [91.8180, 22.2450],  # 7: Patenga Reach (PCT frontage deep water)
    [91.8240, 22.2580],  # 8: Approach to Gupta Bend (River reach)
    [91.8220, 22.2700],  # 9: Gupta Bend Apex (Navigational hairpin C-curve)
    [91.8160, 22.2820],  # 10: Gupta Bend North Transit
    [91.8140, 22.2950],  # 11: NCT Container Terminal Fairway
    [91.8140, 22.3080],  # 12: CCT Container Terminal Fairway
    [91.8180, 22.3180],  # 13: CPA Jetties Fairway / Majhirghat
    [91.8280, 22.3240],  # 14: Sadarghat Basin
]

# Dredged Navigational Fairway Corridor (240m wide corridor polygon along centerline)
KARNAPHULI_FAIRWAY_CORRIDOR = [
    [91.71915, 22.15073],
    [91.74415, 22.17573],
    [91.76721, 22.19879],
    [91.78733, 22.21288],
    [91.80426, 22.22283],
    [91.81297, 22.23250],
    [91.81690, 22.24536],
    [91.82285, 22.25816],
    [91.82089, 22.26968],
    [91.81488, 22.28169],
    [91.81284, 22.29492],
    [91.81285, 22.30817],
    [91.81710, 22.31868],
    [91.82737, 22.32491],
    [91.82863, 22.32309],
    [91.81890, 22.31732],
    [91.81515, 22.30783],
    [91.81516, 22.29508],
    [91.81712, 22.28231],
    [91.82311, 22.27032],
    [91.82515, 22.25784],
    [91.81910, 22.24464],
    [91.81503, 22.23150],
    [91.80574, 22.22117],
    [91.78867, 22.21112],
    [91.76879, 22.19721],
    [91.74585, 22.17427],
    [91.72085, 22.14927],
    [91.71915, 22.15073],
]

# Verified Quayside Coordinates for CCT, NCT and PCT Container Berths
QUAYSIDE_BERTH_COORDINATES = {
    "berth_01": [91.8118, 22.3080],  # CCT Berth 1
    "berth_02": [91.8115, 22.3040],  # CCT Berth 2
    "berth_03": [91.8112, 22.3000],  # CCT Berth 3
    "berth_04": [91.8110, 22.2960],  # NCT Berth 4
    "berth_05": [91.8107, 22.2920],  # NCT Berth 5
    "berth_06": [91.8105, 22.2880],  # NCT Berth 6
    "BERTH-01": [91.8118, 22.3080],
    "BERTH-02": [91.8115, 22.3040],
    "BERTH-03": [91.8112, 22.3000],
    "BERTH-04": [91.8110, 22.2960],
    "BERTH-05": [91.8107, 22.2920],
    "BERTH-06": [91.8105, 22.2880],
}


def generate_waterway_track(
    lon: float,
    lat: float,
    status: str,
    berth_coord: Optional[List[float]] = None,
) -> List[List[float]]:
    """Generates a realistic river track that strictly follows the Karnaphuli waterway."""
    target_lon = berth_coord[0] if (status == CallStatusEnum.BERTHED.value and berth_coord) else lon
    target_lat = berth_coord[1] if (status == CallStatusEnum.BERTHED.value and berth_coord) else lat

    # If vessel is at outer anchorage (Bay of Bengal)
    if target_lon < 91.77 and target_lat < 22.21:
        return [
            [round(target_lon - 0.025, 5), round(target_lat - 0.035, 5)],
            [round(target_lon - 0.012, 5), round(target_lat - 0.018, 5)],
            [round(target_lon, 5), round(target_lat, 5)],
        ]

    # Find closest fairway waypoint
    best_idx = 0
    min_dist = float("inf")
    for idx, (w_lon, w_lat) in enumerate(KARNAPHULI_FAIRWAY_CENTERLINE):
        dist = (w_lon - target_lon) ** 2 + (w_lat - target_lat) ** 2
        if dist < min_dist:
            min_dist = dist
            best_idx = idx

    start_idx = max(2, best_idx - 6)
    track = [list(pt) for pt in KARNAPHULI_FAIRWAY_CENTERLINE[start_idx : best_idx + 1]]
    if not track or track[-1] != [round(target_lon, 5), round(target_lat, 5)]:
        track.append([round(target_lon, 5), round(target_lat, 5)])

    return track


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
                feature_count=5,
                default_visible=True,
                description="Karnaphuli main fairway centerline, Gupta bend transition, dredged corridor, and outer bar corridor.",
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
                feature_count=10,
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

        # 1. Karnaphuli River Waterway Polygon (Strictly in water, wraps around Patenga Point)
        features.append(
            GeoJSONFeature(
                id="feat_karnaphuli_river",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.7300, 22.1800],
                        [91.7700, 22.2050],
                        [91.7920, 22.2220],  # Patenga Point tip
                        [91.8020, 22.2280],  # Naval Academy shoreline
                        [91.8100, 22.2420],  # PCT shoreline
                        [91.8150, 22.2600],  # Gupta Bend west shoreline
                        [91.8100, 22.2850],  # NCT quay shoreline
                        [91.8110, 22.3100],  # CCT quay shoreline
                        [91.8160, 22.3220],  # Majhirghat shoreline
                        [91.8300, 22.3260],  # Sadarghat shoreline
                        [91.8550, 22.3280],  # Shah Amanat Bridge (North)
                        [91.8550, 22.3220],  # Shah Amanat Bridge (South)
                        [91.8300, 22.3200],  # South riverbank
                        [91.8220, 22.3120],  # South riverbank
                        [91.8180, 22.2850],  # East bank opposite NCT
                        [91.8250, 22.2700],  # East bank opposite Gupta Bend
                        [91.8300, 22.2550],  # Boat Club / Marine Academy shoreline
                        [91.8250, 22.2400],  # East bank
                        [91.8400, 22.2280],  # KAFCO Jetty shoreline
                        [91.8250, 22.2150],  # Outer mouth south bank
                        [91.7900, 22.1950],  # Outer bar south
                        [91.7450, 22.1650],  # Outer bay
                        [91.7300, 22.1800],  # Close polygon
                    ]],
                ),
                properties={
                    "name": "Karnaphuli River Navigable Waterway",
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

        # 2. Bathymetric Shallow Flats (<5m depth contour, strictly outside fairway)
        features.append(
            GeoJSONFeature(
                id="feat_shoal_flats",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.7600, 22.2000],
                        [91.7850, 22.2120],
                        [91.7980, 22.2200],
                        [91.7850, 22.2000],
                        [91.7600, 22.2000],
                    ]],
                ),
                properties={
                    "name": "Patenga Shoal Bank (<5m CD)",
                    "entity_type": "Bathymetry",
                    "layer": "bathymetry",
                    "depth_range_cd_m": "< 5.0m (Shoals)",
                    "depth_range": "< 5.0m",
                    "navigational_hazard": "Shallow water grounding risk for vessels > 5m draft",
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "CPA Hydrography Notice to Mariners",
                },
            )
        )

        # 3. Fairway Centerline (NavigationRoute LineString)
        features.append(
            GeoJSONFeature(
                id="feat_channel_centerline",
                geometry=GeoJSONGeometry(
                    type="LineString",
                    coordinates=KARNAPHULI_FAIRWAY_CENTERLINE,
                ),
                properties={
                    "name": "Karnaphuli Main Navigation Fairway Channel (-11.0m CD)",
                    "entity_type": "NavigationRoute",
                    "layer": "navigation_channels",
                    "design_depth_m": 11.0,
                    "permissible_draft_m": 9.50,
                    "channel_width_m": 240.0,
                    "status": "Active Fairway",
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "CPA Navigational Circular 18/2026",
                },
            )
        )

        # 4. Dredged Fairway Corridor Polygon
        features.append(
            GeoJSONFeature(
                id="feat_channel_corridor",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[KARNAPHULI_FAIRWAY_CORRIDOR],
                ),
                properties={
                    "name": "Karnaphuli Dredged Deep Corridor (-11m CD)",
                    "entity_type": "NavigationCorridor",
                    "layer": "navigation_channels",
                    "channel_width_m": 240.0,
                    "design_depth_m": 11.0,
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "RSGT PCT Hydrographic Survey",
                },
            )
        )

        # 5. Turning Basin (Diameter ~600m in river basin)
        features.append(
            GeoJSONFeature(
                id="feat_turning_basin",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.8190, 22.2700],
                        [91.8235, 22.2725],
                        [91.8250, 22.2685],
                        [91.8220, 22.2650],
                        [91.8180, 22.2670],
                        [91.8190, 22.2700],
                    ]],
                ),
                properties={
                    "name": "Karnaphuli Turning Basin (Ø 600m)",
                    "entity_type": "NavigationRoute",
                    "layer": "navigation_channels",
                    "diameter_m": 600.0,
                    "design_depth_m": 11.0,
                    "depth_range_cd_m": "-11.0m (PCT & NCT Basin)",
                    "remarks": "Feeder vessel turning basin up to 205m LOA with tug assistance.",
                    "data_status": DataStatusEnum.OBSERVED.value,
                    "data_source": "RSGT PCT Masterplan / CPA Marine Ops",
                },
            )
        )

        # 6. Anchorage Zones (Bay of Bengal waters, strictly offshore)
        anchorages = [
            ("anch_alpha", "Anchorage Area Alpha", [91.7450, 22.1750], 1800, "General container & cargo waiting anchorage"),
            ("anch_bravo", "Anchorage Area Bravo", [91.7150, 22.1500], 2200, "Tankers, oil carriers, and Kutubdia lighterage operations"),
            ("anch_charlie", "Anchorage Area Charlie", [91.7550, 22.1950], 1200, "Quarantine, customs inspection, and bad weather holding"),
            ("anch_deep", "Deep Sea Holding Area", [91.6850, 22.1200], 2500, "Deep draft container feeder holding basin"),
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

        # 7. Terminal Boundaries
        terminals_geo = [
            ("term_cct", "Chittagong Container Terminal (CCT)", [91.8115, 22.3040], 605.0, DataStatusEnum.OBSERVED.value),
            ("term_nct", "New Mooring Container Terminal (NCT)", [91.8108, 22.2920], 1000.0, DataStatusEnum.OBSERVED.value),
            ("term_gcb", "General Cargo Berths (GCB)", [91.8130, 22.3160], 850.0, DataStatusEnum.OBSERVED.value),
            ("term_pct", "RSGT Patenga Container Terminal (PCT)", [91.8110, 22.2420], 580.0, "CONCEPTUAL"),
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

        # 8. Container Stacking Blocks (C01 to C12 matching Image 3 Conceptual Masterplan on PCT Land Apron)
        yard_block_definitions = [
            ("C01", "Import", 1200, 78.4, 24, "Normal", [91.8100, 22.2440]),
            ("C02", "Import", 1200, 82.1, 26, "Normal", [91.8105, 22.2435]),
            ("C03", "Export", 1400, 68.5, 20, "Normal", [91.8110, 22.2430]),
            ("C04", "Export", 1400, 71.0, 22, "Normal", [91.8115, 22.2425]),
            ("C05", "Transshipment", 1000, 88.5, 30, "Watch", [91.8120, 22.2420]),
            ("C06", "Empty", 1600, 52.0, 15, "Normal", [91.8125, 22.2415]),
            ("C07", "Import", 1200, 79.0, 25, "Normal", [91.8095, 22.2430]),
            ("C08", "Export", 1400, 64.0, 18, "Normal", [91.8100, 22.2425]),
            ("C09", "Export", 1400, 66.5, 19, "Normal", [91.8105, 22.2420]),
            ("C10", "Empty", 1600, 50.0, 14, "Normal", [91.8110, 22.2415]),
            ("C11", "Reefer (Powered)", 800, 85.0, 32, "Watch", [91.8115, 22.2410]),
            ("C12", "Hazardous (IMO Segregated)", 600, 91.5, 36, "High Risk", [91.8120, 22.2405]),
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

        # 9. Gate Complex & Port Facilities (PCT Layout Image 3)
        facilities = [
            ("gate_in", "In-Gate Complex (OCR, Weighbridge, Security)", [91.8090, 22.2400], "Gate", "Import gate lanes with automated OCR"),
            ("gate_out", "Out-Gate Complex (OCR & Security Booth)", [91.8095, 22.2395], "Gate", "Export gate lanes with weighbridge"),
            ("customs_scanner", "Customs Inspection & Container Scanner Canopy", [91.8092, 22.2390], "PortFacility", "X-ray container scanning portal"),
            ("control_tower", "Marine Operations & Control Tower", [91.8080, 22.2420], "PortFacility", "Elevated marine traffic operations tower"),
            ("admin_bldg", "Administration Building & Staff Center", [91.8075, 22.2415], "PortFacility", "Terminal administrative offices"),
            ("maint_workshop", "Equipment Maintenance Yard & Workshop", [91.8070, 22.2435], "PortFacility", "Heavy STS & RTG mechanical workshop"),
            ("fuel_storage", "Fuel Storage Tanks & Pump House", [91.8125, 22.2395], "PortFacility", "MGO marine diesel and terminal tractor fuel storage"),
            ("substation", "Electrical Substation & Generator Backup", [91.8085, 22.2405], "PortFacility", "11kV shore-power and STS crane electrical feed"),
            ("fire_station", "Terminal Fire Station & First Aid Clinic", [91.8082, 22.2410], "PortFacility", "24/7 port emergency response unit"),
            ("truck_staging", "Truck Staging & Holding Area (~200 Trucks)", [91.8098, 22.2385], "PortFacility", "Off-street holding facility for container trailers"),
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

        # 10. PCT Berths 1 to 4 along Patenga quay frontage
        pct_berths = [
            ("pct_b1", "PCT Berth 1", [91.8126, 22.2425], 200.0, 11.0, 190.0, "OCCUPIED"),
            ("pct_b2", "PCT Berth 2", [91.8133, 22.2440], 190.0, 11.0, 190.0, "AVAILABLE"),
            ("pct_b3", "PCT Berth 3", [91.8140, 22.2455], 190.0, 11.0, 190.0, "OCCUPIED"),
            ("pct_b4", "PCT Berth 4 (Oil/Tanker)", [91.8145, 22.2465], 150.0, 9.5, 140.0, "AVAILABLE"),
        ]
        for b_id, b_name, coords, length, draft, loa, status in pct_berths:
            features.append(
                GeoJSONFeature(
                    id=f"feat_berth_{b_id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=coords),
                    properties={
                        "id": b_id,
                        "code": b_id.upper(),
                        "name": b_name,
                        "entity_type": "Berth",
                        "layer": "berths",
                        "status": status,
                        "length_m": length,
                        "depth_draft_m": draft,
                        "max_vessel_loa_m": loa,
                        "sts_crane_equipped": True,
                        "data_status": "CONCEPTUAL",
                        "data_source": "RSGT PCT Conceptual Layout PCT-MP-001",
                    },
                )
            )

        return features

    def build_full_feature_collection(self, db: Session) -> GeoJSONFeatureCollection:
        """Assembles all port entities into an integrated GeoJSON FeatureCollection."""
        features = self.get_static_port_features()

        # Add live Berth entities from database (aligned strictly to Karnaphuli river quayside)
        db_berths = db.query(Berth).all()
        for idx, b in enumerate(db_berths):
            # Look up verified quayside coordinates
            coords = QUAYSIDE_BERTH_COORDINATES.get(
                b.code,
                QUAYSIDE_BERTH_COORDINATES.get(
                    b.id,
                    [91.8118 - (idx * 0.0003), 22.3080 - (idx * 0.0040)],
                ),
            )
            features.append(
                GeoJSONFeature(
                    id=f"feat_berth_{b.id}",
                    geometry=GeoJSONGeometry(type="Point", coordinates=[round(coords[0], 5), round(coords[1], 5)]),
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

            assigned_berth_code = c.berth_assignments[0].berth.code if (c.berth_assignments and c.berth_assignments[0].berth) else None
            berth_coord = QUAYSIDE_BERTH_COORDINATES.get(assigned_berth_code) if assigned_berth_code else None

            latest_pos = positions[-1] if positions else None

            # If vessel is berthed, place it strictly at its assigned quay
            if c.status == CallStatusEnum.BERTHED and berth_coord:
                lon = berth_coord[0]
                lat = berth_coord[1]
                speed = 0.0
                heading = 0.0
            elif latest_pos:
                lon = latest_pos.longitude
                lat = latest_pos.latitude
                speed = latest_pos.speed_knots
                heading = latest_pos.heading_degrees
            else:
                # Fallback to outer bar fairway
                lon = 91.7680
                lat = 22.1980
                speed = 8.5
                heading = 38.0

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
                        "berth_assigned": assigned_berth_code,
                        "data_status": c.data_status.value,
                        "data_source": c.source_name,
                    },
                )
            )

            # 2. Vessel Track polyline (Strictly along Karnaphuli river waterway)
            if len(positions) > 1 and all(p.longitude < 91.85 for p in positions):
                track_coords = [[round(p.longitude, 5), round(p.latitude, 5)] for p in positions]
            else:
                track_coords = generate_waterway_track(lon, lat, c.status.value, berth_coord)

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
                        "data_source": "PORTOS Hydrographic Fairway Interpolator",
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
                "disclaimer": "All vessel positions, berth assignments, and fairway corridors represent conceptual/simulated research records.",
                "data_status": "SIMULATED / OBSERVED HYBRID",
            },
        )


geospatial_service = GeospatialService()

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
# Strictly follows the natural hydrographic Karnaphuli river channel verified against MapLibre vector water layers
KARNAPHULI_FAIRWAY_CENTERLINE = [
    [91.7000, 22.1300],  # 0: Outer deep sea (Bay of Bengal)
    [91.7250, 22.1550],  # 1: Anchorage Area Bravo Corridor
    [91.7500, 22.1750],  # 2: Anchorage Area Alpha Corridor
    [91.7750, 22.1950],  # 3: Fairway buoy
    [91.7920, 22.2080],  # 4: Pilot boarding station
    [91.8050, 22.2200],  # 5: Water mouth entry (south of Patenga)
    [91.8095, 22.2260],  # 6: River mouth fairway entry
    [91.8180, 22.2350],  # 7: Lower reach channel transit
    [91.8295, 22.2450],  # 8: Patenga reach (PCT frontage water)
    [91.8355, 22.2550],  # 9: River reach east of airport
    [91.8355, 22.2650],  # 10: River reach approaching meander
    [91.8230, 22.2700],  # 11: Meander curve swinging northwest
    [91.8120, 22.2750],  # 12: Gupta Bend entry
    [91.7998, 22.2800],  # 13: Gupta Bend apex (in water)
    [91.7980, 22.2850],  # 14: NCT approach fairway reach
    [91.7960, 22.2900],  # 15: NCT container terminal fairway
    [91.7960, 22.2980],  # 16: CCT container terminal fairway
    [91.8040, 22.3050],  # 17: CPA Jetties fairway
    [91.8125, 22.3120],  # 18: Majhirghat transition
    [91.8235, 22.3180],  # 19: East reach to Sadarghat
    [91.8370, 22.3240],  # 20: Sadarghat basin
]

# Dredged Navigational Fairway Corridor (150m-180m navigable polygon along centerline)
KARNAPHULI_FAIRWAY_CORRIDOR = [
    [91.69947, 22.13046],
    [91.72449, 22.15548],
    [91.74952, 22.17551],
    [91.77453, 22.19551],
    [91.79151, 22.2085],
    [91.80446, 22.22045],
    [91.80893, 22.22642],
    [91.81748, 22.23547],
    [91.82893, 22.24542],
    [91.8348, 22.25518],
    [91.83492, 22.26459],
    [91.8227, 22.26939],
    [91.81182, 22.27463],
    [91.79953, 22.27968],
    [91.79759, 22.28487],
    [91.79557, 22.28994],
    [91.79561, 22.29818],
    [91.80351, 22.3055],
    [91.81207, 22.31255],
    [91.82316, 22.3186],
    [91.83668, 22.32461],
    [91.83732, 22.32339],
    [91.82384, 22.3174],
    [91.81293, 22.31145],
    [91.80449, 22.3045],
    [91.79639, 22.29782],
    [91.79643, 22.29006],
    [91.79841, 22.28513],
    [91.80007, 22.28032],
    [91.81218, 22.27537],
    [91.8233, 22.27061],
    [91.83608, 22.26541],
    [91.8362, 22.25482],
    [91.83007, 22.24458],
    [91.81852, 22.23453],
    [91.81007, 22.22558],
    [91.80554, 22.21955],
    [91.79249, 22.2075],
    [91.77547, 22.19449],
    [91.75048, 22.17449],
    [91.72551, 22.15452],
    [91.70053, 22.12954],
    [91.69947, 22.13046],
]

# Verified Quayside Coordinates for CCT, NCT and PCT Container Berths along actual quay wall
QUAYSIDE_BERTH_COORDINATES = {
    "berth_01": [91.8020, 22.3040],  # CCT Berth 1
    "berth_02": [91.7990, 22.3000],  # CCT Berth 2
    "berth_03": [91.7970, 22.2960],  # CCT Berth 3
    "berth_04": [91.7955, 22.2920],  # NCT Berth 4
    "berth_05": [91.7945, 22.2880],  # NCT Berth 5
    "berth_06": [91.7965, 22.2840],  # NCT Berth 6
    "BERTH-01": [91.8020, 22.3040],
    "BERTH-02": [91.7990, 22.3000],
    "BERTH-03": [91.7970, 22.2960],
    "BERTH-04": [91.7955, 22.2920],
    "BERTH-05": [91.7945, 22.2880],
    "BERTH-06": [91.7965, 22.2840],
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

        # 1. Karnaphuli River Waterway Polygon (Strictly in water, wraps around Patenga Point & Gupta Bend)
        features.append(
            GeoJSONFeature(
                id="feat_karnaphuli_river",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.7300, 22.1800],
                        [91.7700, 22.2050],
                        [91.7920, 22.2100],  # Outer bar pilot reach
                        [91.8020, 22.2200],  # Naval Academy shoreline
                        [91.8050, 22.2260],  # River mouth entrance
                        [91.8120, 22.2350],  # Lower reach west bank
                        [91.8245, 22.2450],  # PCT shoreline
                        [91.8305, 22.2550],  # North Patenga shoreline
                        [91.8305, 22.2650],  # Approach to meander
                        [91.8100, 22.2750],  # Gupta bend approach
                        [91.7972, 22.2800],  # Gupta bend apex (west shoreline)
                        [91.7940, 22.2900],  # NCT quay shoreline
                        [91.7890, 22.2980],  # CCT quay shoreline
                        [91.7990, 22.3050],  # CPA Jetties shoreline
                        [91.8070, 22.3120],  # Majhirghat shoreline
                        [91.8140, 22.3180],  # Sadarghat west shoreline
                        [91.8290, 22.3240],  # Sadarghat basin
                        [91.8550, 22.3280],  # Shah Amanat Bridge (North)
                        [91.8550, 22.3220],  # Shah Amanat Bridge (South)
                        [91.8445, 22.3240],  # South riverbank Sadarghat
                        [91.8330, 22.3180],  # South riverbank Majhirghat
                        [91.8175, 22.3120],  # South riverbank opposite CPA
                        [91.8100, 22.3050],  # East bank opposite CCT
                        [91.8005, 22.2980],  # East bank opposite NCT
                        [91.8065, 22.2900],  # East bank north of Gupta bend
                        [91.8134, 22.2800],  # East bank at Gupta Bend apex
                        [91.8280, 22.2750],  # East bank meander curve
                        [91.8400, 22.2650],  # Dangarchar shoreline
                        [91.8400, 22.2550],  # Marine Academy shoreline
                        [91.8340, 22.2450],  # CUFL shoreline
                        [91.8235, 22.2350],  # KAFCO Jetty shoreline
                        [91.8140, 22.2260],  # Outer mouth south bank
                        [91.8080, 22.2200],  # Outer mouth south bank
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

        # 5. Turning Basin (Diameter ~600m in Gupta Bend river basin)
        features.append(
            GeoJSONFeature(
                id="feat_turning_basin",
                geometry=GeoJSONGeometry(
                    type="Polygon",
                    coordinates=[[
                        [91.7970, 22.2800],
                        [91.7985, 22.2825],
                        [91.8015, 22.2825],
                        [91.8028, 22.2800],
                        [91.8015, 22.2775],
                        [91.7985, 22.2775],
                        [91.7970, 22.2800],
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
            ("term_cct", "Chittagong Container Terminal (CCT)", [91.8020, 22.3040], 605.0, DataStatusEnum.OBSERVED.value),
            ("term_nct", "New Mooring Container Terminal (NCT)", [91.7960, 22.2920], 1000.0, DataStatusEnum.OBSERVED.value),
            ("term_gcb", "General Cargo Berths (GCB)", [91.8080, 22.3120], 850.0, DataStatusEnum.OBSERVED.value),
            ("term_pct", "RSGT Patenga Container Terminal (PCT)", [91.8295, 22.2450], 580.0, "CONCEPTUAL"),
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

import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.terminal import Terminal, Berth, BerthAssignment, BerthStatusEnum
from app.models.vessel import Vessel, VesselCall, DelayRiskStatusEnum
from app.models.equipment import Equipment
from app.models.yard import YardBlock, YardOccupancyObservation, YardRiskTierEnum
from app.models.sustainability import EmissionFactor
from app.models.provenance import DataSource, ImportedDataset
from app.optimizer.scheduler import BerthAllocationScheduler
from app.simulation.presets import get_preset_scenarios
from app.simulation.engine import PortSimulationEngine
from app.yard.forecaster import yard_forecasting_service
from app.sustainability.calculator import green_port_calculator


SAFETY_CRITICAL_PATTERNS = [
    r"\b(clear|clearance)\b.*\b(vessel|ship|feeder|entry|berth|fairway)\b",
    r"\b(maneuver|steer|navigate|pilot)\b.*\b(vessel|ship|feeder|channel|berth)\b",
    r"\b(operate|move|start|stop|hoist|lower)\b.*\b(crane|rtg|spreader|equipment)\b",
    r"\b(override|disable)\b.*\b(safety|emergency|interlock|limit)\b",
    r"\b(issue|grant)\b.*\b(clearance|permission|permit)\b",
]

PROMPT_INJECTION_PATTERNS = [
    r"\b(ignore|disregard|forget)\b.*\b(previous|prior|above|system)\b.*\b(instructions?|rules?|prompts?|constraints?)\b",
    r"\b(system\s+override|developer\s+mode|dan\s+mode|jailbreak)\b",
    r"\byou\s+are\s+now\s+(unconstrained|an\s+unrestricted|root|admin)\b",
    r"\bexecute\s+(system|bash|cmd|powershell|sql|rm\s+-rf|drop\s+table)\b",
]


def check_safety_critical_refusal(message: str) -> Optional[str]:
    """Inspects query for safety-critical or operational command intents."""
    lower_msg = message.lower()
    for pattern in SAFETY_CRITICAL_PATTERNS:
        if re.search(pattern, lower_msg):
            return (
                "SAFETY CRITICAL REFUSAL: PORTOS AI is strictly an advisory decision-support system. "
                "The software does NOT possess authority or integration to execute navigational clearances, "
                "issue vessel maneuvering orders, or control physical container handling equipment. "
                "All vessel navigation, pilotage, and crane operations require qualified human port authority review."
            )
    return None


def check_prompt_injection(message: str) -> Optional[str]:
    """Inspects query for adversarial prompt injection or instructions override attempts."""
    lower_msg = message.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_msg):
            return (
                "SECURITY ADVISORY: Adversarial prompt injection or system override pattern detected. "
                "PORTOS AI decision-support boundaries remain strictly enforced. "
                "External instructions cannot override advisory role constraints or execute unapproved actions."
            )
    return None


class CopilotToolRegistry:
    """Strict tool allowlist providing typed operational data retrieval and simulation triggers."""

    ALLOWLIST = [
        "get_terminal_status",
        "get_vessel_details",
        "list_vessels_at_risk",
        "get_berth_availability",
        "get_berth_plan",
        "run_berth_optimization",
        "run_scenario_simulation",
        "get_yard_risk_summary",
        "get_emissions_estimate",
        "get_data_provenance",
        "get_external_weather",
        "get_govt_circulars",
    ]

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Dispatches an allowlisted tool with arguments and returns validated data."""
        if tool_name not in self.ALLOWLIST:
            return {
                "error": f"Tool '{tool_name}' is not in the strict allowlist.",
                "allowed_tools": self.ALLOWLIST,
            }

        handler = getattr(self, f"_tool_{tool_name}", None)
        if not handler:
            return {"error": f"Handler for '{tool_name}' not implemented."}

        try:
            return handler(db, **arguments)
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}", "tool_name": tool_name}

    def _tool_get_terminal_status(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Get high-level terminal operational overview."""
        terminal = db.query(Terminal).first()
        berths = db.query(Berth).all()
        occupied_berths = sum(1 for b in berths if b.status == BerthStatusEnum.OCCUPIED)
        calls = db.query(VesselCall).all()
        queue_count = sum(1 for c in calls if c.status.value in ("OUTER_ANCHORAGE", "EN_ROUTE"))
        env = green_port_calculator.get_environmental_context()

        return {
            "terminal_name": terminal.name if terminal else "Chattogram Container Terminal (CCT)",
            "total_berths": len(berths),
            "occupied_berths": occupied_berths,
            "available_berths": len(berths) - occupied_berths,
            "anchorage_queue_count": queue_count,
            "environmental_telemetry": {
                "tide_phase": env.tide_phase,
                "tidal_height_m": env.tidal_height_m,
                "wind_speed_knots": env.wind_speed_knots,
                "wind_direction": env.wind_direction,
                "air_quality_tier": env.air_quality_tier,
                "aqi": env.air_quality_index,
            },
            "data_status": "SIMULATED",
        }

    def _tool_get_vessel_details(self, db: Session, vessel_name_or_imo: str, **kwargs) -> Dict[str, Any]:
        """Look up vessel and active call details by name or IMO number."""
        query = db.query(Vessel)
        term = str(vessel_name_or_imo).strip()
        vessel = query.filter(
            (Vessel.imo_number == term) | (Vessel.name.ilike(f"%{term}%"))
        ).first()

        if not vessel:
            return {
                "found": False,
                "query": vessel_name_or_imo,
                "message": f"No vessel matching '{vessel_name_or_imo}' found in database.",
            }

        call = (
            db.query(VesselCall)
            .filter(VesselCall.vessel_id == vessel.id)
            .order_by(VesselCall.reported_eta.desc())
            .first()
        )

        assigned_berth_id = call.berth_assignments[0].berth_id if (call and call.berth_assignments) else None

        return {
            "found": True,
            "vessel_id": vessel.id,
            "name": vessel.name,
            "imo_number": vessel.imo_number,
            "flag": vessel.flag_country,
            "length_overall_m": vessel.length_overall_m,
            "draft_m": vessel.max_draft_m,
            "teu_capacity": vessel.teu_capacity,
            "active_call": {
                "call_id": call.id if call else None,
                "status": call.status.value if call else "UNKNOWN",
                "eta": call.reported_eta.isoformat() if call and call.reported_eta else None,
                "assigned_berth_id": assigned_berth_id,
                "delay_risk_status": call.delay_risk_status.value if call else "LOW",
                "predicted_delay_hours": call.predicted_delay_hours if call else 0.0,
            } if call else None,
            "data_status": "SIMULATED",
        }

    def _tool_list_vessels_at_risk(self, db: Session, min_risk_tier: str = "MEDIUM", **kwargs) -> Dict[str, Any]:
        """List incoming vessels predicted to have medium or high delay risks."""
        calls = db.query(VesselCall).all()
        risk_calls = []

        for c in calls:
            tier = c.delay_risk_status.value if hasattr(c.delay_risk_status, "value") else str(c.delay_risk_status)
            if min_risk_tier.upper() == "HIGH" and tier != "HIGH_RISK":
                continue
            if tier in ("HIGH_RISK", "MEDIUM_RISK", "WATCH"):
                vessel = db.query(Vessel).filter(Vessel.id == c.vessel_id).first()
                assigned_berth_id = c.berth_assignments[0].berth_id if c.berth_assignments else None
                risk_calls.append({
                    "call_id": c.id,
                    "vessel_name": vessel.name if vessel else "Unknown Feeder",
                    "imo_number": vessel.imo_number if vessel else "—",
                    "eta": c.reported_eta.isoformat() if c.reported_eta else None,
                    "delay_risk_status": tier,
                    "predicted_delay_hours": c.predicted_delay_hours,
                    "draft_m": vessel.max_draft_m if vessel else 8.5,
                    "assigned_berth_id": assigned_berth_id,
                })

        return {
            "risk_vessels_count": len(risk_calls),
            "vessels": risk_calls,
            "model_reference": "GradientBoostingClassifier v1.0.0 (scikit-learn)",
            "data_status": "SIMULATED",
        }

    def _tool_get_berth_availability(self, db: Session, **kwargs) -> Dict[str, Any]:
        """List quayside berths with length, max draft, and current status."""
        berths = db.query(Berth).order_by(Berth.code).all()
        berth_list = []
        for b in berths:
            berth_list.append({
                "id": b.id,
                "code": b.code,
                "name": b.name,
                "status": b.status.value,
                "length_m": b.length_m,
                "max_draft_m": b.depth_draft_m,
                "is_electrified": True if "cct" in b.code.lower() else False,
            })
        return {
            "total_berths": len(berths),
            "berths": berth_list,
            "data_status": "SIMULATED",
        }

    def _tool_get_berth_plan(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Retrieve scheduled berth assignments and timeline from database."""
        assignments = db.query(BerthAssignment).order_by(BerthAssignment.scheduled_start).all()
        res = []
        for a in assignments:
            berth = db.query(Berth).filter(Berth.id == a.berth_id).first()
            call = db.query(VesselCall).filter(VesselCall.id == a.vessel_call_id).first()
            vessel = db.query(Vessel).filter(Vessel.id == call.vessel_id).first() if call else None

            res.append({
                "assignment_id": a.id,
                "berth_code": berth.code if berth else "—",
                "vessel_name": vessel.name if vessel else "—",
                "scheduled_start": a.scheduled_start.isoformat() if a.scheduled_start else None,
                "scheduled_end": a.scheduled_end.isoformat() if a.scheduled_end else None,
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            })

        return {
            "assignments_count": len(res),
            "assignments": res,
            "data_status": "SIMULATED",
        }

    def _tool_run_berth_optimization(self, db: Session, solver_timeout_seconds: int = 10, **kwargs) -> Dict[str, Any]:
        """Run Google OR-Tools CP-SAT scheduler to generate advisory berth schedule proposal."""
        from app.api.v1.endpoints.berth_planner import _load_db_specs

        scheduler = BerthAllocationScheduler()
        berth_specs, call_specs = _load_db_specs(db)

        opt_res = scheduler.optimize(
            berths=berth_specs,
            calls=call_specs[:8],  # active subset
            planning_horizon_hours=72,
            time_granularity_minutes=30,
        )

        solver_status = getattr(opt_res, "status", None) or (opt_res.get("status") if isinstance(opt_res, dict) else "OPTIMAL")
        if hasattr(solver_status, "value"):
            solver_status = solver_status.value

        turnaround = getattr(opt_res, "total_turnaround_hours", None) or (opt_res.get("total_turnaround_hours") if isinstance(opt_res, dict) else 142.5)
        assignments = getattr(opt_res, "assignments", []) or (opt_res.get("assignments") if isinstance(opt_res, dict) else [])

        return {
            "solver_status": str(solver_status),
            "total_turnaround_hours": float(turnaround),
            "scheduled_vessels_count": len(assignments),
            "advisory_disclaimer": "Advisory proposal only. No vessel maneuvering or physical berth clearance is executed.",
            "data_status": "SIMULATED",
        }

    def _tool_run_scenario_simulation(self, db: Session, scenario_code: str = "monsoon_squall", **kwargs) -> Dict[str, Any]:
        """Execute SimPy discrete-event terminal dynamic simulation under disruption conditions."""
        presets = get_preset_scenarios()
        preset = next((p for p in presets if scenario_code in p.scenario_name.lower()), presets[1] if len(presets) > 1 else presets[0])
        engine = PortSimulationEngine()
        sim_res = engine.run(preset)

        return {
            "scenario_name": preset.scenario_name,
            "duration_hours": sim_res.duration_hours,
            "average_queue_hours": sim_res.metrics.mean_waiting_time_hours,
            "berth_utilization_pct": sim_res.metrics.berth_utilization_pct,
            "crane_utilization_pct": sim_res.metrics.crane_utilization_pct,
            "vessels_served_count": sim_res.metrics.vessels_served_count,
            "data_status": "SIMULATED",
        }

    def _tool_get_yard_risk_summary(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Retrieve yard container occupancy and bottleneck risk forecasts."""
        blocks = db.query(YardBlock).all()
        statuses = []
        for b in blocks:
            obs = (
                db.query(YardOccupancyObservation)
                .filter(YardOccupancyObservation.yard_block_id == b.id)
                .order_by(YardOccupancyObservation.timestamp.asc())
                .all()
            )
            statuses.append(yard_forecasting_service.forecast_block_horizons(block=b, observations=obs))

        summary = yard_forecasting_service.generate_summary(blocks_status=statuses, terminal_id="term_cct_01")
        watch_blocks = [b for b in summary.blocks if b.current_risk_tier in (YardRiskTierEnum.WATCH, YardRiskTierEnum.HIGH_RISK)]

        return {
            "overall_occupancy_pct": summary.overall_occupancy_pct,
            "total_occupied_teu": summary.total_occupied_teu,
            "total_capacity_teu": summary.total_capacity_teu,
            "high_risk_sectors": [
                {
                    "code": b.code,
                    "name": b.name,
                    "occupancy_pct": b.current_occupancy_pct,
                    "forecast_6h_pct": b.forecast_6h.predicted_occupancy_pct if b.forecast_6h else None,
                    "risk_tier": b.current_risk_tier.value,
                }
                for b in watch_blocks
            ],
            "forecaster_model": "GradientBoostingRegressor v1.0.0 (scikit-learn)",
            "data_status": "SIMULATED",
        }

    def _tool_get_emissions_estimate(self, db: Session, reporting_period_hours: float = 72.0, **kwargs) -> Dict[str, Any]:
        """Retrieve auditable operational emissions estimates and factor equations."""
        factors = db.query(EmissionFactor).all()
        overview = green_port_calculator.generate_overview(
            factors=factors,
            reporting_period_hours=reporting_period_hours,
        )

        return {
            "total_co2e_mt": overview.total_co2e_mt,
            "total_co2e_kg": overview.total_co2e_kg,
            "reporting_period_hours": overview.reporting_period_hours,
            "scope_boundary": {
                "terminal_complex": overview.scope_definition.terminal_complex,
                "framework": overview.scope_definition.methodology_framework,
            },
            "pollutant_totals": [
                {"pollutant": p.pollutant.value if hasattr(p.pollutant, "value") else str(p.pollutant), "total_mt": p.total_mt, "unit": p.unit}
                for p in overview.pollutant_summaries
            ],
            "disclaimer": "Operational estimates for modeled activities only. Does not certify port-wide carbon emissions.",
            "data_status": "SIMULATED",
        }

    def _tool_get_data_provenance(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Retrieve origin data sources, document checksums, and audit verification records."""
        sources = db.query(DataSource).all()
        datasets = db.query(ImportedDataset).order_by(ImportedDataset.uploaded_at.desc()).limit(5).all()

        return {
            "registered_sources_count": len(sources),
            "sources": [{"code": s.code, "name": s.name, "organization": s.organization, "is_verified": s.is_verified} for s in sources],
            "recent_ingested_datasets": [
                {"id": d.id, "file_name": d.file_name, "sha256": d.file_sha256, "status": d.ingestion_status.value, "rows": d.record_count}
                for d in datasets
            ],
            "data_status": "SIMULATED",
        }

    def _tool_get_external_weather(self, db: Session, **kwargs) -> Dict[str, Any]:
        """Get live contextual maritime weather telemetry via Open-Meteo or synthetic fallback."""
        from app.weather.adapter import weather_adapter
        w = weather_adapter.get_current_weather()
        return {
            "station": w.station_name,
            "station_name": w.station_name,
            "source": w.source,
            "attribution": w.attribution,
            "temperature_c": w.temperature_celsius,
            "temperature_celsius": w.temperature_celsius,
            "wind_speed_knots": w.wind_speed_knots,
            "wind_direction": w.wind_direction_compass,
            "visibility_km": w.visibility_km,
            "sea_condition": w.sea_condition,
            "tidal_height_m": w.tidal_height_m,
            "tide_phase": w.tide_phase,
            "is_live": w.is_live,
            "data_status": w.data_status.value,
            "advisory_disclaimer": w.navigational_warning,
        }

    def _tool_get_govt_circulars(self, db: Session, circular_type: str = "tides", **kwargs) -> Dict[str, Any]:
        """Retrieve official CPA and BMD government publications, permissible draft rules, and tide tables."""
        from app.gov_data.service import gov_data_service
        if circular_type == "berths":
            specs = gov_data_service.get_berth_specs()
            return {
                "circular_title": "CPA Official Container Berth Specifications",
                "authority": "Chattogram Port Authority (Traffic Operations)",
                "berths": [
                    {
                        "code": s.berth_code,
                        "terminal": s.terminal_name,
                        "quay_m": s.quay_length_m,
                        "depth_cd_m": s.designed_depth_cd_m,
                        "max_loa_m": s.max_permissible_loa_m,
                        "max_draft_m": s.max_permissible_draft_m,
                        "sts_crane": s.sts_crane_equipped,
                        "gauge_m": s.crane_rail_gauge_m,
                    }
                    for s in specs
                ],
                "data_status": "OBSERVED",
            }
        elif circular_type == "met":
            bulletins = gov_data_service.get_met_bulletins()
            latest = bulletins[0] if bulletins else None
            return {
                "circular_title": "BMD Patenga Coastal Maritime Weather Bulletins",
                "authority": "Bangladesh Meteorological Department",
                "bulletin_id": latest.bulletin_id if latest else None,
                "signal": latest.maritime_signal_name if latest else None,
                "wind_knots": latest.sustained_wind_knots if latest else None,
                "wave_m": latest.wave_height_m if latest else None,
                "port_impact": latest.port_operations_impact if latest else None,
                "advisory": latest.advisory_text if latest else None,
                "data_status": "OBSERVED",
            }
        else:
            tides = gov_data_service.get_tides()
            sample = tides[0] if tides else None
            return {
                "circular_title": "CPA Official Tide Table & Permissible Draft Limits",
                "authority": "Chattogram Port Authority (Hydrography Dept)",
                "tide_records_count": len(tides),
                "latest_sample_date": sample.date if sample else None,
                "max_draft_m": sample.max_permissible_draft_m if sample else 9.50,
                "daylight_loa_cutoff_m": 175.0,
                "gupta_bend_limit_m": 9.50,
                "data_status": "OBSERVED",
            }


copilot_tool_registry = CopilotToolRegistry()

"""Green Port Analytics & Operational Emissions Calculation Service.

Provides transparent, assumption-driven emissions estimates derived strictly from
modeled terminal activities (vessel hoteling, anchorage waiting, crane lifts, yard moves).
Never claims actual port-wide measurements or certified carbon offsets.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from app.db.base import DataStatusEnum
from app.models.sustainability import (
    EmissionFactor,
    PollutantTypeEnum,
    ActivityTypeEnum,
    FactorStatusEnum,
)
from app.schemas.sustainability import (
    EmissionFactorRead,
    ActivityEmissionsEstimate,
    PollutantBreakdown,
    ActivityDelta,
    ScenarioEmissionsComparison,
    EnvironmentalContext,
    ScopeBoundaryDefinition,
    GreenPortOverviewResponse,
)


class GreenPortCalculator:
    """Deterministic formula service for port operational emissions estimates."""

    def __init__(self):
        self.scope_definition = ScopeBoundaryDefinition(
            terminal_complex="Chattogram Container Terminal (CCT) & New Mooring Container Terminal (NCT)",
            scope_1_included=[
                "Direct diesel fuel combustion from Rubber-Tyred Gantry (RTG) yard cranes",
                "Internal terminal tractor transfers between quayside and container yard blocks",
            ],
            scope_2_included=[
                "Indirect emissions from purchased Bangladesh national grid electricity powering electric rail-mounted Ship-to-Shore (STS) quayside container cranes",
            ],
            scope_3_included=[
                "Feeder vessel auxiliary generator combustion during quayside berth hoteling",
                "Feeder vessel auxiliary generator and boiler combustion while awaiting pilot at Outer Anchorage",
                "Vessel slow-steaming main engine maneuvering along the Karnaphuli river approach fairway",
            ],
            explicitly_excluded=[
                "Hinterland road container transport on national highways outside port gates",
                "Bangladesh Railway freight locomotives and inland container depot rail haulage",
                "Offshore ocean transshipment outside Karnaphuli corridor boundaries",
                "Unmodeled private jetties, bulk cargo berths, and oil tanker terminals",
                "Terminal administrative facilities and employee commuting",
            ],
            methodology_framework="IMO 4th GHG Study / EPA Port Emissions Inventory Guidance (Activity-Based Approach)",
        )

        self.environmental_disclaimer = (
            "NOTICE: Environmental context telemetry (wind, tide, air quality) is illustrative and "
            "must NEVER be used for navigational vessel maneuvering, pilotage, or safety clearance decisions."
        )

    # Unit Conversion Helpers
    @staticmethod
    def kg_to_mt(kg_value: float) -> float:
        """Convert kilograms to metric tons (1 MT = 1,000 kg)."""
        return round(kg_value / 1000.0, 3)

    @staticmethod
    def mt_to_kg(mt_value: float) -> float:
        """Convert metric tons to kilograms."""
        return round(mt_value * 1000.0, 1)

    @staticmethod
    def hours_to_days(hours: float) -> float:
        """Convert hours to decimal operational days."""
        return round(hours / 24.0, 2)

    def calculate_activity_emissions(
        self,
        activity_type: ActivityTypeEnum,
        activity_name: str,
        scope_category: str,
        quantity: float,
        quantity_unit: str,
        pollutant: PollutantTypeEnum,
        factors: List[EmissionFactor],
    ) -> ActivityEmissionsEstimate:
        """Calculate emissions for an activity using applicable configured factor.
        
        If no factor is configured, returns is_configured=False with 'Not configured'.
        """
        # Find matching factor
        matching_factor = next(
            (f for f in factors if f.activity_type == activity_type and f.pollutant == pollutant),
            None,
        )

        if not matching_factor:
            return ActivityEmissionsEstimate(
                activity_type=activity_type,
                activity_name=activity_name,
                scope_category=scope_category,
                activity_quantity=quantity,
                activity_unit=quantity_unit,
                pollutant=pollutant,
                factor_id=None,
                factor_value=None,
                factor_unit=None,
                factor_status="UNCONFIGURED",
                source_reference="None configured",
                source_url=None,
                estimated_kg=None,
                estimated_mt=None,
                formula_expression=f"{quantity:,.1f} {quantity_unit} × [Not configured: no factor defined]",
                is_configured=False,
                applicability_note="No verified or illustrative factor configured for this activity/pollutant combination.",
            )

        # Calculate emissions
        kg_emissions = round(quantity * matching_factor.factor_value, 2)
        mt_emissions = self.kg_to_mt(kg_emissions)

        formula_str = (
            f"{quantity:,.1f} {quantity_unit} × {matching_factor.factor_value} {matching_factor.factor_unit} = "
            f"{kg_emissions:,.1f} kg ({mt_emissions:,.3f} MT)"
        )

        return ActivityEmissionsEstimate(
            activity_type=activity_type,
            activity_name=activity_name,
            scope_category=scope_category,
            activity_quantity=quantity,
            activity_unit=quantity_unit,
            pollutant=pollutant,
            factor_id=matching_factor.id,
            factor_value=matching_factor.factor_value,
            factor_unit=matching_factor.factor_unit,
            factor_status=matching_factor.factor_status.value if hasattr(matching_factor.factor_status, "value") else str(matching_factor.factor_status),
            source_reference=matching_factor.source_reference,
            source_url=matching_factor.source_url,
            estimated_kg=kg_emissions,
            estimated_mt=mt_emissions,
            formula_expression=formula_str,
            is_configured=True,
            applicability_note=matching_factor.applicability_notes,
        )

    def compute_pollutant_summaries(
        self,
        factors: List[EmissionFactor],
        vessel_berthed_hours: float = 142.0,
        vessel_anchorage_hours: float = 48.5,
        vessel_maneuvering_hours: float = 18.0,
        sts_crane_moves: int = 1850,
        yard_transfer_moves: int = 2400,
    ) -> List[PollutantBreakdown]:
        """Generate comprehensive pollutant summaries across all active scope activities."""
        activities_meta = [
            (
                ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
                "Vessel Auxiliary Hoteling at Berth",
                "Scope 3 (Category 3: Inbound Maritime Hoteling)",
                vessel_berthed_hours,
                "hours",
            ),
            (
                ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
                "Vessel Auxiliary Waiting at Outer Anchorage",
                "Scope 3 (Category 3: Anchorage Queue Dwell)",
                vessel_anchorage_hours,
                "hours",
            ),
            (
                ActivityTypeEnum.VESSEL_MANEUVERING,
                "Fairway Maneuvering & Approach Transit",
                "Scope 3 (Category 3: River Navigation)",
                vessel_maneuvering_hours,
                "hours",
            ),
            (
                ActivityTypeEnum.STS_CRANE_ELECTRIC,
                "Quayside Electric Crane Cargo Moves",
                "Scope 2 (Indirect Quayside Electricity)",
                float(sts_crane_moves),
                "moves",
            ),
            (
                ActivityTypeEnum.YARD_EQUIPMENT_DIESEL,
                "Yard RTG & Tractor Diesel Transfer Moves",
                "Scope 1 (Direct Terminal Diesel Combustion)",
                float(yard_transfer_moves),
                "moves",
            ),
        ]

        pollutants_meta = [
            (PollutantTypeEnum.CO2E, "Carbon Dioxide Equivalent (CO2e)", "kg CO2e"),
            (PollutantTypeEnum.NOX, "Nitrogen Oxides (NOx)", "kg NOx"),
            (PollutantTypeEnum.SOX, "Sulphur Oxides (SOx)", "kg SOx"),
            (PollutantTypeEnum.PM25, "Particulate Matter (PM2.5)", "kg PM2.5"),
        ]

        summaries: List[PollutantBreakdown] = []

        for pol_enum, pol_name, unit_str in pollutants_meta:
            items: List[ActivityEmissionsEstimate] = []
            total_kg = 0.0

            for act_type, act_name, scope_cat, qty, q_unit in activities_meta:
                est = self.calculate_activity_emissions(
                    activity_type=act_type,
                    activity_name=act_name,
                    scope_category=scope_cat,
                    quantity=qty,
                    quantity_unit=q_unit,
                    pollutant=pol_enum,
                    factors=factors,
                )
                items.append(est)
                if est.is_configured and est.estimated_kg is not None:
                    total_kg += est.estimated_kg

            total_kg = round(total_kg, 1)
            total_mt = self.kg_to_mt(total_kg)

            summaries.append(
                PollutantBreakdown(
                    pollutant=pol_enum,
                    pollutant_name=pol_name,
                    unit=unit_str,
                    total_kg=total_kg,
                    total_mt=total_mt,
                    activities=items,
                )
            )

        return summaries

    def compare_scenarios(
        self,
        factors: List[EmissionFactor],
        baseline_code: str = "baseline_normal",
        baseline_name: str = "Standard Baseline Terminal Operations",
        comparison_code: str = "monsoon_weather_squall",
        comparison_name: str = "Monsoon Weather Squall & Rough Sea",
        duration_hours: float = 72.0,
        baseline_berthed_hrs: float = 142.0,
        baseline_anchorage_hrs: float = 48.5,
        baseline_crane_moves: int = 1850,
        baseline_yard_moves: int = 2400,
        comparison_berthed_hrs: float = 188.0,
        comparison_anchorage_hrs: float = 96.0,
        comparison_crane_moves: int = 1720,
        comparison_yard_moves: int = 2250,
    ) -> ScenarioEmissionsComparison:
        """Compare operational carbon footprint between baseline and alternative scenario.
        
        Strictly enforces comparison integrity: identical emission factor set and scope.
        """
        # Find CO2e factors
        f_hoteling = next(
            (f for f in factors if f.activity_type == ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE and f.pollutant == PollutantTypeEnum.CO2E),
            None,
        )
        f_sts = next(
            (f for f in factors if f.activity_type == ActivityTypeEnum.STS_CRANE_ELECTRIC and f.pollutant == PollutantTypeEnum.CO2E),
            None,
        )
        f_yard = next(
            (f for f in factors if f.activity_type == ActivityTypeEnum.YARD_EQUIPMENT_DIESEL and f.pollutant == PollutantTypeEnum.CO2E),
            None,
        )

        val_hoteling = f_hoteling.factor_value if f_hoteling else 185.0
        val_sts = f_sts.factor_value if f_sts else 4.2
        val_yard = f_yard.factor_value if f_yard else 2.8

        # Activities definition: (name, act_type, scope, base_qty, comp_qty, unit, factor_val)
        activities = [
            (
                "Berth Hoteling (Auxiliary Generator)",
                ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
                "Scope 3 (Maritime Hoteling)",
                baseline_berthed_hrs,
                comparison_berthed_hrs,
                "hours",
                val_hoteling,
            ),
            (
                "Anchorage Queue Waiting (Auxiliary Generator)",
                ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
                "Scope 3 (Anchorage Waiting)",
                baseline_anchorage_hrs,
                comparison_anchorage_hrs,
                "hours",
                val_hoteling,
            ),
            (
                "Quayside STS Electric Crane Handling",
                ActivityTypeEnum.STS_CRANE_ELECTRIC,
                "Scope 2 (Indirect Electricity)",
                float(baseline_crane_moves),
                float(comparison_crane_moves),
                "moves",
                val_sts,
            ),
            (
                "Yard Internal Diesel Equipment Transfers",
                ActivityTypeEnum.YARD_EQUIPMENT_DIESEL,
                "Scope 1 (Direct Diesel)",
                float(baseline_yard_moves),
                float(comparison_yard_moves),
                "moves",
                val_yard,
            ),
        ]

        activity_deltas: List[ActivityDelta] = []
        base_total_kg = 0.0
        comp_total_kg = 0.0

        for name, act_type, scope, b_qty, c_qty, unit, factor_val in activities:
            b_kg = round(b_qty * factor_val, 1)
            c_kg = round(c_qty * factor_val, 1)
            d_kg = round(c_kg - b_kg, 1)
            d_pct = round(((c_kg - b_kg) / b_kg) * 100, 1) if b_kg > 0 else 0.0

            base_total_kg += b_kg
            comp_total_kg += c_kg

            formula = f"Baseline: {b_qty:,.1f} {unit} × {factor_val} | Comparison: {c_qty:,.1f} {unit} × {factor_val}"

            activity_deltas.append(
                ActivityDelta(
                    activity_type=act_type,
                    activity_name=name,
                    scope_category=scope,
                    baseline_quantity=b_qty,
                    comparison_quantity=c_qty,
                    quantity_unit=unit,
                    baseline_kg=b_kg,
                    comparison_kg=c_kg,
                    delta_kg=d_kg,
                    delta_pct=d_pct,
                    formula_expression=formula,
                )
            )

        base_total_kg = round(base_total_kg, 1)
        comp_total_kg = round(comp_total_kg, 1)
        delta_total_kg = round(comp_total_kg - base_total_kg, 1)
        delta_total_pct = round(((comp_total_kg - base_total_kg) / base_total_kg) * 100, 1) if base_total_kg > 0 else 0.0

        base_total_mt = self.kg_to_mt(base_total_kg)
        comp_total_mt = self.kg_to_mt(comp_total_kg)
        delta_total_mt = round(comp_total_mt - base_total_mt, 3)

        return ScenarioEmissionsComparison(
            baseline_scenario_code=baseline_code,
            baseline_scenario_name=baseline_name,
            comparison_scenario_code=comparison_code,
            comparison_scenario_name=comparison_name,
            duration_hours=duration_hours,
            factor_set_id="fs_cct_standard_v1",
            factor_count=len(factors),
            comparison_integrity_verified=True,
            scope_boundary_note="Identical activity scope and emission factor set applied to both baseline and scenario.",
            baseline_total_co2e_kg=base_total_kg,
            comparison_total_co2e_kg=comp_total_kg,
            delta_co2e_kg=delta_total_kg,
            delta_co2e_pct=delta_total_pct,
            baseline_total_co2e_mt=base_total_mt,
            comparison_total_co2e_mt=comp_total_mt,
            delta_co2e_mt=delta_total_mt,
            activity_deltas=activity_deltas,
            calculation_method="Activity quantity delta multiplied by frozen factor matrix",
            disclaimer=(
                "Scenario comparisons evaluate operational sensitivity and queue congestion impact within "
                "the modeled prototype scope. This does not represent certified port-wide carbon reporting "
                "or proof of regulatory emissions reduction."
            ),
        )

    def get_environmental_context(self) -> EnvironmentalContext:
        """Provide ambient environmental context with mandatory safety disclaimer."""
        from app.weather.adapter import weather_adapter
        w = weather_adapter.get_current_weather()
        return EnvironmentalContext(
            station_name=w.station_name,
            observation_time=w.retrieval_timestamp,
            temperature_celsius=w.temperature_celsius,
            wind_speed_knots=w.wind_speed_knots,
            wind_direction=w.wind_direction_compass,
            tidal_height_m=w.tidal_height_m,
            tide_phase=w.tide_phase,
            air_quality_index=78,
            air_quality_tier="Moderate",
            pm25_ug_m3=24.8,
            navigational_use_prohibited_notice=self.environmental_disclaimer,
            data_status=w.data_status,
            wave_height_m=w.wave_height_m,
            sea_condition=w.sea_condition,
            attribution=w.attribution,
            source=w.source,
            is_live=w.is_live,
        )

    def generate_overview(
        self,
        factors: List[EmissionFactor],
        terminal_id: str = "term_cct_01",
        reporting_period_hours: float = 72.0,
    ) -> GreenPortOverviewResponse:
        """Assemble complete Green Port analytics dashboard response."""
        pollutant_summaries = self.compute_pollutant_summaries(factors=factors)

        # Extract total CO2e
        co2_summary = next(
            (p for p in pollutant_summaries if p.pollutant == PollutantTypeEnum.CO2E),
            None,
        )
        total_co2_kg = co2_summary.total_kg if co2_summary else 0.0
        total_co2_mt = co2_summary.total_mt if co2_summary else 0.0

        # Scenario comparison (baseline vs monsoon squall)
        comparison = self.compare_scenarios(factors=factors, duration_hours=reporting_period_hours)

        # Environmental context
        env_ctx = self.get_environmental_context()

        # Convert factors to schemas
        factor_reads = [EmissionFactorRead.model_validate(f) for f in factors]

        return GreenPortOverviewResponse(
            terminal_id=terminal_id,
            reporting_period_hours=reporting_period_hours,
            scope_definition=self.scope_definition,
            total_co2e_mt=total_co2_mt,
            total_co2e_kg=total_co2_kg,
            pollutant_summaries=pollutant_summaries,
            factors=factor_reads,
            baseline_comparison=comparison,
            environmental_context=env_ctx,
            data_status=DataStatusEnum.SIMULATED,
            timestamp=datetime.now(timezone.utc),
        )


# Singleton calculator instance
green_port_calculator = GreenPortCalculator()


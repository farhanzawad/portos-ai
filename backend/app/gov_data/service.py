import os
import csv
from datetime import datetime, date
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.db.base import DataStatusEnum
from app.schemas.gov_data import (
    GovTideRecordRead,
    GovTideComplianceResult,
    GovBerthSpecRead,
    GovMetBulletinRead,
    GovThroughputBenchmarkRead,
)


class GovDataService:
    """Service for accessing, caching, and evaluating Bangladesh Government public datasets."""

    def __init__(self):
        # Locate data/gov_public relative to backend directory or workspace root
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        self.data_dir = base_dir / "data" / "gov_public"
        if not self.data_dir.exists():
            # Fallback for alternative directory structures
            alt_dir = Path(__file__).resolve().parent.parent / "data" / "gov_public"
            if alt_dir.exists():
                self.data_dir = alt_dir

        self._tide_records: Optional[List[GovTideRecordRead]] = None
        self._berth_specs: Optional[List[GovBerthSpecRead]] = None
        self._met_bulletins: Optional[List[GovMetBulletinRead]] = None
        self._benchmarks: Optional[List[GovThroughputBenchmarkRead]] = None

    def _load_tide_records(self) -> List[GovTideRecordRead]:
        if self._tide_records is not None:
            return self._tide_records

        csv_file = self.data_dir / "cpa_tide_circular_2026.csv"
        records = []
        if csv_file.exists():
            with open(csv_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(
                        GovTideRecordRead(
                            circular_id=row["circular_id"],
                            date=row["date"],
                            hw_time_1=row["hw_time_1"],
                            hw_height_1_m=float(row["hw_height_1_m"]),
                            lw_time_1=row["lw_time_1"],
                            lw_height_1_m=float(row["lw_height_1_m"]),
                            hw_time_2=row["hw_time_2"],
                            hw_height_2_m=float(row["hw_height_2_m"]),
                            lw_time_2=row["lw_time_2"],
                            lw_height_2_m=float(row["lw_height_2_m"]),
                            max_permissible_draft_m=float(row["max_permissible_draft_m"]),
                            day_nav_start=row["day_nav_start"],
                            day_nav_end=row["day_nav_end"],
                            gupta_bend_limit_m=float(row["gupta_bend_limit_m"]),
                            daylight_loa_cutoff_m=float(row["daylight_loa_cutoff_m"]),
                            navigation_restriction=row["navigation_restriction"],
                            source_doc_ref=row["source_doc_ref"],
                            data_status=DataStatusEnum.OBSERVED,
                        )
                    )
        self._tide_records = records
        return self._tide_records

    def _load_berth_specs(self) -> List[GovBerthSpecRead]:
        if self._berth_specs is not None:
            return self._berth_specs

        csv_file = self.data_dir / "cpa_berth_specifications_2026.csv"
        records = []
        if csv_file.exists():
            with open(csv_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(
                        GovBerthSpecRead(
                            berth_code=row["berth_code"],
                            terminal_code=row["terminal_code"],
                            terminal_name=row["terminal_name"],
                            quay_length_m=float(row["quay_length_m"]),
                            designed_depth_cd_m=float(row["designed_depth_cd_m"]),
                            max_permissible_loa_m=float(row["max_permissible_loa_m"]),
                            max_permissible_draft_m=float(row["max_permissible_draft_m"]),
                            sts_crane_equipped=row["sts_crane_equipped"].strip().lower() == "true",
                            crane_rail_gauge_m=float(row["crane_rail_gauge_m"]),
                            bollard_capacity_tonnes=int(row["bollard_capacity_tonnes"]),
                            apron_width_m=float(row["apron_width_m"]),
                            night_navigation_allowed=row["night_navigation_allowed"].strip().lower() == "true",
                            power_supply_voltage_kv=float(row["power_supply_voltage_kv"]),
                            source_circular_no=row["source_circular_no"],
                            data_status=DataStatusEnum.OBSERVED,
                        )
                    )
        self._berth_specs = records
        return self._berth_specs

    def _load_met_bulletins(self) -> List[GovMetBulletinRead]:
        if self._met_bulletins is not None:
            return self._met_bulletins

        csv_file = self.data_dir / "bmd_patenga_marine_bulletin_2026.csv"
        records = []
        if csv_file.exists():
            with open(csv_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(
                        GovMetBulletinRead(
                            bulletin_id=row["bulletin_id"],
                            station_code=row["station_code"],
                            station_name=row["station_name"],
                            issue_datetime=row["issue_datetime"],
                            forecast_area=row["forecast_area"],
                            maritime_signal_code=row["maritime_signal_code"],
                            maritime_signal_name=row["maritime_signal_name"],
                            signal_number=int(row["signal_number"]),
                            sustained_wind_knots=float(row["sustained_wind_knots"]),
                            gusting_wind_knots=float(row["gusting_wind_knots"]),
                            wind_direction=row["wind_direction"],
                            wave_height_m=float(row["wave_height_m"]),
                            sea_condition=row["sea_condition"],
                            visibility_km=float(row["visibility_km"]),
                            port_operations_impact=row["port_operations_impact"],
                            advisory_text=row["advisory_text"],
                            source_ref=row["source_ref"],
                            data_status=DataStatusEnum.OBSERVED,
                        )
                    )
        self._met_bulletins = records
        return self._met_bulletins

    def _load_benchmarks(self) -> List[GovThroughputBenchmarkRead]:
        if self._benchmarks is not None:
            return self._benchmarks

        csv_file = self.data_dir / "cpa_annual_statistics_2025.csv"
        records = []
        if csv_file.exists():
            with open(csv_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(
                        GovThroughputBenchmarkRead(
                            fiscal_year=row["fiscal_year"],
                            reporting_period=row["reporting_period"],
                            total_container_throughput_teu=int(row["total_container_throughput_teu"]),
                            import_container_teu=int(row["import_container_teu"]),
                            export_container_teu=int(row["export_container_teu"]),
                            transshipment_teu=int(row["transshipment_teu"]),
                            total_vessel_calls=int(row["total_vessel_calls"]),
                            container_vessels_handled=int(row["container_vessels_handled"]),
                            avg_turnaround_time_days=float(row["avg_turnaround_time_days"]),
                            avg_berth_occupancy_rate_pct=float(row["avg_berth_occupancy_rate_pct"]),
                            avg_crane_productivity_moves_hr=float(row["avg_crane_productivity_moves_hr"]),
                            dwell_time_import_days=float(row["dwell_time_import_days"]),
                            dwell_time_export_days=float(row["dwell_time_export_days"]),
                            data_source_publication=row["data_source_publication"],
                            data_status=DataStatusEnum.OBSERVED,
                        )
                    )
        self._benchmarks = records
        return self._benchmarks

    def get_tides(self, date_str: Optional[str] = None) -> List[GovTideRecordRead]:
        records = self._load_tide_records()
        if date_str:
            return [r for r in records if r.date == date_str]
        return records

    def get_berth_specs(self, terminal_code: Optional[str] = None) -> List[GovBerthSpecRead]:
        specs = self._load_berth_specs()
        if terminal_code:
            code_upper = terminal_code.upper()
            return [s for s in specs if s.terminal_code.upper() == code_upper]
        return specs

    def get_met_bulletins(self, min_signal: Optional[int] = None) -> List[GovMetBulletinRead]:
        bulletins = self._load_met_bulletins()
        if min_signal is not None:
            return [b for b in bulletins if b.signal_number >= min_signal]
        return bulletins

    def get_throughput_benchmarks(self) -> List[GovThroughputBenchmarkRead]:
        return self._load_benchmarks()

    def check_compliance(
        self,
        draft_m: float,
        loa_m: float,
        target_date: Optional[str] = None,
    ) -> GovTideComplianceResult:
        """Evaluates vessel navigation compliance against CPA tidal and fairway limits."""
        records = self._load_tide_records()
        
        # Pick relevant tide record
        matched_record = None
        if target_date:
            matched_record = next((r for r in records if r.date == target_date), None)
        if not matched_record and records:
            matched_record = records[2] if len(records) > 2 else records[0]  # default to Nov 03/04

        if not matched_record:
            # Fallback defaults if no records
            max_draft = 9.50
            day_window = "06:00 - 17:30"
            date_val = target_date or "2026-11-04"
            circular_ref = "CPA Circular No. 18/2026 (Default)"
        else:
            max_draft = matched_record.max_permissible_draft_m
            day_window = f"{matched_record.day_nav_start} - {matched_record.day_nav_end}"
            date_val = matched_record.date
            circular_ref = matched_record.source_doc_ref

        violations = []
        advisories = []
        is_compliant = True

        # Check maximum permissible draft
        if draft_m > max_draft:
            is_compliant = False
            violations.append(
                f"Vessel draft ({draft_m:.2f}m) exceeds the CPA permissible fairway draft limit of {max_draft:.2f}m for {date_val}."
            )

        # Check absolute Karnaphuli River draft ceiling
        if draft_m > 9.50:
            is_compliant = False
            violations.append(
                f"Draft {draft_m:.2f}m exceeds the absolute maximum permissible depth (9.50m) across the Karnaphuli Outer Bar and Gupta Bend under any tidal state."
            )

        # Check daylight navigation requirement
        requires_daylight_only = False
        if loa_m > 175.0 or draft_m > 8.50:
            requires_daylight_only = True
            advisories.append(
                f"Vessels with LOA > 175.0m (current: {loa_m:.1f}m) or draft > 8.50m (current: {draft_m:.2f}m) are restricted by CPA to DAYLIGHT HIGH-WATER SLACK navigation only (Window: {day_window} BST)."
            )

        # Check LOA terminal limits
        if loa_m > 205.0:
            is_compliant = False
            violations.append(
                f"LOA ({loa_m:.1f}m) exceeds maximum allowable berth accommodation at Chattogram Container Terminal or New Mooring Container Terminal (Max LOA 205m at NCT-5)."
            )
        elif loa_m > 190.0:
            advisories.append(
                f"Vessel LOA ({loa_m:.1f}m) can only be accommodated at NCT Berths 2-5. CCT berths 1-3 have a maximum LOA limit of 186m-190m."
            )

        # Under keel clearance advice
        advisories.append(
            "CPA Hydrography Department mandates minimum 0.60m under-keel clearance (UKC) over the Outer Bar at all times during transit."
        )

        tidal_phase = "SPRING_TIDE" if max_draft >= 9.30 else ("NEAP_TIDE" if max_draft <= 8.75 else "INTERMEDIATE")

        return GovTideComplianceResult(
            is_compliant=is_compliant,
            vessel_draft_m=draft_m,
            max_permissible_draft_m=max_draft,
            loa_m=loa_m,
            date=date_val,
            tidal_phase=tidal_phase,
            requires_daylight_only=requires_daylight_only,
            daylight_window=day_window,
            violations=violations,
            advisories=advisories,
            source_circular=circular_ref,
            data_status=DataStatusEnum.DERIVED,
        )


gov_data_service = GovDataService()


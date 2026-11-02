"""Independent feasibility validator for berth allocation schedules.

Guarantees schedule safety and operational constraints are satisfied independently
of the mathematical solver engine (Google OR-Tools CP-SAT).
"""

from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from app.schemas.optimizer import (
    ScheduledAssignment,
    BerthSpec,
    VesselCallSpec,
    ConstraintViolation,
    FeasibilityValidationResult,
)


def _to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class ScheduleFeasibilityValidator:
    """Independent validator checking physical and temporal constraints."""

    def __init__(
        self,
        berths: Optional[List[BerthSpec]] = None,
        calls: Optional[List[VesselCallSpec]] = None,
    ):
        self.berths_map: Dict[str, BerthSpec] = {b.id: b for b in (berths or [])}
        self.calls_map: Dict[str, VesselCallSpec] = {c.id: c for c in (calls or [])}

    def validate(
        self,
        assignments: List[ScheduledAssignment],
        berths_override: Optional[List[BerthSpec]] = None,
        calls_override: Optional[List[VesselCallSpec]] = None,
    ) -> FeasibilityValidationResult:
        """Validate a set of berth assignments against operational constraints.

        Checks:
        1. Valid start and end times (start < end).
        2. Vessel earliest arrival time (cannot berth before ETA).
        3. Vessel LOA vs Berth max LOA and length.
        4. Vessel draft vs Berth depth.
        5. Berth active status (no maintenance or inactive assignments).
        6. Berth availability windows.
        7. Non-overlapping time intervals for vessels on the same berth.
        """
        b_map = {b.id: b for b in berths_override} if berths_override else self.berths_map
        c_map = {c.id: c for c in calls_override} if calls_override else self.calls_map

        violations: List[ConstraintViolation] = []

        # 1. Individual assignment checks
        for assign in assignments:
            s_start = _to_utc(assign.scheduled_start)
            s_end = _to_utc(assign.scheduled_end)

            # Check 1: Time ordering
            if s_start >= s_end:
                violations.append(
                    ConstraintViolation(
                        violation_type="INVALID_TIME_INTERVAL",
                        vessel_call_id=assign.vessel_call_id,
                        berth_id=assign.berth_id,
                        description=(
                            f"Assignment start ({assign.scheduled_start.isoformat()}) "
                            f"is not strictly before end ({assign.scheduled_end.isoformat()})."
                        ),
                    )
                )

            # Look up vessel call specs
            call = c_map.get(assign.vessel_call_id)
            if call:
                arrival = _to_utc(call.predicted_eta or call.reported_eta)
                # Check 2: Vessel arrival time
                if arrival and s_start < arrival:
                    violations.append(
                        ConstraintViolation(
                            violation_type="EARLY_ARRIVAL_VIOLATION",
                            vessel_call_id=assign.vessel_call_id,
                            berth_id=assign.berth_id,
                            description=(
                                f"Vessel '{call.vessel_name}' scheduled start ({assign.scheduled_start.isoformat()}) "
                                f"is before earliest arrival ETA ({arrival.isoformat()})."
                            ),
                        )
                    )

            # Look up berth specs
            berth = b_map.get(assign.berth_id)
            if berth:
                # Check 3: Active and status
                if not berth.is_active or berth.status == "MAINTENANCE":
                    violations.append(
                        ConstraintViolation(
                            violation_type="BERTH_INACTIVE",
                            vessel_call_id=assign.vessel_call_id,
                            berth_id=assign.berth_id,
                            description=(
                                f"Berth '{berth.code}' is inactive or in maintenance (status={berth.status}). "
                                f"Cannot accept vessel calls."
                            ),
                        )
                    )

                # Check 4: LOA compatibility
                if call and call.length_overall_m > berth.max_vessel_loa_m:
                    violations.append(
                        ConstraintViolation(
                            violation_type="LOA_EXCEEDED",
                            vessel_call_id=assign.vessel_call_id,
                            berth_id=assign.berth_id,
                            description=(
                                f"Vessel LOA ({call.length_overall_m}m) exceeds berth '{berth.code}' "
                                f"maximum allowable LOA ({berth.max_vessel_loa_m}m)."
                            ),
                        )
                    )

                # Check 5: Draft compatibility
                if call and call.max_draft_m > berth.depth_draft_m:
                    violations.append(
                        ConstraintViolation(
                            violation_type="DRAFT_EXCEEDED",
                            vessel_call_id=assign.vessel_call_id,
                            berth_id=assign.berth_id,
                            description=(
                                f"Vessel draft ({call.max_draft_m}m) exceeds berth '{berth.code}' "
                                f"maximum depth draft ({berth.depth_draft_m}m)."
                            ),
                        )
                    )

                # Check 6: Availability window
                b_from = _to_utc(berth.available_from)
                b_to = _to_utc(berth.available_to)
                if b_from and s_start < b_from:
                    violations.append(
                        ConstraintViolation(
                            violation_type="OUTSIDE_WINDOW",
                            vessel_call_id=assign.vessel_call_id,
                            berth_id=assign.berth_id,
                            description=(
                                f"Assignment start ({assign.scheduled_start.isoformat()}) is before "
                                f"berth available window ({b_from.isoformat()})."
                            ),
                        )
                    )
                if b_to and s_end > b_to:
                    violations.append(
                        ConstraintViolation(
                            violation_type="OUTSIDE_WINDOW",
                            vessel_call_id=assign.vessel_call_id,
                            berth_id=assign.berth_id,
                            description=(
                                f"Assignment end ({assign.scheduled_end.isoformat()}) is after "
                                f"berth available window ({b_to.isoformat()})."
                            ),
                        )
                    )

        # 2. Pairwise Berth Overlap Checks
        # Group assignments by berth
        berth_grouped: Dict[str, List[ScheduledAssignment]] = {}
        for a in assignments:
            berth_grouped.setdefault(a.berth_id, []).append(a)

        for berth_id, group in berth_grouped.items():
            n = len(group)
            for i in range(n):
                for j in range(i + 1, n):
                    a1 = group[i]
                    a2 = group[j]
                    # Overlap occurs if max(start1, start2) < min(end1, end2)
                    a1_start = _to_utc(a1.scheduled_start)
                    a1_end = _to_utc(a1.scheduled_end)
                    a2_start = _to_utc(a2.scheduled_start)
                    a2_end = _to_utc(a2.scheduled_end)
                    latest_start = max(a1_start, a2_start)
                    earliest_end = min(a1_end, a2_end)
                    if latest_start < earliest_end:
                        violations.append(
                            ConstraintViolation(
                                violation_type="OVERLAP",
                                vessel_call_id=f"{a1.vessel_call_id},{a2.vessel_call_id}",
                                berth_id=berth_id,
                                description=(
                                    f"Berth conflict on '{a1.berth_code}': "
                                    f"'{a1.vessel_name}' [{a1.scheduled_start.strftime('%H:%M')}-{a1.scheduled_end.strftime('%H:%M')}] "
                                    f"overlaps with '{a2.vessel_name}' [{a2.scheduled_start.strftime('%H:%M')}-{a2.scheduled_end.strftime('%H:%M')}]."
                                ),
                            )
                        )

        is_feasible = len(violations) == 0
        summary = (
            f"Verification PASSED: {len(assignments)} assignments satisfied all hard operational constraints."
            if is_feasible
            else f"Verification FAILED: Found {len(violations)} constraint violation(s)."
        )

        return FeasibilityValidationResult(
            is_feasible=is_feasible,
            total_assignments_checked=len(assignments),
            violations_count=len(violations),
            violations=violations,
            summary=summary,
            validator_name="PORTOS Independent Feasibility Validator v1",
        )

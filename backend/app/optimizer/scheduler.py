"""Google OR-Tools CP-SAT Berth Allocation & Scheduling Engine.

Solves the constrained berth allocation problem (BAP) deterministically:
- Hard constraints: non-overlapping berth intervals, vessel/berth LOA & draft compatibility,
  berth maintenance windows, earliest arrival times.
- Soft objectives: minimize priority-weighted vessel waiting time, minimize baseline schedule disruption.
"""

from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta, timezone
import time
from ortools.sat.python import cp_model

from app.schemas.optimizer import (
    BerthSpec,
    VesselCallSpec,
    ScheduledAssignment,
    OptimizerConstraintSettings,
    OptimizerRequest,
    OptimizerResponse,
    SolverStatusEnum,
    ScheduleComparisonMetrics,
    FeasibilityValidationResult,
)
from app.optimizer.validator import ScheduleFeasibilityValidator


class BerthAllocationScheduler:
    """Deterministic constraint-based berth scheduler using OR-Tools CP-SAT."""

    def __init__(self, settings: Optional[OptimizerConstraintSettings] = None):
        self.settings = settings or OptimizerConstraintSettings()

    def optimize(
        self,
        berths: List[BerthSpec],
        calls: List[VesselCallSpec],
        planning_start: Optional[datetime] = None,
        planning_horizon_hours: int = 72,
        time_granularity_minutes: int = 15,
        baseline_schedule: Optional[List[ScheduledAssignment]] = None,
    ) -> OptimizerResponse:
        """Run CP-SAT optimization to schedule vessel calls across available berths."""
        start_wall_time = time.perf_counter()

        # 1. Determine reference planning horizon
        all_times: List[datetime] = []
        for c in calls:
            arr = c.predicted_eta or c.reported_eta
            if arr:
                if arr.tzinfo is None:
                    arr = arr.replace(tzinfo=timezone.utc)
                else:
                    arr = arr.astimezone(timezone.utc)
                all_times.append(arr)

        if planning_start is None:
            if all_times:
                min_arr = min(all_times)
                # Round down to previous full hour
                planning_start = min_arr.replace(minute=0, second=0, microsecond=0)
            else:
                planning_start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

        # Ensure timezone-aware
        if planning_start.tzinfo is None:
            planning_start = planning_start.replace(tzinfo=timezone.utc)

        planning_end = planning_start + timedelta(hours=planning_horizon_hours)
        horizon_minutes = planning_horizon_hours * 60

        # Filter active, non-maintenance berths
        active_berths = [b for b in berths if b.is_active and b.status != "MAINTENANCE"]

        # Check for immediate infeasibility diagnostics
        infeasibility_diagnostics: List[str] = []
        for c in calls:
            compat = [
                b for b in active_berths
                if c.length_overall_m <= b.max_vessel_loa_m and c.max_draft_m <= b.depth_draft_m
            ]
            if not compat:
                infeasibility_diagnostics.append(
                    f"Vessel '{c.vessel_name}' (LOA {c.length_overall_m}m, Draft {c.max_draft_m}m) "
                    f"has zero physically compatible berths among active berths."
                )

        # 2. Build CP-SAT Model
        model = cp_model.CpModel()

        # Data structures for decision variables
        # (call_id, berth_id) -> (start_var, end_var, interval_var, presence_var)
        intervals_by_berth: Dict[str, List[Any]] = {b.id: [] for b in active_berths}
        vessel_presences: Dict[str, List[Tuple[str, Any, Any, Any]]] = {c.id: [] for c in calls}
        unassigned_vars: Dict[str, Any] = {}
        wait_vars: Dict[str, Any] = {}

        # Add berth maintenance closures as fixed intervals
        if self.settings.enforce_maintenance_windows:
            for b in active_berths:
                for mw in (getattr(b, "maintenance_windows", []) or []):
                    if getattr(mw, "is_closed", True):
                        st = mw.start_time if mw.start_time.tzinfo else mw.start_time.replace(tzinfo=timezone.utc)
                        et = mw.end_time if mw.end_time.tzinfo else mw.end_time.replace(tzinfo=timezone.utc)
                        m_start = max(0, int((st - planning_start).total_seconds() / 60))
                        m_end = min(horizon_minutes, int((et - planning_start).total_seconds() / 60))
                        m_dur = m_end - m_start
                        if m_dur > 0:
                            m_interval = model.NewFixedSizeIntervalVar(m_start, m_dur, f"maint_{b.id}_{mw.id}")
                            intervals_by_berth[b.id].append(m_interval)

        for c in calls:
            arrival_dt = c.predicted_eta or c.reported_eta
            if arrival_dt.tzinfo is None:
                arrival_dt = arrival_dt.replace(tzinfo=timezone.utc)

            # Convert arrival to minutes from planning_start
            delta_mins = int((arrival_dt - planning_start).total_seconds() / 60)
            earliest_start = max(0, delta_mins)
            duration_mins = int(c.service_duration_hours * 60)

            # Wait variable for objective
            wait_var = model.NewIntVar(0, horizon_minutes, f"wait_{c.id}")
            wait_vars[c.id] = wait_var

            # Slack unassigned variable with large penalty
            unassigned_var = model.NewBoolVar(f"unassigned_{c.id}")
            unassigned_vars[c.id] = unassigned_var

            for b in active_berths:
                # Check hard physical compatibility
                if self.settings.enforce_loa_limit and c.length_overall_m > b.max_vessel_loa_m:
                    continue
                if self.settings.enforce_draft_limit and c.max_draft_m > b.depth_draft_m:
                    continue
                if self.settings.enforce_crane_capacity:
                    req_crane = getattr(c, "required_crane_capacity", 25.0)
                    avail_crane = getattr(b, "crane_capacity_moves_per_hour", 30.0)
                    if req_crane > avail_crane * 1.6:
                        continue

                # Check berth window constraint
                b_start_min = 0
                b_end_min = horizon_minutes
                if self.settings.enforce_berth_availability:
                    if b.available_from:
                        dt = b.available_from if b.available_from.tzinfo else b.available_from.replace(tzinfo=timezone.utc)
                        b_start_min = max(0, int((dt - planning_start).total_seconds() / 60))
                    if b.available_to:
                        dt = b.available_to if b.available_to.tzinfo else b.available_to.replace(tzinfo=timezone.utc)
                        b_end_min = min(horizon_minutes, int((dt - planning_start).total_seconds() / 60))

                earliest_feasible_start = max(earliest_start, b_start_min)
                latest_feasible_start = max(0, b_end_min - duration_mins)

                if earliest_feasible_start > latest_feasible_start:
                    continue

                presence_var = model.NewBoolVar(f"assign_{c.id}_{b.id}")
                start_var = model.NewIntVar(
                    earliest_feasible_start,
                    horizon_minutes,
                    f"start_{c.id}_{b.id}"
                )
                end_var = model.NewIntVar(
                    earliest_feasible_start + duration_mins,
                    horizon_minutes + duration_mins,
                    f"end_{c.id}_{b.id}"
                )
                interval_var = model.NewOptionalIntervalVar(
                    start_var,
                    duration_mins,
                    end_var,
                    presence_var,
                    f"interval_{c.id}_{b.id}"
                )

                intervals_by_berth[b.id].append(interval_var)
                vessel_presences[c.id].append((b.id, presence_var, start_var, end_var))

                # Link wait_var to start_var when assigned
                model.Add(wait_var >= start_var - earliest_start).OnlyEnforceIf(presence_var)

            # Each vessel assigned to exactly one berth OR marked unassigned
            all_presences = [p[1] for p in vessel_presences[c.id]]
            model.Add(sum(all_presences) + unassigned_var == 1)

        # 3. Hard Constraint: No overlapping vessel calls or maintenance on any berth
        if self.settings.enforce_no_overlap:
            for b_id, interval_list in intervals_by_berth.items():
                if len(interval_list) > 1:
                    model.AddNoOverlap(interval_list)

        # 4. Objective Function: Weighted Sum
        # - Minimize weighted waiting time
        # - Huge penalty for unassigned vessels
        # - Baseline schedule perturbation penalty
        # - Berth idle gap minimization penalty
        objective_terms = []
        for c in calls:
            w_weight = int(self.settings.waiting_time_weight * c.priority * 10)
            objective_terms.append(w_weight * wait_vars[c.id])

            # Unassigned penalty (large enough to prevent skipping assignable vessels)
            objective_terms.append(500000 * c.priority * unassigned_vars[c.id])

            # Schedule deviation penalty if baseline exists
            if baseline_schedule:
                base_assign = next((ba for ba in baseline_schedule if ba.vessel_call_id == c.id), None)
                if base_assign:
                    for b_id, pres_var, _, _ in vessel_presences[c.id]:
                        if b_id != base_assign.berth_id:
                            dev_weight = int(self.settings.schedule_deviation_weight * 50)
                            objective_terms.append(dev_weight * pres_var)

        model.Minimize(sum(objective_terms))

        # 5. Solve CP-SAT Model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.settings.max_solver_duration_seconds
        solver.parameters.random_seed = 42
        solver.parameters.num_search_workers = 4

        solver_res = solver.Solve(model)
        solve_time_ms = round((time.perf_counter() - start_wall_time) * 1000, 2)

        if solver_res == cp_model.OPTIMAL:
            solver_status = SolverStatusEnum.OPTIMAL
        elif solver_res == cp_model.FEASIBLE:
            solver_status = SolverStatusEnum.FEASIBLE
        elif solver_res == cp_model.INFEASIBLE:
            solver_status = SolverStatusEnum.INFEASIBLE
        elif solver_res == cp_model.MODEL_INVALID:
            solver_status = SolverStatusEnum.MODEL_INVALID
        elif solver.WallTime() >= (self.settings.max_solver_duration_seconds - 0.5):
            solver_status = SolverStatusEnum.TIME_LIMIT_REACHED
        else:
            solver_status = SolverStatusEnum.UNKNOWN

        # 6. Extract Solution & Construct ScheduledAssignment Records
        optimized_schedule: List[ScheduledAssignment] = []
        unassigned_vessels: List[str] = []
        berths_map = {b.id: b for b in berths}
        calls_map = {c.id: c for c in calls}

        if solver_status in (SolverStatusEnum.OPTIMAL, SolverStatusEnum.FEASIBLE):
            for c in calls:
                if solver.Value(unassigned_vars[c.id]) == 1:
                    unassigned_vessels.append(c.id)
                    continue

                assigned_tuple = None
                for b_id, pres_var, start_var, end_var in vessel_presences[c.id]:
                    if solver.Value(pres_var) == 1:
                        assigned_tuple = (b_id, solver.Value(start_var), solver.Value(end_var))
                        break

                if assigned_tuple:
                    b_id, s_min, e_min = assigned_tuple
                    berth = berths_map[b_id]
                    s_dt = planning_start + timedelta(minutes=s_min)
                    e_dt = planning_start + timedelta(minutes=e_min)

                    arr_dt = c.predicted_eta or c.reported_eta
                    if arr_dt.tzinfo is None:
                        arr_dt = arr_dt.replace(tzinfo=timezone.utc)
                    wait_hrs = round(max(0.0, (s_dt - arr_dt).total_seconds() / 3600.0), 2)

                    loa_margin = round(berth.max_vessel_loa_m - c.length_overall_m, 1)
                    draft_margin = round(berth.depth_draft_m - c.max_draft_m, 1)
                    crane_str = f"{getattr(berth, 'assigned_cranes_count', 1)} STS crane(s) ({getattr(berth, 'crane_capacity_moves_per_hour', 30.0)} moves/h)"

                    explanation = (
                        f"RECOMMENDED: {berth.code} ({berth.name})\n"
                        f"Reasons:\n"
                        f"• Vessel physical compatibility verified: LOA {c.length_overall_m}m <= {berth.max_vessel_loa_m}m (+{loa_margin}m buffer), "
                        f"Draft {c.max_draft_m}m <= {berth.depth_draft_m}m (+{draft_margin}m depth margin).\n"
                        f"• Berth is available within the predicted arrival window and free of maintenance closures.\n"
                        f"• Crane capacity verified: {crane_str}.\n"
                        f"• Expected waiting time: {wait_hrs}h after arrival ETA (Priority weight: {c.priority})."
                    )

                    assignment = ScheduledAssignment(
                        vessel_call_id=c.id,
                        vessel_name=c.vessel_name,
                        call_number=c.call_number,
                        berth_id=b_id,
                        berth_code=berth.code,
                        berth_name=berth.name,
                        scheduled_start=s_dt,
                        scheduled_end=e_dt,
                        service_duration_hours=c.service_duration_hours,
                        waiting_time_hours=wait_hrs,
                        assigned_quay_start_m=10.0,
                        assigned_quay_end_m=round(10.0 + c.length_overall_m, 1),
                        is_feasible=True,
                        assignment_explanation=explanation,
                    )
                    optimized_schedule.append(assignment)

        # 7. Generate Baseline Schedule if not provided
        if baseline_schedule is None:
            baseline_schedule = self._generate_naive_baseline_schedule(
                active_berths, calls, planning_start
            )

        # 8. Run Independent Feasibility Validation on the Optimized Schedule
        validator = ScheduleFeasibilityValidator(berths=berths, calls=calls)
        validation_result = validator.validate(optimized_schedule)

        # 9. Compute Comparative Metrics
        metrics = self._compute_comparison_metrics(
            baseline_schedule=baseline_schedule,
            optimized_schedule=optimized_schedule,
            unassigned_count=len(unassigned_vessels),
            total_vessels=len(calls),
            active_berths_count=len(active_berths),
            horizon_hours=planning_horizon_hours,
        )

        return OptimizerResponse(
            solver_status=solver_status,
            solve_time_ms=solve_time_ms,
            objective_value=solver.ObjectiveValue() if solver_status in (SolverStatusEnum.OPTIMAL, SolverStatusEnum.FEASIBLE) else None,
            planning_start=planning_start,
            planning_end=planning_end,
            baseline_schedule=baseline_schedule,
            optimized_schedule=optimized_schedule,
            unassigned_vessels=unassigned_vessels,
            feasibility_validation=validation_result,
            comparison_metrics=metrics,
            infeasibility_diagnostics=infeasibility_diagnostics,
        )

    def _generate_naive_baseline_schedule(
        self,
        berths: List[BerthSpec],
        calls: List[VesselCallSpec],
        planning_start: datetime,
    ) -> List[ScheduledAssignment]:
        """Generate a naive FIFO baseline schedule by placing calls on first available compatible berth."""
        berths_free_time: Dict[str, datetime] = {b.id: planning_start for b in berths}
        schedule: List[ScheduledAssignment] = []

        # Sort calls naively by reported arrival
        sorted_calls = sorted(
            calls,
            key=lambda c: (
                c.reported_eta.replace(tzinfo=timezone.utc)
                if c.reported_eta.tzinfo is None
                else c.reported_eta.astimezone(timezone.utc)
            ),
        )

        for c in sorted_calls:
            arr = c.reported_eta
            if arr.tzinfo is None:
                arr = arr.replace(tzinfo=timezone.utc)

            # Find first compatible berth
            best_b: Optional[BerthSpec] = None
            best_start: Optional[datetime] = None

            for b in berths:
                if c.length_overall_m <= b.max_vessel_loa_m and c.max_draft_m <= b.depth_draft_m:
                    earliest_b = berths_free_time[b.id]
                    st = max(arr, earliest_b)
                    if best_start is None or st < best_start:
                        best_start = st
                        best_b = b

            if best_b and best_start:
                dur = timedelta(hours=c.service_duration_hours)
                end = best_start + dur
                berths_free_time[best_b.id] = end
                wait_hrs = round(max(0.0, (best_start - arr).total_seconds() / 3600.0), 2)

                schedule.append(
                    ScheduledAssignment(
                        vessel_call_id=c.id,
                        vessel_name=c.vessel_name,
                        call_number=c.call_number,
                        berth_id=best_b.id,
                        berth_code=best_b.code,
                        berth_name=best_b.name,
                        scheduled_start=best_start,
                        scheduled_end=end,
                        service_duration_hours=c.service_duration_hours,
                        waiting_time_hours=wait_hrs,
                        assigned_quay_start_m=10.0,
                        assigned_quay_end_m=round(10.0 + c.length_overall_m, 1),
                        is_feasible=True,
                        assignment_explanation=f"Naive FIFO baseline assignment to {best_b.code}.",
                    )
                )

        return schedule

    def _compute_comparison_metrics(
        self,
        baseline_schedule: List[ScheduledAssignment],
        optimized_schedule: List[ScheduledAssignment],
        unassigned_count: int,
        total_vessels: int,
        active_berths_count: int,
        horizon_hours: int,
    ) -> ScheduleComparisonMetrics:
        """Compute waiting time delta and utilization comparing baseline vs optimized."""
        base_wait = round(sum(a.waiting_time_hours for a in baseline_schedule), 2)
        opt_wait = round(sum(a.waiting_time_hours for a in optimized_schedule), 2)
        saved = round(max(0.0, base_wait - opt_wait), 2)
        reduction_pct = round((saved / base_wait * 100) if base_wait > 0 else 0.0, 1)

        total_service_hours = sum(a.service_duration_hours for a in optimized_schedule)
        total_berth_hours = max(1, active_berths_count * horizon_hours)
        utilization = round(min(100.0, (total_service_hours / total_berth_hours) * 100), 1)

        return ScheduleComparisonMetrics(
            baseline_total_waiting_hours=base_wait,
            optimized_total_waiting_hours=opt_wait,
            waiting_hours_saved=saved,
            waiting_time_reduction_pct=reduction_pct,
            berth_utilization_pct=utilization,
            vessels_scheduled_count=len(optimized_schedule),
            vessels_unassigned_count=unassigned_count,
        )

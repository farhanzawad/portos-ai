import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.vessel import Vessel, VesselCall, CallStatusEnum, DelayRiskStatusEnum
from app.models.equipment import Equipment, EquipmentStatusEnum
from app.models.yard import YardBlock, YardRiskTierEnum
from app.models.scenario import OperationalEvent, EventSeverityEnum, EventTypeEnum
from app.models.terminal import Berth, BerthStatusEnum
from app.schemas.events import (
    EventMessage,
    EventType,
    IncidentInjectionRequest,
    IncidentInjectionResponse,
    IncidentResetResponse,
    IncidentPreset,
)
from app.db.base import DataStatusEnum
from app.events.bus import event_bus


class IncidentManager:
    """Orchestrates deterministic operational incident injection and state rollback."""

    def __init__(self):
        # In-memory stash of baseline records to ensure 100% deterministic reset
        self._baseline_vessel_calls: Dict[str, Dict[str, Any]] = {}
        self._baseline_equipments: Dict[str, Dict[str, Any]] = {}
        self._baseline_yard_obs: Dict[str, Dict[str, Any]] = {}
        self._injected_event_ids: List[str] = []

    def get_presets(self) -> List[IncidentPreset]:
        return [
            IncidentPreset(
                id="monsoon_surge_delay",
                title="Monsoon Fairway Surge: Feeder Delay (+6.5h)",
                description=(
                    "Simulates severe river swell in Karnaphuli fairway. Incoming feeder vessel Meghna Star misses "
                    "the high-tide navigation window, holding at Outer Anchorage with delay prediction escalating to HIGH_RISK."
                ),
                target_entity="vsl_feeder_01 (Meghna Star)",
                severity="WARNING",
                expected_impact="Missed tidal window, berthing slot idle, downstream schedule conflict generated.",
            ),
            IncidentPreset(
                id="crane_outage",
                title="Quayside STS Crane #02 Cable Fault",
                description=(
                    "Simulates mechanical hoist cable degradation on CCT Berth 2. Handling productivity drops by 50%, "
                    "extending vessel port turnaround time and requiring mobile crane support."
                ),
                target_entity="eq_sts_02 (STS Crane 02)",
                severity="WARNING",
                expected_impact="STS lift rate reduced, berth turnaround prolonged by 4.2 hours.",
            ),
            IncidentPreset(
                id="yard_congestion",
                title="Import Yard Block B Congestion Surge (92%)",
                description=(
                    "Simulates custom clearance bottleneck resulting in container dwell accumulation exceeding 90% capacity, "
                    "triggering RTG transfer rerouting and yard safety alerts."
                ),
                target_entity="yard_blk_02 (Import Block B)",
                severity="CRITICAL",
                expected_impact="Yard gate queue warning, straddle carrier transfer slowdown.",
            ),
        ]

    def inject_incident(
        self, request: IncidentInjectionRequest, db: Session
    ) -> IncidentInjectionResponse:
        """Applies deterministic incident changes across the database and emits synchronized events."""
        events_emitted: List[EventMessage] = []
        incident_id = f"inc_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}"
        terminal_id = "term_cct_01"

        if request.incident_type == "monsoon_surge_delay":
            events_emitted = self._inject_monsoon_delay(request, incident_id, terminal_id, db)
            summary = f"Injected Monsoon Surge delay (+{request.delay_hours}h) on incoming feeder call. Delay risk escalated to HIGH_RISK."
        elif request.incident_type == "crane_outage":
            events_emitted = self._inject_crane_outage(incident_id, terminal_id, db)
            summary = "Injected mechanical hoist cable fault on STS Crane 02. Equipment status downgraded to DEGRADED."
        elif request.incident_type == "yard_congestion":
            events_emitted = self._inject_yard_congestion(incident_id, terminal_id, db)
            summary = "Injected import dwell bottleneck into Yard Block B. Risk tier escalated to HIGH_RISK."
        else:
            # Default to monsoon delay
            events_emitted = self._inject_monsoon_delay(request, incident_id, terminal_id, db)
            summary = f"Injected incident {request.incident_type} successfully."

        # Broadcast each event over event_bus
        for evt in events_emitted:
            event_bus.publish_sync(evt)

        db.commit()

        return IncidentInjectionResponse(
            incident_id=incident_id,
            incident_type=request.incident_type,
            status="INJECTED",
            summary=summary,
            events_emitted_count=len(events_emitted),
            events=events_emitted,
            data_status=DataStatusEnum.SIMULATED,
        )

    def _inject_monsoon_delay(
        self,
        request: IncidentInjectionRequest,
        incident_id: str,
        terminal_id: str,
        db: Session,
    ) -> List[EventMessage]:
        events: List[EventMessage] = []

        # Find target vessel call
        call = db.query(VesselCall).first()
        if request.target_vessel_id:
            specified = db.query(VesselCall).filter(
                (VesselCall.id == request.target_vessel_id) | (VesselCall.vessel_id == request.target_vessel_id)
            ).first()
            if specified:
                call = specified

        if not call:
            return events

        vessel = db.query(Vessel).filter(Vessel.id == call.vessel_id).first()
        vessel_name = vessel.name if vessel else "Feeder Vessel"

        # Stash baseline state before mutating
        if call.id not in self._baseline_vessel_calls:
            self._baseline_vessel_calls[call.id] = {
                "status": call.status,
                "delay_risk_status": call.delay_risk_status,
                "predicted_delay_hours": call.predicted_delay_hours,
                "predicted_eta": call.predicted_eta,
            }

        # Apply mutations
        call.status = CallStatusEnum.OUTER_ANCHORAGE
        call.delay_risk_status = DelayRiskStatusEnum.HIGH_RISK
        call.predicted_delay_hours = float(request.delay_hours)
        original_eta = call.reported_eta or datetime.now(timezone.utc)
        call.predicted_eta = original_eta + timedelta(hours=request.delay_hours)

        # Create persistent database OperationalEvent for Overview & Audit
        db_alert = OperationalEvent(
            id=f"alert_{incident_id}",
            terminal_id=terminal_id,
            timestamp=datetime.now(timezone.utc),
            event_type=EventTypeEnum.VESSEL_DELAY_INJECTED,
            severity=EventSeverityEnum.WARNING,
            title=f"Monsoon Surge: {vessel_name} Delayed (+{request.delay_hours}h)",
            description=(
                f"Tidal river restriction at Karnaphuli fairway caused {vessel_name} to miss scheduled berthing slot. "
                f"Vessel holding at Outer Anchorage with delay risk escalating to HIGH_RISK (+{request.delay_hours} hours)."
            ),
            payload_json={
                "incident_id": incident_id,
                "call_id": call.id,
                "vessel_name": vessel_name,
                "delay_hours": request.delay_hours,
                "new_predicted_eta": call.predicted_eta.isoformat(),
            },
            data_status=DataStatusEnum.SIMULATED,
        )
        db.add(db_alert)
        self._injected_event_ids.append(db_alert.id)

        # Construct typed event stream sequence (Step 1-3)
        evt_incident = EventMessage(
            id=event_bus.generate_event_id(),
            event_type=EventType.INCIDENT_INJECTED.value,
            entity_id=incident_id,
            origin="INCIDENT_INJECTOR",
            payload={
                "incident_type": "monsoon_surge_delay",
                "title": f"Monsoon Surge: {vessel_name} Delayed",
                "target_entity": call.id,
                "delay_hours": request.delay_hours,
            },
        )
        events.append(evt_incident)

        evt_delay_risk = EventMessage(
            id=event_bus.generate_event_id(),
            event_type=EventType.VESSEL_DELAY_RISK_CHANGED.value,
            entity_id=call.id,
            origin="SCIKIT_LEARN",
            payload={
                "vessel_call_id": call.id,
                "vessel_name": vessel_name,
                "previous_tier": "NORMAL",
                "new_tier": "HIGH_RISK",
                "predicted_delay_hours": request.delay_hours,
            },
        )
        events.append(evt_delay_risk)

        evt_pos = EventMessage(
            id=event_bus.generate_event_id(),
            event_type=EventType.VESSEL_POSITION_UPDATED.value,
            entity_id=call.id,
            origin="SIMULATED_AIS",
            payload={
                "vessel_call_id": call.id,
                "vessel_name": vessel_name,
                "navigational_status": "At anchor (Outer Anchorage Alpha)",
                "latitude": 22.1850,
                "longitude": 91.7520,
                "speed_knots": 0.2,
                "distance_to_pilot_nm": 6.8,
            },
        )
        events.append(evt_pos)

        evt_pred = EventMessage(
            id=event_bus.generate_event_id(),
            event_type=EventType.VESSEL_ETA_PREDICTION_CREATED.value,
            entity_id=call.id,
            origin="SCIKIT_LEARN",
            payload={
                "vessel_call_id": call.id,
                "reported_eta": call.reported_eta.isoformat() if call.reported_eta else None,
                "predicted_eta": call.predicted_eta.isoformat(),
                "delay_hours": request.delay_hours,
                "model_version": "GradientBoostingRegressor v1.0.0",
            },
        )
        events.append(evt_pred)

        evt_alert = EventMessage(
            id=event_bus.generate_event_id(),
            event_type=EventType.OPERATIONAL_ALERT_CREATED.value,
            entity_id=db_alert.id,
            origin="INCIDENT_INJECTOR",
            payload={
                "alert_id": db_alert.id,
                "severity": "WARNING",
                "title": db_alert.title,
                "description": db_alert.description,
            },
        )
        events.append(evt_alert)

        return events

    def _inject_crane_outage(
        self, incident_id: str, terminal_id: str, db: Session
    ) -> List[EventMessage]:
        events: List[EventMessage] = []
        crane = db.query(Equipment).first()
        if not crane:
            return events

        if crane.id not in self._baseline_equipments:
            self._baseline_equipments[crane.id] = {"status": crane.status}

        crane.status = EquipmentStatusEnum.DEGRADED
        crane_label = f"Equipment {crane.code}"

        db_alert = OperationalEvent(
            id=f"alert_{incident_id}",
            terminal_id=terminal_id,
            timestamp=datetime.now(timezone.utc),
            event_type=EventTypeEnum.CRANE_OUTAGE,
            severity=EventSeverityEnum.WARNING,
            title=f"Equipment Degradation: {crane_label}",
            description=f"Hoist cable tension fault detected on {crane_label}. Operating at 50% handling capacity.",
            payload_json={"equipment_id": crane.id, "status": "DEGRADED"},
            data_status=DataStatusEnum.SIMULATED,
        )
        db.add(db_alert)
        self._injected_event_ids.append(db_alert.id)

        events.append(
            EventMessage(
                id=event_bus.generate_event_id(),
                event_type=EventType.INCIDENT_INJECTED.value,
                entity_id=incident_id,
                origin="INCIDENT_INJECTOR",
                payload={"incident_type": "crane_outage", "title": f"Degradation on {crane_label}"},
            )
        )
        events.append(
            EventMessage(
                id=event_bus.generate_event_id(),
                event_type=EventType.EQUIPMENT_STATUS_CHANGED.value,
                entity_id=crane.id,
                origin="EQUIPMENT_TELEMETRY",
                payload={"equipment_id": crane.id, "code": crane.code, "status": "DEGRADED"},
            )
        )
        events.append(
            EventMessage(
                id=event_bus.generate_event_id(),
                event_type=EventType.OPERATIONAL_ALERT_CREATED.value,
                entity_id=db_alert.id,
                origin="INCIDENT_INJECTOR",
                payload={"alert_id": db_alert.id, "title": db_alert.title, "severity": "WARNING"},
            )
        )
        return events

    def _inject_yard_congestion(
        self, incident_id: str, terminal_id: str, db: Session
    ) -> List[EventMessage]:
        from app.models.yard import YardOccupancyObservation

        events: List[EventMessage] = []
        block = db.query(YardBlock).first()
        if not block:
            return events

        obs = (
            db.query(YardOccupancyObservation)
            .filter(YardOccupancyObservation.yard_block_id == block.id)
            .order_by(YardOccupancyObservation.timestamp.desc())
            .first()
        )
        if obs:
            if obs.id not in self._baseline_yard_obs:
                self._baseline_yard_obs[obs.id] = {
                    "risk_tier": obs.risk_tier,
                    "occupancy_pct": obs.occupancy_pct,
                    "occupied_teu": obs.occupied_teu,
                }
            obs.risk_tier = YardRiskTierEnum.HIGH_RISK
            obs.occupancy_pct = 92.0
            obs.occupied_teu = int(block.teu_capacity * 0.92)

        db_alert = OperationalEvent(
            id=f"alert_{incident_id}",
            terminal_id=terminal_id,
            timestamp=datetime.now(timezone.utc),
            event_type=EventTypeEnum.YARD_BOTTLENECK,
            severity=EventSeverityEnum.CRITICAL,
            title=f"Yard Bottleneck: {block.name} at 92% Capacity",
            description=f"Dwell accumulation in sector {block.code} exceeds threshold. RTG buffer overflow alert active.",
            payload_json={"yard_block_id": block.id, "occupancy_pct": 92.0},
            data_status=DataStatusEnum.SIMULATED,
        )
        db.add(db_alert)
        self._injected_event_ids.append(db_alert.id)

        events.append(
            EventMessage(
                id=event_bus.generate_event_id(),
                event_type=EventType.INCIDENT_INJECTED.value,
                entity_id=incident_id,
                origin="INCIDENT_INJECTOR",
                payload={"incident_type": "yard_congestion", "title": f"Congestion in {block.name}"},
            )
        )
        events.append(
            EventMessage(
                id=event_bus.generate_event_id(),
                event_type=EventType.YARD_OCCUPANCY_FORECAST_UPDATED.value,
                entity_id=block.id,
                origin="SCIKIT_LEARN",
                payload={"yard_block_id": block.id, "risk_tier": "HIGH_RISK", "occupancy_pct": 92.0},
            )
        )
        events.append(
            EventMessage(
                id=event_bus.generate_event_id(),
                event_type=EventType.OPERATIONAL_ALERT_CREATED.value,
                entity_id=db_alert.id,
                origin="INCIDENT_INJECTOR",
                payload={"alert_id": db_alert.id, "title": db_alert.title, "severity": "CRITICAL"},
            )
        )
        return events

    def reset_to_baseline(self, db: Session) -> IncidentResetResponse:
        """Deterministically rolls back all injected mutations back to seed baseline."""
        # 1. Restore Vessel Calls
        for call_id, state in self._baseline_vessel_calls.items():
            call = db.query(VesselCall).filter(VesselCall.id == call_id).first()
            if call:
                call.status = state["status"]
                call.delay_risk_status = state["delay_risk_status"]
                call.predicted_delay_hours = state["predicted_delay_hours"]
                call.predicted_eta = state["predicted_eta"]

        # 2. Restore Equipments
        for eq_id, state in self._baseline_equipments.items():
            eq = db.query(Equipment).filter(Equipment.id == eq_id).first()
            if eq:
                eq.status = state["status"]

        # 3. Restore Yard Observations
        from app.models.yard import YardOccupancyObservation
        for obs_id, state in self._baseline_yard_obs.items():
            obs = db.query(YardOccupancyObservation).filter(YardOccupancyObservation.id == obs_id).first()
            if obs:
                obs.risk_tier = state["risk_tier"]
                obs.occupancy_pct = state["occupancy_pct"]
                obs.occupied_teu = state["occupied_teu"]

        # 4. Remove injected OperationalEvents from database
        if self._injected_event_ids:
            db.query(OperationalEvent).filter(
                OperationalEvent.id.in_(self._injected_event_ids)
            ).delete(synchronize_session=False)
            self._injected_event_ids.clear()

        # Clear stashes
        self._baseline_vessel_calls.clear()
        self._baseline_equipments.clear()
        self._baseline_yard_obs.clear()

        db.commit()

        # Emit broadcast reset event
        reset_evt = EventMessage(
            id=event_bus.generate_event_id(),
            event_type=EventType.INCIDENT_RESET.value,
            entity_id="system",
            origin="INCIDENT_INJECTOR",
            payload={
                "message": "Demo state reset to clean baseline. All injected delays and disruptions cleared.",
                "timestamp": datetime.now().isoformat(),
            },
        )
        event_bus.publish_sync(reset_evt)

        return IncidentResetResponse(
            status="RESET_COMPLETED",
            restored_baseline=True,
            message="Terminal operations state deterministically restored to seed baseline.",
            events_emitted_count=1,
            data_status=DataStatusEnum.SIMULATED,
        )


incident_manager = IncidentManager()

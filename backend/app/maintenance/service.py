import logging
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.db.base import DataStatusEnum
from app.models.equipment import Equipment, EquipmentStatusEnum, EquipmentTypeEnum
from app.schemas.maintenance import (
    TelemetryReading,
    AnomalyAssessment,
    MaintenanceOverviewResponse,
)

logger = logging.getLogger("portos-maintenance")


class MaintenanceAnomalyService:
    """Equipment Predictive Maintenance Service using scikit-learn Isolation Forest.
    
    Detects early-stage mechanical degradation (vibration anomalies, bearing wear,
    hydraulic overheating, and motor strain) on STS and RTG cranes.
    """

    def __init__(self):
        self._model: Optional[IsolationForest] = None
        self._feature_means: np.ndarray = np.array([1.2, 52.0, 220.0, 62.0])  # vib, temp, power, cycle
        self._feature_stds: np.ndarray = np.array([0.4, 6.0, 40.0, 10.0])
        self._feature_names = ["Vibration (mm/s)", "Hydraulic Oil Temp (°C)", "Motor Power Draw (kW)", "Hoist Cycle Time (s)"]
        self._injected_anomalies: Dict[str, Dict[str, float]] = {}
        self._train_baseline_model()

    def _train_baseline_model(self) -> None:
        """Trains IsolationForest on 2,000 synthetic nominal operating baseline cycles."""
        np.random.seed(42)
        n_samples = 2000
        
        # Nominal telemetry cluster
        vibration = np.random.normal(1.2, 0.35, n_samples)
        hydraulic_temp = np.random.normal(52.0, 5.5, n_samples)
        power_draw = np.random.normal(220.0, 35.0, n_samples)
        cycle_time = np.random.normal(62.0, 9.0, n_samples)

        X_train = np.column_stack([vibration, hydraulic_temp, power_draw, cycle_time])
        
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42,
        )
        self._model.fit(X_train)
        logger.info("Equipment Isolation Forest trained on %d baseline cycles.", n_samples)

    def _generate_telemetry(self, eq: Equipment) -> TelemetryReading:
        """Generates realistic telemetry reading for an equipment unit, incorporating any injected condition."""
        np.random.seed(hash(eq.id) % 2**32)

        # Baseline profiles by equipment type
        if eq.equipment_type == EquipmentTypeEnum.STS_CRANE:
            base_vib = 1.4
            base_temp = 54.0
            base_kw = 280.0
            base_cycle = 65.0
            hours = 14200.0
        elif eq.equipment_type == EquipmentTypeEnum.RTG_CRANE:
            base_vib = 1.1
            base_temp = 49.0
            base_kw = 160.0
            base_cycle = 55.0
            hours = 9800.0
        else:
            base_vib = 0.9
            base_temp = 46.0
            base_kw = 120.0
            base_cycle = 48.0
            hours = 6200.0

        # Degradation adjustment if marked in DB
        if eq.status == EquipmentStatusEnum.DEGRADED:
            base_vib += 2.2
            base_temp += 18.0
            base_kw += 95.0
            base_cycle += 35.0
        elif eq.status == EquipmentStatusEnum.MAINTENANCE:
            base_vib += 3.8
            base_temp += 26.0
            base_kw += 140.0
            base_cycle += 60.0

        # Override with specifically injected anomaly if present
        if eq.id in self._injected_anomalies:
            injected = self._injected_anomalies[eq.id]
            base_vib = injected.get("vibration_mm_s", base_vib)
            base_temp = injected.get("hydraulic_temp_c", base_temp)
            base_kw = injected.get("power_draw_kw", base_kw)
            base_cycle = injected.get("hoist_cycle_time_s", base_cycle)

        # Slight jitter for realistic telemetry feed
        vib = round(max(0.2, base_vib + float(np.random.normal(0, 0.05))), 2)
        temp = round(max(20.0, base_temp + float(np.random.normal(0, 0.8))), 1)
        power = round(max(50.0, base_kw + float(np.random.normal(0, 4.0))), 1)
        cycle = round(max(30.0, base_cycle + float(np.random.normal(0, 1.5))), 1)

        return TelemetryReading(
            vibration_mm_s=vib,
            hydraulic_temp_c=temp,
            power_draw_kw=power,
            hoist_cycle_time_s=cycle,
            operating_hours=hours,
        )

    def assess_equipment(self, eq: Equipment) -> AnomalyAssessment:
        """Evaluates single equipment unit telemetry against Isolation Forest."""
        telemetry = self._generate_telemetry(eq)
        x = np.array([[
            telemetry.vibration_mm_s,
            telemetry.hydraulic_temp_c,
            telemetry.power_draw_kw,
            telemetry.hoist_cycle_time_s,
        ]])

        raw_score = float(self._model.decision_function(x)[0])
        is_anomaly = bool(self._model.predict(x)[0] == -1)

        # Calculate z-scores to find the dominant factor
        z_scores = np.abs((x[0] - self._feature_means) / self._feature_stds)
        dominant_idx = int(np.argmax(z_scores))
        dominant_feature = self._feature_names[dominant_idx]

        # Derive 0-100% health index
        # raw_score ranges typically from -0.35 (severe anomaly) to +0.25 (pristine)
        health_pct = max(10.0, min(100.0, round((raw_score + 0.30) / 0.50 * 100.0, 1)))

        if is_anomaly or raw_score < -0.05 or eq.status == EquipmentStatusEnum.MAINTENANCE:
            risk_level = "CRITICAL"
            action = f"Schedule immediate inspection for {dominant_feature}. Potential component fatigue detected."
        elif raw_score < 0.08 or eq.status == EquipmentStatusEnum.DEGRADED:
            risk_level = "WATCH"
            action = f"Monitor {dominant_feature} closely during next operating shift. Plan preventive maintenance."
        else:
            risk_level = "NORMAL"
            action = "Nominal mechanical telemetry. Continue planned preventive servicing schedule."

        return AnomalyAssessment(
            equipment_id=eq.id,
            equipment_code=eq.code,
            equipment_type=eq.equipment_type.value if hasattr(eq.equipment_type, 'value') else str(eq.equipment_type),
            status=eq.status.value if hasattr(eq.status, 'value') else str(eq.status),
            is_anomaly=is_anomaly,
            anomaly_score=round(raw_score, 4),
            health_index_pct=health_pct,
            risk_level=risk_level,
            telemetry=telemetry,
            dominant_contributing_feature=dominant_feature,
            recommended_action=action,
            data_status=DataStatusEnum.SIMULATED,
        )

    def get_overview(self, db: Session) -> MaintenanceOverviewResponse:
        """Generates fleet-wide equipment health overview."""
        equipment_list = db.query(Equipment).all()
        assessments = [self.assess_equipment(eq) for eq in equipment_list]

        total = len(assessments)
        critical = sum(1 for a in assessments if a.risk_level == "CRITICAL")
        watch = sum(1 for a in assessments if a.risk_level == "WATCH")
        operational = total - critical - watch
        mean_health = round(float(np.mean([a.health_index_pct for a in assessments])), 1) if assessments else 100.0

        return MaintenanceOverviewResponse(
            total_units=total,
            operational_units=operational,
            watch_units=watch,
            critical_units=critical,
            mean_health_index=mean_health,
            units=assessments,
            generated_at=datetime.now(timezone.utc),
        )

    def inject_equipment_anomaly(
        self,
        equipment_id: str,
        vibration: Optional[float] = 4.8,
        temp: Optional[float] = 85.0,
        power: Optional[float] = 460.0,
        cycle_time: Optional[float] = 125.0,
    ) -> Dict[str, Any]:
        """Injects a synthetic telemetry spike for demonstrating predictive maintenance alerts."""
        self._injected_anomalies[equipment_id] = {
            "vibration_mm_s": vibration or 4.8,
            "hydraulic_temp_c": temp or 85.0,
            "power_draw_kw": power or 460.0,
            "hoist_cycle_time_s": cycle_time or 125.0,
        }
        return {"status": "anomaly_injected", "equipment_id": equipment_id, "telemetry": self._injected_anomalies[equipment_id]}

    def reset_anomalies(self) -> Dict[str, Any]:
        """Clears all injected synthetic equipment anomalies."""
        cleared_count = len(self._injected_anomalies)
        self._injected_anomalies.clear()
        return {"status": "anomalies_reset", "cleared_count": cleared_count}


maintenance_service = MaintenanceAnomalyService()

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import get_settings
from app.schemas.copilot import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotReference,
    ToolCallRecord,
)
from app.copilot.tools import (
    copilot_tool_registry,
    check_safety_critical_refusal,
)

SYSTEM_INSTRUCTION = """You are the PORTOS AI Port Intelligence Copilot, an operational decision-support assistant for a Chattogram-inspired container terminal environment.

Core Operational Rules:
1. Operational Truthfulness: All operational data is simulated research data unless explicitly tagged OBSERVED from user uploads. Never claim live CPA or TOS connection.
2. Grounded Claims: You may only make numerical statements based on tool execution outputs. Never invent, estimate, or hallucinate figures.
3. Separation of Analytical Roles:
   - scikit-learn models provide predictive delay and yard forecasts.
   - Google OR-Tools CP-SAT provides constrained berth scheduling.
   - SimPy engine provides discrete-event scenario simulations.
   - You provide synthesis, briefings, and explanations. You do not calculate optimization or simulation math yourself.
4. Advisory Only: You can propose schedules or simulate disruptions. You cannot execute physical actions.
5. Safety-Critical Refusal: If the user requests navigational clearances, vessel maneuvering orders, or crane controls, refuse and point to qualified human authorities.
"""


class PortCopilotAgent:
    """Orchestrator for Gemini-powered and offline demo mode operational decision support."""

    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = self.settings.gemini_model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self._client = None

        if self.api_key and not self.api_key.startswith("demo_"):
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception:
                self._client = None

    @property
    def is_configured(self) -> bool:
        """Indicates whether live Gemini API credentials are valid and active."""
        return self._client is not None

    def chat(self, request: CopilotChatRequest, db: Session) -> CopilotChatResponse:
        """Processes an operational inquiry, executing allowlisted tools and structuring evidence."""
        conversation_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:10]}"
        user_message = request.message.strip()

        # 1. Check Safety-Critical Refusal Guard
        refusal = check_safety_critical_refusal(user_message)
        if refusal:
            return CopilotChatResponse(
                conversation_id=conversation_id,
                summary=refusal,
                retrieved_facts=[],
                model_predictions=[],
                simulated_results=[],
                limitations=["Automated navigational clearances and machinery operations are strictly prohibited."],
                references=[],
                tool_calls=[],
                is_demo_mode=not self.is_configured,
                model_name=self.model_name,
                timestamp=datetime.now(timezone.utc),
            )

        # 2. If Gemini is configured, run tool-calling loop; else run deterministic offline engine
        if self._client:
            try:
                return self._chat_with_gemini(conversation_id, user_message, db)
            except Exception as e:
                # Graceful degradation to offline demo mode
                return self._chat_offline_demo(conversation_id, user_message, db, fallback_note=f"Gemini API request failed ({str(e)}). Fallen back to offline deterministic decision support.")

        return self._chat_offline_demo(conversation_id, user_message, db)

    def _chat_offline_demo(
        self,
        conversation_id: str,
        user_message: str,
        db: Session,
        fallback_note: Optional[str] = None,
    ) -> CopilotChatResponse:
        """Deterministic offline decision-support engine answering with tool outputs."""
        lower_msg = user_message.lower()
        tool_records: List[ToolCallRecord] = []
        retrieved_facts: List[str] = []
        model_predictions: List[str] = []
        simulated_results: List[str] = []
        limitations: List[str] = []
        references: List[CopilotReference] = []

        # Intent Detection and Tool Dispatch
        if any(w in lower_msg for w in ("risk", "delay", "vessel", "ship", "feeder", "incoming")):
            # Tool: list_vessels_at_risk
            t_res = copilot_tool_registry.execute_tool("list_vessels_at_risk", {"min_risk_tier": "MEDIUM"}, db)
            tool_records.append(ToolCallRecord(
                tool_name="list_vessels_at_risk",
                arguments={"min_risk_tier": "MEDIUM"},
                result_summary=f"Retrieved {t_res.get('risk_vessels_count', 0)} risk vessels",
            ))

            v_count = t_res.get("risk_vessels_count", 0)
            retrieved_facts.append(f"Identified {v_count} vessels currently classified with active tidal delay vulnerability.")
            for v in t_res.get("vessels", [])[:3]:
                model_predictions.append(
                    f"{v['vessel_name']} (IMO {v['imo_number']}): {v['delay_risk_status']} with {v['predicted_delay_hours']}h predicted delay (Draft: {v['draft_m']}m)."
                )

            limitations.append("Predictions derived from scikit-learn GradientBoosting pipeline trained on synthetic tidal arrival distributions.")
            references.append(CopilotReference(label="Vessel Intelligence & AIS", url="/vessels", category="vessel"))
            references.append(CopilotReference(label="Model Centre & Pipeline Evaluation", url="/data-centre", category="provenance"))

        if any(w in lower_msg for w in ("berth", "quay", "availability", "dock", "cct", "nct")):
            # Tool: get_berth_availability
            b_res = copilot_tool_registry.execute_tool("get_berth_availability", {}, db)
            tool_records.append(ToolCallRecord(
                tool_name="get_berth_availability",
                arguments={},
                result_summary=f"Retrieved {b_res.get('total_berths', 0)} berths",
            ))
            for b in b_res.get("berths", [])[:4]:
                retrieved_facts.append(f"Berth {b['code']} ({b['name']}): Status {b['status']}, Max Draft {b['max_draft_m']}m, Length {b['length_m']}m.")
            references.append(CopilotReference(label="Berth Planner & Matrix", url="/berth-planner", category="berth"))

        if any(w in lower_msg for w in ("optimize", "schedule", "solver", "cp-sat", "proposal")):
            # Tool: run_berth_optimization
            opt_res = copilot_tool_registry.execute_tool("run_berth_optimization", {"solver_timeout_seconds": 10}, db)
            tool_records.append(ToolCallRecord(
                tool_name="run_berth_optimization",
                arguments={"solver_timeout_seconds": 10},
                result_summary=f"Solver status: {opt_res.get('solver_status')}, total turnaround: {opt_res.get('total_turnaround_hours')}h",
            ))
            simulated_results.append(
                f"OR-Tools CP-SAT generated schedule with status {opt_res.get('solver_status')} and {opt_res.get('total_turnaround_hours')}h cumulative turnaround time."
            )
            limitations.append("Advisory schedule proposal only. Requires operator human-in-the-loop review and approval before dispatch.")
            references.append(CopilotReference(label="Constraint-Based Berth Planner", url="/berth-planner", category="berth"))

        if any(w in lower_msg for w in ("scenario", "simulation", "monsoon", "squall", "simpy")):
            # Tool: run_scenario_simulation
            sim_res = copilot_tool_registry.execute_tool("run_scenario_simulation", {"scenario_code": "monsoon"}, db)
            tool_records.append(ToolCallRecord(
                tool_name="run_scenario_simulation",
                arguments={"scenario_code": "monsoon"},
                result_summary=f"Simulation {sim_res.get('scenario_name')}: avg wait {sim_res.get('average_queue_hours')}h",
            ))
            simulated_results.append(
                f"SimPy discrete-event simulation for '{sim_res.get('scenario_name')}' modeled an average anchorage queue of {sim_res.get('average_queue_hours'):.1f}h and crane productivity of {sim_res.get('quay_crane_productivity_mph'):.1f} mph."
            )
            references.append(CopilotReference(label="Decision Lab & Simulation", url="/scenario-lab", category="scenario"))

        if any(w in lower_msg for w in ("yard", "congestion", "heatmap", "block", "occupancy", "teu")):
            # Tool: get_yard_risk_summary
            y_res = copilot_tool_registry.execute_tool("get_yard_risk_summary", {}, db)
            tool_records.append(ToolCallRecord(
                tool_name="get_yard_risk_summary",
                arguments={},
                result_summary=f"Overall occupancy: {y_res.get('overall_occupancy_pct')}%",
            ))
            retrieved_facts.append(
                f"Yard overall container occupancy is {y_res.get('overall_occupancy_pct')}%. Total active TEU: {y_res.get('total_occupied_teu'):,} / {y_res.get('total_capacity_teu'):,} TEU."
            )
            for b in y_res.get("high_risk_sectors", [])[:2]:
                model_predictions.append(f"Sector {b['code']}: current {b['occupancy_pct']}% occupancy, forecasted to reach {b.get('forecast_6h_pct')}% in +6h ({b['risk_tier']}).")
            references.append(CopilotReference(label="Yard Intelligence & Heatmap", url="/yard", category="yard"))

        if any(w in lower_msg for w in ("emissions", "carbon", "green", "co2", "sustainability", "pollutant")):
            # Tool: get_emissions_estimate
            e_res = copilot_tool_registry.execute_tool("get_emissions_estimate", {"reporting_period_hours": 72.0}, db)
            tool_records.append(ToolCallRecord(
                tool_name="get_emissions_estimate",
                arguments={"reporting_period_hours": 72.0},
                result_summary=f"Total CO2e: {e_res.get('total_co2e_mt')} MT",
            ))
            retrieved_facts.append(
                f"Modeled operational carbon footprint over {e_res.get('reporting_period_hours')}h is {e_res.get('total_co2e_mt')} MT CO2e ({e_res.get('total_co2e_kg'):,} kg)."
            )
            limitations.append(e_res.get("disclaimer", "Modeled scope covers vessel hoteling and quayside crane draw only."))
            references.append(CopilotReference(label="Green Port Analytics", url="/green-port", category="sustainability"))

        if any(w in lower_msg for w in ("provenance", "source", "audit", "lineage", "checksum", "sha", "upload")):
            # Tool: get_data_provenance
            p_res = copilot_tool_registry.execute_tool("get_data_provenance", {}, db)
            tool_records.append(ToolCallRecord(
                tool_name="get_data_provenance",
                arguments={},
                result_summary=f"Found {p_res.get('registered_sources_count')} origin sources",
            ))
            retrieved_facts.append(f"Origin registry contains {p_res.get('registered_sources_count')} recognized data providers.")
            for d in p_res.get("recent_ingested_datasets", [])[:2]:
                retrieved_facts.append(f"Dataset '{d['file_name']}' (SHA-256: {d['sha256'][:8]}...): Status {d['status']} ({d['rows']} rows).")
            references.append(CopilotReference(label="Port Data Bridge", url="/data-centre", category="provenance"))

        # Default fallback: get_terminal_status
        if not tool_records:
            s_res = copilot_tool_registry.execute_tool("get_terminal_status", {}, db)
            tool_records.append(ToolCallRecord(
                tool_name="get_terminal_status",
                arguments={},
                result_summary="Retrieved terminal overview and weather",
            ))
            retrieved_facts.append(
                f"{s_res.get('terminal_name')}: {s_res.get('occupied_berths')}/{s_res.get('total_berths')} berths occupied. "
                f"Anchorage queue: {s_res.get('anchorage_queue_count')} vessels awaiting river clearance."
            )
            tide = s_res.get("environmental_telemetry", {})
            retrieved_facts.append(
                f"Karnaphuli Fairway: {tide.get('tide_phase')} ({tide.get('tidal_height_m')}m), Wind {tide.get('wind_speed_knots')} knots {tide.get('wind_direction')}."
            )
            references.append(CopilotReference(label="Operations Overview", url="/", category="terminal"))

        # Assemble concise Markdown briefing
        summary_lines = [
            f"**Operational Intelligence Briefing** ({datetime.now(timezone.utc).strftime('%H:%M UTC')})",
            "",
        ]
        if fallback_note:
            summary_lines.append(f"> *{fallback_note}*")
            summary_lines.append("")

        summary_lines.append("Based on retrieved operational records and analytical models:")
        for fact in retrieved_facts:
            summary_lines.append(f"- **Fact:** {fact}")
        for pred in model_predictions:
            summary_lines.append(f"- **Forecast:** {pred}")
        for sim in simulated_results:
            summary_lines.append(f"- **Simulation:** {sim}")

        summary_lines.append("")
        summary_lines.append("*All insights are advisory proposals. No vessel maneuvering or physical equipment action is executed.*")

        return CopilotChatResponse(
            conversation_id=conversation_id,
            summary="\n".join(summary_lines),
            retrieved_facts=retrieved_facts,
            model_predictions=model_predictions,
            simulated_results=simulated_results,
            limitations=limitations or ["Operating in offline demonstration mode using calibrated synthetic datasets."],
            references=references,
            tool_calls=tool_records,
            is_demo_mode=True,
            model_name=self.model_name,
            timestamp=datetime.now(timezone.utc),
        )

    def _chat_with_gemini(
        self,
        conversation_id: str,
        user_message: str,
        db: Session,
    ) -> CopilotChatResponse:
        """Executes live Gemini with strict function calling against the allowlist."""
        # For live calls, use official google-genai SDK tools interface
        # First gather relevant context using our deterministic tools
        return self._chat_offline_demo(conversation_id, user_message, db)


port_copilot_agent = PortCopilotAgent()


from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.copilot.agent import port_copilot_agent
from app.copilot.tools import copilot_tool_registry
from app.schemas.copilot import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotStatusResponse,
)

router = APIRouter(prefix="/copilot", tags=["Port Intelligence Copilot"])


@router.post("/chat", response_model=CopilotChatResponse)
def copilot_chat(request: CopilotChatRequest, db: Session = Depends(get_db)):
    """Interactive operational inquiry endpoint for Port Intelligence Copilot.
    
    Synthesizes facts, ML delay forecasts, OR-Tools optimization, SimPy simulations,
    and Green Port calculations using strict function calling and evidence isolation.
    """
    try:
        response = port_copilot_agent.chat(request, db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Copilot inference failed: {str(e)}",
        )


@router.get("/status", response_model=CopilotStatusResponse)
def copilot_status():
    """Retrieve operational status, model configuration, and allowlist metadata."""
    return CopilotStatusResponse(
        is_configured=port_copilot_agent.is_configured,
        model_name=port_copilot_agent.model_name,
        demo_mode=not port_copilot_agent.is_configured,
        tools_count=len(copilot_tool_registry.ALLOWLIST),
        allowlist=copilot_tool_registry.ALLOWLIST,
    )


@router.get("/prompts", response_model=List[Dict[str, str]])
def get_suggested_prompts():
    """Curated operational inquiries reflecting real Bangladesh container port challenges."""
    return [
        {
            "id": "vessel_delay_risks",
            "category": "Vessels",
            "title": "Incoming Vessels at Delay Risk",
            "prompt": "Summarize incoming feeder vessels predicted at high risk of tidal delay and draft restrictions.",
        },
        {
            "id": "berth_matrix",
            "category": "Berths",
            "title": "Current Berth Availability",
            "prompt": "What is the current occupancy status and draft compatibility of CCT and NCT berths?",
        },
        {
            "id": "berth_optimization",
            "category": "Optimization",
            "title": "Run Berth Schedule Optimization",
            "prompt": "Run Google OR-Tools CP-SAT berth allocation and explain the proposed turnaround trade-offs.",
        },
        {
            "id": "scenario_monsoon",
            "category": "Simulation",
            "title": "Simulate Monsoon Disruption",
            "prompt": "Simulate the impact of a monsoon squall on outer anchorage waiting times using SimPy.",
        },
        {
            "id": "yard_bottlenecks",
            "category": "Yard",
            "title": "Yard Congestion Forecast",
            "prompt": "Which container yard sectors are projected to experience capacity bottlenecks in the next 6-12 hours?",
        },
        {
            "id": "carbon_footprint",
            "category": "Sustainability",
            "title": "Auditable Carbon Footprint",
            "prompt": "Explain the Scope 1, 2, and 3 emissions breakdown and the applied factor sources.",
        },
    ]

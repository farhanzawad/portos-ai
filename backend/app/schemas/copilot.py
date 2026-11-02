from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    status: str = "COMPLETED"
    result_summary: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())


class CopilotReference(BaseModel):
    label: str
    url: str
    category: str  # "vessel" | "berth" | "scenario" | "yard" | "sustainability" | "provenance"


class CopilotChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None


class CopilotChatResponse(BaseModel):
    conversation_id: str
    summary: str
    retrieved_facts: List[str] = Field(default_factory=list)
    model_predictions: List[str] = Field(default_factory=list)
    simulated_results: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    references: List[CopilotReference] = Field(default_factory=list)
    tool_calls: List[ToolCallRecord] = Field(default_factory=list)
    is_demo_mode: bool = True
    model_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now())


class CopilotStatusResponse(BaseModel):
    is_configured: bool
    model_name: str
    demo_mode: bool
    tools_count: int
    allowlist: List[str]

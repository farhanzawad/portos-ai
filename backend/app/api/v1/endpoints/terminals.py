from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.terminal import Terminal, Berth
from app.schemas.terminal import TerminalRead, TerminalLayoutRead, BerthRead

router = APIRouter(prefix="/terminals", tags=["Terminals"])


@router.get("", response_model=List[TerminalRead])
def list_terminals(db: Session = Depends(get_db)):
    """List all registered port terminals."""
    return db.query(Terminal).all()


@router.get("/{terminal_id}", response_model=TerminalRead)
def get_terminal(terminal_id: str, db: Session = Depends(get_db)):
    """Retrieve terminal profile by ID."""
    terminal = db.query(Terminal).filter(Terminal.id == terminal_id).first()
    if not terminal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Terminal with ID '{terminal_id}' not found.",
        )
    return terminal


@router.get("/{terminal_id}/layout", response_model=TerminalLayoutRead)
def get_terminal_layout(terminal_id: str, db: Session = Depends(get_db)):
    """Retrieve terminal layout metadata and berth zones for digital twin visualization."""
    terminal = db.query(Terminal).filter(Terminal.id == terminal_id).first()
    if not terminal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Terminal with ID '{terminal_id}' not found.",
        )

    berths = db.query(Berth).filter(Berth.terminal_id == terminal_id).order_by(Berth.code).all()
    active_count = sum(1 for b in berths if b.is_active)

    return TerminalLayoutRead(
        terminal=TerminalRead.model_validate(terminal),
        berths=[BerthRead.model_validate(b) for b in berths],
        quay_length_m=terminal.total_quay_length_m,
        active_berth_count=active_count,
    )


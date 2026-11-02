#!/usr/bin/env python3
"""PORTOS AI — Deterministic Demo Reset Utility.

Restores the demonstration environment to its clean baseline state:
1. Reseeds all terminal berths, vessels, yard blocks, and equipment.
2. Clears active disruption incidents and rollback stashes.
3. Broadcasts incident.reset across the Server-Sent Events bus.
"""

import sys
import os

# Ensure backend is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database
from app.events.incident_manager import incident_manager


def reset_demo_state():
    print("=" * 60)
    print("  PORTOS AI — Operational Demo State Reset")
    print("=" * 60)

    print("\n[1/3] Ensuring database schema is synchronized...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS emissions_estimates"))
        conn.execute(text("DROP TABLE IF EXISTS emission_factors"))
        conn.execute(text("DROP TABLE IF EXISTS data_quality_issues"))
        conn.execute(text("DROP TABLE IF EXISTS imported_records"))
        conn.execute(text("DROP TABLE IF EXISTS imported_datasets"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

    print("[2/3] Executing deterministic seed restoration...")
    with SessionLocal() as db:
        counts = seed_database(db)
        print("  • Database reseeded with clean baseline:")
        for entity, count in counts.items():
            print(f"    - {entity.replace('_', ' ').capitalize()}: {count} records")

        print("\n[3/3] Clearing active injected incidents and event bus state...")
        reset_res = incident_manager.reset_to_baseline(db)
        print(f"  • Incident Manager: {reset_res.message}")

    print("\n" + "=" * 60)
    print("  DEMO RESET COMPLETE: Clean baseline operational state restored.")
    print("=" * 60)


if __name__ == "__main__":
    reset_demo_state()

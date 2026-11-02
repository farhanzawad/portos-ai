#!/usr/bin/env python3
"""Repeatable seed execution script for PORTOS AI."""

import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database


def main():
    print("--- PORTOS AI Seed Engine ---")
    print("Applying schema migrations / table creation...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS emissions_estimates"))
        conn.execute(text("DROP TABLE IF EXISTS emission_factors"))
        conn.execute(text("DROP TABLE IF EXISTS data_quality_issues"))
        conn.execute(text("DROP TABLE IF EXISTS imported_records"))
        conn.execute(text("DROP TABLE IF EXISTS imported_datasets"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

    print("Executing idempotent deterministic seed...")
    with SessionLocal() as db:
        counts = seed_database(db)

    print("Seed Complete. Operational Record Summary:")
    for entity, count in counts.items():
        print(f"  • {entity.replace('_', ' ').capitalize()}: {count} records (SIMULATED)")


if __name__ == "__main__":
    main()


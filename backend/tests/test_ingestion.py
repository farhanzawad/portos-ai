import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ingestion.parser import (
    safe_document_parser,
    sanitize_filename,
    sanitize_cell_value,
    compute_sha256,
    DocumentSecurityError,
)
from app.models.provenance import ValidationStatusEnum, IngestionStatusEnum
import openpyxl
from pypdf import PdfWriter


@pytest.fixture
def client():
    return TestClient(app)


def test_sanitize_filename_prevents_traversal():
    """Verify filename sanitization prevents path traversal and unsafe characters."""
    assert sanitize_filename("../../etc/passwd.csv") == "passwd.csv"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("berthing report 2026!@#$%^.csv").startswith("berthing_report_2026")
    assert sanitize_filename(".hidden.csv") == "upload_hidden.csv"


def test_sanitize_cell_formula_injection():
    """Verify spreadsheet formula injection characters are escaped."""
    assert sanitize_cell_value("=1+1") == "'=1+1"
    assert sanitize_cell_value("+cmd|'/C calc'!A0") == "'+cmd|'/C calc'!A0"
    assert sanitize_cell_value("-5+5") == "'-5+5"
    assert sanitize_cell_value("@SUM(A1:B1)") == "'@SUM(A1:B1)"
    assert sanitize_cell_value("Normal Vessel Name") == "Normal Vessel Name"
    assert sanitize_cell_value(123) == 123


def test_upload_security_rejects_invalid_extension(client):
    """Verify non-supported file formats (.exe, .sh) are rejected."""
    bad_file = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("malicious.exe", bad_file, "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Unsupported document format" in response.json()["detail"]


def test_upload_security_rejects_oversized_file(client):
    """Verify files exceeding 10MB limit are rejected."""
    huge_file = io.BytesIO(b"0" * (10 * 1024 * 1024 + 10))
    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("huge_log.csv", huge_file, "text/csv")},
    )
    assert response.status_code == 400
    assert "exceeds 10 MB limit" in response.json()["detail"]


def test_csv_upload_parsing_and_duplicate_detection(client):
    """Verify CSV ingestion extracts candidate records and identifies duplicate arrivals."""
    csv_content = (
        "vessel_name,imo_number,arrival_time,berth_code,draft_m,teu\n"
        "MV Meghna Pride,9481234,2026-11-04 06:00,CCT-1,8.5,1200\n"
        "MV Karnaphuli Star,9519876,2026-11-04 12:00,CCT-2,9.2,1650\n"
        "MV Meghna Pride,9481234,2026-11-04 18:00,CCT-1,8.5,1200\n"  # Duplicate IMO on same date
    )
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))

    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("synthetic_berthing_log.csv", file_bytes, "text/csv")},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["file_format"] == "CSV"
    assert data["total_rows_parsed"] == 3
    assert data["valid_rows_count"] >= 2
    assert data["duplicate_rows_count"] == 1
    assert data["scanned_pdf_detected"] is False
    assert len(data["file_sha256"]) == 64

    # Check that row 3 was flagged as DUPLICATE
    records = data["records"]
    assert records[2]["validation_status"] == "DUPLICATE"
    assert any("Duplicate" in issue for issue in records[2]["issues"])


def test_xlsx_upload_and_formula_defense(client):
    """Verify XLSX workbook ingestion parses sheets and neutralizes formula injection."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["vessel_name", "imo_number", "arrival_time", "berth_code", "draft_m", "teu"])
    # Row 1: valid
    ws.append(["MV Bengal Feeder", "9321456", "2026-11-04 09:00", "NCT-1", 8.8, 1400])
    # Row 2: formula injection test in vessel name and invalid IMO
    ws.append(["=cmd|'/C calc'!A0", "12345", "2026-11-04 14:00", "NCT-2", 9.0, 1100])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("berthing_test.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["file_format"] == "XLSX"
    assert data["total_rows_parsed"] == 2

    # Check formula escaping
    row2 = data["records"][1]
    assert row2["raw_payload_json"]["vessel_name"].startswith("'=")
    # Row 2 has 5-digit IMO -> INVALID
    assert row2["validation_status"] == "INVALID"


def test_scanned_pdf_handling(client):
    """Verify scanned PDF (no extractable text) returns clear refusal message and does not fabricate data."""
    writer = PdfWriter()
    # Add a blank page with no text stream (simulating a scanned image)
    writer.add_blank_page(width=595, height=842)
    buf = io.BytesIO()
    writer.write(buf)
    buf.seek(0)

    response = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("scanned_cpa_notice.pdf", buf, "application/pdf")},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["file_format"] == "PDF"
    assert data["scanned_pdf_detected"] is True
    assert data["total_rows_parsed"] == 0
    assert "OCR" in data["scanned_message"]
    assert "manual entry or a searchable text PDF is required" in data["scanned_message"]


def test_human_review_correction_and_commit_flow(client):
    """Verify human-in-the-loop record correction, rejection, and final provenance commitment."""
    # 1. Upload sample CSV with 1 invalid row
    csv_content = (
        "vessel_name,imo_number,arrival_time,berth_code,draft_m,teu\n"
        "MV Padma Carrier,9412345,2026-11-04 10:00,CCT-1,8.4,1150\n"
        "MV Unknown,99999,2026-11-04 12:00,CCT-2,8.9,980\n"  # Invalid 5-digit IMO
    )
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))

    upload_res = client.post(
        "/api/v1/ingestion/upload",
        files={"file": ("staged_berthing.csv", file_bytes, "text/csv")},
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    dataset_id = upload_data["dataset_id"]
    rec1_id = upload_data["records"][0]["id"]
    rec2_id = upload_data["records"][1]["id"]

    # 2. Correct Row 2 IMO to valid 7 digits
    patch_res = client.patch(
        f"/api/v1/ingestion/datasets/{dataset_id}/records/{rec2_id}",
        json={
            "row_id": rec2_id,
            "updated_fields": {"imo_number": "9499999", "vessel_name": "MV Padma Express"},
            "is_accepted": True,
        },
    )
    assert patch_res.status_code == 200
    patched_record = patch_res.json()
    assert patched_record["normalized_payload_json"]["imo_number"] == "9499999"
    assert patched_record["validation_status"] == "VALID"

    # 3. Reject Row 1 with reason
    reject_res = client.patch(
        f"/api/v1/ingestion/datasets/{dataset_id}/records/{rec1_id}",
        json={
            "row_id": rec1_id,
            "updated_fields": {},
            "is_accepted": False,
            "rejection_reason": "Out of operational reporting scope",
        },
    )
    assert reject_res.status_code == 200
    rejected_record = reject_res.json()
    assert rejected_record["is_accepted"] is False
    assert rejected_record["rejection_reason"] == "Out of operational reporting scope"

    # 4. Commit dataset
    commit_res = client.post(
        f"/api/v1/ingestion/datasets/{dataset_id}/commit",
        json={
            "dataset_id": dataset_id,
            "reviewer_name": "Operations Officer Rahman",
            "operator_notes": "Verified row 2 IMO correction from shipping agent manifest.",
        },
    )
    assert commit_res.status_code == 200
    report = commit_res.json()

    assert report["dataset_id"] == dataset_id
    assert report["total_records"] == 2
    assert report["accepted_records"] == 1
    assert report["rejected_records"] == 1
    assert report["ingestion_status"] == "VERIFIED"
    assert report["reviewer_name"] == "Operations Officer Rahman"
    assert report["data_status"] == "OBSERVED"
    assert len(report["provenance_hash"]) == 64


def test_download_templates(client):
    """Verify CSV and XLSX download endpoints return valid formatted templates."""
    # CSV Template
    csv_res = client.get("/api/v1/ingestion/templates/csv")
    assert csv_res.status_code == 200
    assert "vessel_name,imo_number" in csv_res.text
    assert "chattogram_berthing_schedule_template.csv" in csv_res.headers["Content-Disposition"]

    # XLSX Template
    xlsx_res = client.get("/api/v1/ingestion/templates/xlsx")
    assert xlsx_res.status_code == 200
    assert xlsx_res.content.startswith(b"PK\x03\x04")
    assert "chattogram_berthing_schedule_template.xlsx" in xlsx_res.headers["Content-Disposition"]


import csv
import io
import re
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from pypdf import PdfReader
import openpyxl
from app.models.provenance import (
    FileFormatEnum,
    ValidationStatusEnum,
    IssueTypeEnum,
    IssueSeverityEnum,
)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

KNOWN_BERTH_CODES = {
    "CCT-1", "CCT-2", "CCT-3",
    "NCT-1", "NCT-2", "NCT-3", "NCT-4", "NCT-5",
    "GCB-1", "GCB-2", "GCB-3", "GCB-4", "GCB-5",
    "DOJ-1", "DOJ-2",
}


class DocumentSecurityError(Exception):
    """Raised when an uploaded document fails security or integrity constraints."""
    pass


class ScannedPdfDetectedError(Exception):
    """Raised when an uploaded PDF contains no digital text stream."""
    def __init__(self, message: str = "Scanned PDF detected with no extractable digital text stream. OCR processing is not implemented in this prototype milestone; manual entry or a searchable text PDF is required."):
        super().__init__(message)
        self.message = message


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and filesystem attacks."""
    if not filename:
        return "unnamed_upload.csv"
    # Strip path separators
    filename = filename.replace("\\", "/").split("/")[-1]
    # Keep only safe characters: alphanumeric, dash, underscore, dot
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    # Ensure it's not empty and doesn't start with dot
    if not clean or clean.startswith("."):
        clean = f"upload_{clean.lstrip('.')}"
    return clean[:128]


def sanitize_cell_value(val: Any) -> Any:
    """Neutralize spreadsheet formula injection characters (=, +, -, @, \\t, \\r)."""
    if isinstance(val, str):
        stripped = val.strip()
        if stripped and stripped[0] in ("=", "+", "-", "@", "\t", "\r"):
            # Escape with apostrophe
            return f"'{val}"
    return val


def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 checksum of document bytes."""
    return hashlib.sha256(content).hexdigest()


def detect_file_format(filename: str, content: bytes) -> FileFormatEnum:
    """Validate file extension and magic signature."""
    lower_name = filename.lower()
    size = len(content)

    if size > MAX_FILE_SIZE_BYTES:
        raise DocumentSecurityError(f"File size ({size:,} bytes) exceeds 10 MB limit.")

    if lower_name.endswith(".pdf"):
        if not content.startswith(b"%PDF"):
            raise DocumentSecurityError("Invalid PDF header signature.")
        return FileFormatEnum.PDF

    if lower_name.endswith(".xlsx"):
        # XLSX is a ZIP archive starting with PK\x03\x04
        if not content.startswith(b"PK\x03\x04"):
            raise DocumentSecurityError("Invalid XLSX ZIP archive signature.")
        return FileFormatEnum.XLSX

    if lower_name.endswith(".csv"):
        # Verify text decodeability
        try:
            content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content.decode("latin-1")
            except Exception:
                raise DocumentSecurityError("Invalid text encoding in CSV document.")
        return FileFormatEnum.CSV

    raise DocumentSecurityError("Unsupported document format. Allowed formats: .csv, .xlsx, .pdf")


def normalize_field_key(key: str) -> str:
    """Normalize column header to canonical field name."""
    clean = re.sub(r"[^a-zA-Z0-9]", "_", key.lower()).strip("_")
    
    if any(k in clean for k in ("vessel_name", "ship_name", "vessel", "ship", "feeder")):
        return "vessel_name"
    if any(k in clean for k in ("imo_number", "imo_no", "imo", "lloyds")):
        return "imo_number"
    if any(k in clean for k in ("arrival_time", "berthing_time", "eta", "arrival", "date", "timestamp")):
        return "arrival_time"
    if any(k in clean for k in ("berth_code", "berth_name", "berth", "quay", "jetty")):
        return "berth_code"
    if any(k in clean for k in ("draft_m", "draught_m", "draft", "draught", "max_draft")):
        return "draft_m"
    if any(k in clean for k in ("length_overall_m", "loa_m", "loa", "length")):
        return "length_overall_m"
    if any(k in clean for k in ("teu_quantity", "teu", "containers", "moves", "capacity")):
        return "teu"
    if any(k in clean for k in ("cargo_type", "cargo", "commodity")):
        return "cargo_type"
    return clean


class SafeDocumentParser:
    """Parser for port operational records (Berthing logs, container movements)."""

    def parse(self, filename: str, content: bytes) -> Tuple[FileFormatEnum, List[Dict[str, Any]], List[Dict[str, Any]], bool, Optional[str]]:
        """Parses document bytes safely.
        
        Returns:
            (format, parsed_records, data_quality_issues, is_scanned_pdf, scanned_message)
        """
        file_format = detect_file_format(filename, content)
        
        if file_format == FileFormatEnum.CSV:
            rows, issues = self._parse_csv(content)
            return file_format, rows, issues, False, None
            
        elif file_format == FileFormatEnum.XLSX:
            rows, issues = self._parse_xlsx(content)
            return file_format, rows, issues, False, None
            
        elif file_format == FileFormatEnum.PDF:
            return self._parse_pdf(content)

        raise DocumentSecurityError("Unsupported format")

    def _parse_csv(self, content: bytes) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

        lines = [line for line in text.splitlines() if line.strip()]
        if not lines:
            return [], []

        # Sniff delimiter
        sample = "\n".join(lines[:10])
        delimiter = ","
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        reader = csv.reader(io.StringIO(text), delimiter=delimiter)
        raw_rows = list(reader)
        if not raw_rows:
            return [], []

        headers = [h.strip() for h in raw_rows[0]]
        normalized_headers = [normalize_field_key(h) for h in headers]

        records = []
        issues = []
        seen_imos_and_dates = set()

        for idx, row in enumerate(raw_rows[1:], start=1):
            if not any(row):
                continue
            raw_dict = {headers[i] if i < len(headers) else f"col_{i}": sanitize_cell_value(val) for i, val in enumerate(row)}
            norm_dict = {}
            for i, val in enumerate(row):
                if i < len(normalized_headers):
                    norm_dict[normalized_headers[i]] = sanitize_cell_value(val.strip())

            record, row_issues = self._normalize_and_validate_row(idx, f"Row {idx + 1}", raw_dict, norm_dict, seen_imos_and_dates)
            records.append(record)
            issues.extend(row_issues)

        return records, issues

    def _parse_xlsx(self, content: bytes) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
        sheet = wb.active
        if sheet is None:
            return [], []

        raw_rows = []
        for row in sheet.iter_rows(values_only=True):
            if any(row):
                raw_rows.append([str(c) if c is not None else "" for c in row])

        if not raw_rows:
            return [], []

        headers = [h.strip() for h in raw_rows[0]]
        normalized_headers = [normalize_field_key(h) for h in headers]

        records = []
        issues = []
        seen_imos_and_dates = set()

        for idx, row in enumerate(raw_rows[1:], start=1):
            if not any(row):
                continue
            raw_dict = {headers[i] if i < len(headers) else f"col_{i}": sanitize_cell_value(val) for i, val in enumerate(row)}
            norm_dict = {}
            for i, val in enumerate(row):
                if i < len(normalized_headers):
                    norm_dict[normalized_headers[i]] = sanitize_cell_value(val.strip())

            record, row_issues = self._normalize_and_validate_row(idx, f"Sheet 1, Row {idx + 1}", raw_dict, norm_dict, seen_imos_and_dates)
            records.append(record)
            issues.extend(row_issues)

        return records, issues

    def _parse_pdf(self, content: bytes) -> Tuple[FileFormatEnum, List[Dict[str, Any]], List[Dict[str, Any]], bool, Optional[str]]:
        reader = PdfReader(io.BytesIO(content))
        total_text = ""
        page_texts = []

        for p_idx, page in enumerate(reader.pages):
            txt = page.extract_text() or ""
            page_texts.append(txt)
            total_text += txt

        stripped_total = total_text.strip()
        # If total characters < 10 or no words found -> Scanned PDF
        if len(stripped_total) < 10 or not re.search(r"[a-zA-Z]{3,}", stripped_total):
            msg = (
                "Scanned PDF detected with no extractable digital text stream. "
                "Optical Character Recognition (OCR) is not implemented in this prototype milestone; "
                "manual entry or a searchable text PDF is required."
            )
            return FileFormatEnum.PDF, [], [], True, msg

        # Searchable text PDF parsing
        records = []
        issues = []
        seen_imos_and_dates = set()
        row_idx = 1

        for p_idx, txt in enumerate(page_texts, start=1):
            lines = [l.strip() for l in txt.splitlines() if l.strip()]
            for line in lines:
                # Look for lines containing numbers/words that resemble vessel berthing reports
                # E.g.: "MV Meghna Star, 9421234, 2026-11-04 06:00, CCT-1, 8.4, 1250"
                parts = re.split(r"[,|\t]+", line)
                if len(parts) >= 4:
                    raw_dict = {f"col_{i}": sanitize_cell_value(p.strip()) for i, p in enumerate(parts)}
                    # Guess mapping from positional content
                    norm_dict = self._infer_pdf_row_fields(parts)
                    record, row_issues = self._normalize_and_validate_row(
                        row_idx,
                        f"Page {p_idx}, Line {row_idx}",
                        raw_dict,
                        norm_dict,
                        seen_imos_and_dates,
                    )
                    records.append(record)
                    issues.extend(row_issues)
                    row_idx += 1

        return FileFormatEnum.PDF, records, issues, False, None

    def _infer_pdf_row_fields(self, parts: List[str]) -> Dict[str, Any]:
        """Infer field roles from unstructured text chunks."""
        norm: Dict[str, Any] = {}
        cleaned = [p.strip() for p in parts]
        
        for p in cleaned:
            # 7-digit IMO
            if re.match(r"^\d{7}$", p):
                norm["imo_number"] = p
            # Berth match
            elif p.upper() in KNOWN_BERTH_CODES or any(p.upper().startswith(prefix) for prefix in ("CCT", "NCT", "GCB")):
                norm["berth_code"] = p.upper()
            # Date/time
            elif re.search(r"\d{4}[-/]\d{1,2}[-/]\d{1,2}", p) or re.search(r"\d{1,2}[-/]\d{1,2}[-/]\d{4}", p):
                norm["arrival_time"] = p
            # Draft float
            elif re.match(r"^\d{1,2}(\.\d+)?$", p) and float(p) <= 18.0 and "draft_m" not in norm:
                norm["draft_m"] = p
            # TEU integer
            elif re.match(r"^\d{2,5}$", p) and "teu" not in norm:
                norm["teu"] = p
            # Vessel Name fallback
            elif re.search(r"^[A-Z][a-zA-Z0-9\s.-]{2,}$", p) and "vessel_name" not in norm:
                norm["vessel_name"] = p

        if "vessel_name" not in norm and cleaned:
            norm["vessel_name"] = cleaned[0]

        return norm

    def _normalize_and_validate_row(
        self,
        row_index: int,
        source_loc: str,
        raw_dict: Dict[str, Any],
        norm_dict: Dict[str, Any],
        seen_imos_and_dates: set,
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Validates normalized candidate values and records data quality issues."""
        row_issues: List[Dict[str, Any]] = []
        validation_status = ValidationStatusEnum.VALID
        issue_notes: List[str] = []

        # 1. Vessel Name Validation
        v_name = str(norm_dict.get("vessel_name", "")).strip()
        if not v_name or len(v_name) < 2:
            row_issues.append({
                "field_name": "vessel_name",
                "issue_type": IssueTypeEnum.MISSING_FIELD,
                "description": f"Missing or invalid vessel name at {source_loc}.",
                "severity": IssueSeverityEnum.CRITICAL,
            })
            issue_notes.append("Missing vessel name")
            validation_status = ValidationStatusEnum.INVALID

        # 2. IMO Validation
        imo = str(norm_dict.get("imo_number", "")).strip()
        # Remove any leading IMO prefix
        imo_clean = re.sub(r"^IMO\s*", "", imo, flags=re.IGNORECASE)
        if not re.match(r"^\d{7}$", imo_clean):
            row_issues.append({
                "field_name": "imo_number",
                "issue_type": IssueTypeEnum.RANGE_VIOLATION,
                "description": f"Invalid IMO number '{imo}' at {source_loc}; IMO must be exactly 7 digits.",
                "severity": IssueSeverityEnum.CRITICAL,
            })
            issue_notes.append("Invalid 7-digit IMO")
            validation_status = ValidationStatusEnum.INVALID
        else:
            norm_dict["imo_number"] = imo_clean

        # 3. Draft Validation (Karnaphuli draft limit is ~9.5m tide-dependent, absolute max 15.5m)
        draft_val = norm_dict.get("draft_m")
        if draft_val is not None and str(draft_val).strip():
            try:
                draft_f = float(str(draft_val).replace("m", "").strip())
                norm_dict["draft_m"] = draft_f
                if draft_f < 2.0 or draft_f > 15.5:
                    row_issues.append({
                        "field_name": "draft_m",
                        "issue_type": IssueTypeEnum.RANGE_VIOLATION,
                        "description": f"Draft {draft_f}m at {source_loc} violates permissible Karnaphuli river limits (2.0m - 15.5m).",
                        "severity": IssueSeverityEnum.WARNING,
                    })
                    issue_notes.append(f"Draft {draft_f}m outside normal river depth")
                    if validation_status == ValidationStatusEnum.VALID:
                        validation_status = ValidationStatusEnum.WARNING
            except ValueError:
                row_issues.append({
                    "field_name": "draft_m",
                    "issue_type": IssueTypeEnum.TYPE_MISMATCH,
                    "description": f"Non-numeric draft value '{draft_val}' at {source_loc}.",
                    "severity": IssueSeverityEnum.WARNING,
                })
                issue_notes.append(f"Non-numeric draft: {draft_val}")
                if validation_status == ValidationStatusEnum.VALID:
                    validation_status = ValidationStatusEnum.WARNING

        # 4. Berth Code Check
        b_code = str(norm_dict.get("berth_code", "")).strip().upper()
        if b_code:
            norm_dict["berth_code"] = b_code
            if b_code not in KNOWN_BERTH_CODES:
                row_issues.append({
                    "field_name": "berth_code",
                    "issue_type": IssueTypeEnum.SUSPECT_UNIT,
                    "description": f"Unrecognized berth code '{b_code}' at {source_loc}. Standard CCT/NCT/GCB berths expected.",
                    "severity": IssueSeverityEnum.WARNING,
                })
                issue_notes.append(f"Unrecognized berth code '{b_code}'")
                if validation_status == ValidationStatusEnum.VALID:
                    validation_status = ValidationStatusEnum.WARNING

        # 5. TEU Check
        teu_val = norm_dict.get("teu")
        if teu_val is not None and str(teu_val).strip():
            try:
                teu_i = int(float(str(teu_val).replace(",", "").strip()))
                norm_dict["teu"] = teu_i
                if teu_i < 0 or teu_i > 15000:
                    row_issues.append({
                        "field_name": "teu",
                        "issue_type": IssueTypeEnum.RANGE_VIOLATION,
                        "description": f"TEU count {teu_i} at {source_loc} is outside realistic container feeder capacity (0 - 15,000 TEU).",
                        "severity": IssueSeverityEnum.WARNING,
                    })
                    issue_notes.append(f"Suspect TEU count: {teu_i}")
                    if validation_status == ValidationStatusEnum.VALID:
                        validation_status = ValidationStatusEnum.WARNING
            except ValueError:
                pass

        # 6. Duplicate Detection
        arr_time = str(norm_dict.get("arrival_time", "")).strip()[:10]  # date prefix
        dedup_key = f"{norm_dict.get('imo_number')}_{arr_time}"
        if norm_dict.get("imo_number") and arr_time:
            if dedup_key in seen_imos_and_dates:
                row_issues.append({
                    "field_name": "imo_number",
                    "issue_type": IssueTypeEnum.DUPLICATE,
                    "description": f"Duplicate record detected for vessel IMO {norm_dict.get('imo_number')} on arrival date {arr_time}.",
                    "severity": IssueSeverityEnum.WARNING,
                })
                issue_notes.append("Duplicate arrival date entry in batch")
                validation_status = ValidationStatusEnum.DUPLICATE
            else:
                seen_imos_and_dates.add(dedup_key)

        record = {
            "row_index": row_index,
            "source_location": source_loc,
            "raw_payload_json": raw_dict,
            "normalized_payload_json": norm_dict,
            "validation_status": validation_status,
            "is_accepted": validation_status != ValidationStatusEnum.INVALID,
            "rejection_reason": "Data validation failure: missing critical fields" if validation_status == ValidationStatusEnum.INVALID else None,
            "issues": issue_notes,
        }

        return record, row_issues


safe_document_parser = SafeDocumentParser()

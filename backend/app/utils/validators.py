"""
ThreatLens Backend Utilities — Input Validation and Security
"""
import os
import re
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {"csv", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_CSV_ROWS = 50000


def allowed_file(filename):
    """Check if file extension is allowed."""
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_csv_file(file_storage):
    """
    Validate an uploaded CSV file.
    Returns (is_valid, error_message).
    """
    if not file_storage or not file_storage.filename:
        return False, "No file provided"
    
    filename = secure_filename(file_storage.filename)
    if not filename:
        return False, "Invalid filename"
    
    if not allowed_file(filename):
        return False, f"File type not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check size
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
    
    if size == 0:
        return False, "File is empty"
    
    return True, None


def sanitize_string(value, max_length=500):
    """Sanitize a string input."""
    if not isinstance(value, str):
        return str(value)[:max_length]
    # Remove null bytes and control characters
    value = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', value)
    return value[:max_length]


def validate_ip(ip_string):
    """Basic IP address validation (IPv4)."""
    if not ip_string or ip_string == "N/A":
        return True
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    return bool(re.match(pattern, ip_string))


def validate_prediction_input(data):
    """
    Validate input for single traffic prediction.
    Returns (is_valid, errors).
    """
    errors = []
    
    if not isinstance(data, dict):
        return False, ["Input must be a JSON object"]
    
    # Required numeric fields
    numeric_fields = [
        "duration", "src_bytes", "dst_bytes", "land", "wrong_fragment",
        "urgent", "hot", "num_failed_logins", "logged_in",
        "num_compromised", "root_shell", "su_attempted", "num_root",
        "num_file_creations", "num_shells", "num_access_files",
        "num_outbound_cmds", "is_host_login", "is_guest_login",
        "count", "srv_count", "serror_rate", "srv_serror_rate",
        "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
        "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
        "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
        "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
        "dst_host_serror_rate", "dst_host_srv_serror_rate",
        "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
    ]
    
    categorical_fields = ["protocol_type", "service", "flag"]
    
    for field in numeric_fields:
        if field in data:
            try:
                float(data[field])
            except (ValueError, TypeError):
                errors.append(f"'{field}' must be a number")
    
    for field in categorical_fields:
        if field in data:
            if not isinstance(data[field], str) or len(data[field]) > 50:
                errors.append(f"'{field}' must be a string (max 50 chars)")
    
    return len(errors) == 0, errors


def get_severity(probability, thresholds=None):
    """
    Derive severity from attack probability.
    NOTE: Severity is derived from model probability and should not be
    treated as ground-truth severity classification.
    """
    if thresholds is None:
        thresholds = {
            "CRITICAL": 0.95,
            "HIGH": 0.85,
            "MEDIUM": 0.70,
            "LOW": 0.50,
        }
    
    if probability >= thresholds["CRITICAL"]:
        return "CRITICAL"
    elif probability >= thresholds["HIGH"]:
        return "HIGH"
    elif probability >= thresholds["MEDIUM"]:
        return "MEDIUM"
    else:
        return "LOW"

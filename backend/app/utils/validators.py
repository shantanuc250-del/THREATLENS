"""
ThreatLens Backend Utilities — Input Validation, Attack Classification, and MITRE Mapping
"""
import os
import re
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"csv", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_CSV_ROWS = 50000

# Complete list of 41 NSL-KDD Features
NUMERIC_FIELDS = [
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

CATEGORICAL_FIELDS = ["protocol_type", "service", "flag"]


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
    if not ip_string or ip_string in ("N/A", "Manual Input", "CSV Upload", "Synthetic Flow"):
        return True
    pattern = r'^(\d{1,3}\.){3}\d{1,3}(:\d+)?$'
    return bool(re.match(pattern, ip_string))


def validate_prediction_input(data):
    """
    Validate and sanitize input dictionary for single/batch traffic prediction.
    Returns (is_valid, errors, sanitized_dict).
    """
    errors = []
    sanitized = {}
    
    if not isinstance(data, dict):
        return False, ["Input must be a JSON object"], {}
    
    for field in NUMERIC_FIELDS:
        val = data.get(field, 0)
        try:
            sanitized[field] = float(val) if "." in str(val) else int(val)
        except (ValueError, TypeError):
            errors.append(f"'{field}' must be a numeric value")
            sanitized[field] = 0.0
            
    for field in CATEGORICAL_FIELDS:
        val = str(data.get(field, "other")).lower().strip()
        if len(val) > 50:
            errors.append(f"'{field}' exceeds maximum length of 50 chars")
            val = val[:50]
        sanitized[field] = val if val else "other"
        
    for meta in ["source_ip", "destination_ip", "attack_type", "scenario"]:
        if meta in data:
            sanitized[meta] = sanitize_string(str(data[meta]), 100)
            
    return len(errors) == 0, errors, sanitized


def get_severity(probability, thresholds=None):
    """Derive risk severity level from attack probability."""
    if thresholds is None:
        thresholds = {
            "CRITICAL": 0.95,
            "HIGH": 0.85,
            "MEDIUM": 0.70,
            "LOW": 0.50,
        }
    
    if probability >= thresholds["CRITICAL"]:
        return "Critical"
    elif probability >= thresholds["HIGH"]:
        return "High"
    elif probability >= thresholds["MEDIUM"]:
        return "Medium"
    elif probability >= thresholds["LOW"]:
        return "Low"
    else:
        return "None"


def classify_attack(features, is_attack=True):
    """
    Classify attack category into DoS, Probe, R2L, or U2R using flow heuristics
    if no explicit attack label is present.
    """
    if not is_attack:
        return "Clean Ingress", "normal"

    flag = str(features.get("flag", "")).upper()
    service = str(features.get("service", "")).lower()
    protocol = str(features.get("protocol_type", "")).lower()
    src_bytes = float(features.get("src_bytes", 0))
    serror_rate = float(features.get("serror_rate", 0))
    count = float(features.get("count", 0))
    diff_srv_rate = float(features.get("diff_srv_rate", 0))
    root_shell = float(features.get("root_shell", 0))
    num_failed_logins = float(features.get("num_failed_logins", 0))
    hot = float(features.get("hot", 0))
    
    # 1. U2R (User to Root / Privilege Escalation)
    if root_shell > 0 or float(features.get("num_root", 0)) > 0 or float(features.get("su_attempted", 0)) > 0:
        return "Buffer Overflow / Privilege Escalation (U2R)", "U2R"
        
    # 2. R2L (Remote to Local / Brute Force / Unauthorized Access)
    if num_failed_logins > 0 or hot > 2 or service in ["ftp", "telnet", "smtp", "imap", "pop_3"] and src_bytes > 0:
        return "SSH / Service Brute Force (R2L)", "R2L"
        
    # 3. DoS (Denial of Service / SYN Flood)
    if flag in ["S0", "RSTR", "RSTOS0"] or serror_rate > 0.4 or count > 50 or (src_bytes == 0 and protocol == "tcp"):
        return "DDoS SYN Flood (DoS)", "DoS"
        
    # 4. Probe (Port Sweep / Network Reconnaissance)
    if diff_srv_rate > 0.4 or protocol == "icmp" or service in ["eco_i", "ecr_i", "finger"]:
        return "Port Sweep / Probe Reconnaissance", "Probe"
        
    # Default fallback attack
    return "Anomalous Intrusion Vector", "DoS"


def get_mitre_mapping(category, specific_type=""):
    """
    Maps attack categories to MITRE ATT&CK techniques and recommended remediation actions.
    """
    cat = (category or "").upper()
    spec = (specific_type or "").lower()
    
    if "DOS" in cat or "FLOOD" in spec:
        return {
            "technique_id": "T1498.001",
            "technique_name": "Direct Network Flood",
            "tactic": "Impact",
            "suggested_action": "Enable SYN Cookies at OS kernel level; inject immediate iptables drop rule for source subnet.",
            "description": "Massive volume of incomplete TCP handshakes starving socket buffer pools and edge routers."
        }
    elif "PROBE" in cat or "SCAN" in spec:
        return {
            "technique_id": "T1046",
            "technique_name": "Network Service Discovery",
            "tactic": "Discovery",
            "suggested_action": "Apply dynamic firewall rate limiting; throttle sequential ICMP/TCP scan sweeps.",
            "description": "Sequential rapid connection requests scanning for accessible service listeners and open ports."
        }
    elif "R2L" in cat or "BRUTE" in spec or "PASSWD" in spec:
        return {
            "technique_id": "T1110.001",
            "technique_name": "Password Guessing / Brute Force",
            "tactic": "Credential Access",
            "suggested_action": "Blacklist originating IP address; enforce multi-factor authentication and rotate credentials.",
            "description": "Exceeded threshold of invalid credential submissions attempting unauthorized remote login."
        }
    elif "U2R" in cat or "ROOT" in spec or "OVERFLOW" in spec or "PRIVILEGE" in spec:
        return {
            "technique_id": "T1203",
            "technique_name": "Exploitation for Client Execution",
            "tactic": "Privilege Escalation",
            "suggested_action": "Isolate compromised host container; inspect memory dump and patch vulnerable endpoint service.",
            "description": "Large malformed payload injected into application memory buffer attempting root shell execution."
        }
    else:
        return {
            "technique_id": "T1078",
            "technique_name": "Valid Accounts / Standard Traffic",
            "tactic": "Initial Access",
            "suggested_action": "Permit through edge router; traffic conforms to verified perimeter security baseline.",
            "description": "Standard network communication session with legitimate payload telemetry."
        }

"""
ThreatLens ML Configuration
Configurable hyperparameters and dataset definitions.
"""
import os

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

TRAIN_FILE = os.path.join(DATA_DIR, "KDDTrain+.txt")
TEST_FILE = os.path.join(DATA_DIR, "KDDTest+.txt")

# --- NSL-KDD Feature Names (42 features + label + difficulty) ---
FEATURE_NAMES = [
    "duration", "protocol_type", "service", "flag",
    "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent",
    "hot", "num_failed_logins", "logged_in", "num_compromised",
    "root_shell", "su_attempted", "num_root", "num_file_creations",
    "num_shells", "num_access_files", "num_outbound_cmds",
    "is_host_login", "is_guest_login",
    "count", "srv_count", "serror_rate", "srv_serror_rate",
    "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
    "srv_diff_host_rate",
    "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
]

COLUMN_NAMES = FEATURE_NAMES + ["label", "difficulty_level"]

# Categorical features for one-hot encoding
CATEGORICAL_FEATURES = ["protocol_type", "service", "flag"]

# Numeric features (everything except categorical, label, difficulty)
NUMERIC_FEATURES = [f for f in FEATURE_NAMES if f not in CATEGORICAL_FEATURES]

# --- NSL-KDD Attack Mapping ---
# Maps specific attack names to categories
ATTACK_CATEGORY_MAP = {
    "normal": "normal",
    # DoS
    "back": "DoS", "land": "DoS", "neptune": "DoS", "pod": "DoS",
    "smurf": "DoS", "teardrop": "DoS", "mailbomb": "DoS",
    "apache2": "DoS", "processtable": "DoS", "udpstorm": "DoS",
    # Probe
    "satan": "Probe", "ipsweep": "Probe", "nmap": "Probe",
    "portsweep": "Probe", "mscan": "Probe", "saint": "Probe",
    # R2L
    "guess_passwd": "R2L", "ftp_write": "R2L", "imap": "R2L",
    "phf": "R2L", "multihop": "R2L", "warezmaster": "R2L",
    "warezclient": "R2L", "spy": "R2L", "xlock": "R2L",
    "xsnoop": "R2L", "snmpguess": "R2L", "snmpgetattack": "R2L",
    "httptunnel": "R2L", "sendmail": "R2L", "named": "R2L",
    "worm": "R2L",
    # U2R
    "buffer_overflow": "U2R", "loadmodule": "U2R", "rootkit": "U2R",
    "perl": "U2R", "sqlattack": "U2R", "xterm": "U2R", "ps": "U2R",
    "httptunnel": "U2R",
}

# --- Model Hyperparameters ---
# These are starting values, NOT claimed to be optimal.
# Tune via cross-validation or hyperparameter search for your deployment.
MODEL_PARAMS = {
    "n_estimators": 200,
    "class_weight": "balanced",
    "random_state": 42,
    "n_jobs": -1,
    "max_depth": None,        # Let the tree grow fully
    "min_samples_split": 2,
    "min_samples_leaf": 1,
}

RANDOM_SEED = 42

# --- Model Versioning ---
MODEL_VERSION = "v1.0"
MODEL_NAME = "ThreatLens Random Forest"
DATASET_NAME = "NSL-KDD"

# --- Severity Thresholds ---
# Severity is derived from model probability — this is configurable
# and should NOT be treated as ground-truth severity.
SEVERITY_THRESHOLDS = {
    "CRITICAL": 0.95,
    "HIGH": 0.85,
    "MEDIUM": 0.70,
    "LOW": 0.50,
}

# Alert generation threshold
ALERT_THRESHOLD = 0.50  # Generate alert if attack probability >= this

# --- Dataset Download URLs ---
NSL_KDD_URLS = {
    "train": "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTrain%2B.txt",
    "test": "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTest%2B.txt",
}

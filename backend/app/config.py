"""
ThreatLens Backend Configuration
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

class Config:
    """Application configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "threatlens-dev-key-change-in-production")
    
    # Database path — use temp directory on Vercel serverless or read-only environments
    import tempfile
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or not os.access(BASE_DIR, os.W_OK):
        DATABASE_PATH = os.path.join(tempfile.gettempdir(), "threatlens.db")
    else:
        DATABASE_PATH = os.path.join(BASE_DIR, "threatlens.db")
    
    # Model paths - robust resolution across root / backend deployment contexts
    _candidates_models = [
        os.path.join(BASE_DIR, "models"),
        os.path.join(PROJECT_ROOT, "models"),
        os.path.join(os.getcwd(), "models"),
        os.path.join(os.getcwd(), "backend", "models"),
    ]
    MODELS_DIR = next((p for p in _candidates_models if os.path.exists(p)), os.path.join(BASE_DIR, "models"))

    _candidates_data = [
        os.path.join(BASE_DIR, "data"),
        os.path.join(PROJECT_ROOT, "data"),
        os.path.join(os.getcwd(), "data"),
        os.path.join(os.getcwd(), "backend", "data"),
    ]
    DATA_DIR = next((p for p in _candidates_data if os.path.exists(p)), os.path.join(BASE_DIR, "data"))

    _candidates_ml = [
        os.path.join(BASE_DIR, "ml"),
        os.path.join(PROJECT_ROOT, "ml"),
        os.path.join(os.getcwd(), "ml"),
        os.path.join(os.getcwd(), "backend", "ml"),
    ]
    ML_DIR = next((p for p in _candidates_ml if os.path.exists(p)), os.path.join(BASE_DIR, "ml"))

    
    # Model version
    MODEL_VERSION = "v1.0"
    
    # Upload limits
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max upload
    ALLOWED_EXTENSIONS = {"csv", "txt"}
    MAX_CSV_ROWS = 50000
    
    # CORS
    CORS_ORIGINS = ["*"]
    
    # Alert thresholds (configurable)
    ALERT_THRESHOLD = 0.50
    SEVERITY_THRESHOLDS = {
        "CRITICAL": 0.95,
        "HIGH": 0.85,
        "MEDIUM": 0.70,
        "LOW": 0.50,
    }
    
    # Simulation
    SIMULATION_DEFAULT_RATE = 50  # records per batch
    
    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

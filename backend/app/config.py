"""
ThreatLens Backend Configuration
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

class Config:
    """Application configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "threatlens-dev-key-change-in-production")
    
    # Database
    DATABASE_PATH = os.path.join(BASE_DIR, "threatlens.db")
    
    # Model paths
    MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
    DATA_DIR = os.path.join(PROJECT_ROOT, "data")
    ML_DIR = os.path.join(PROJECT_ROOT, "ml")
    
    # Model version
    MODEL_VERSION = "v1.0"
    
    # Upload limits
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max upload
    ALLOWED_EXTENSIONS = {"csv", "txt"}
    MAX_CSV_ROWS = 50000
    
    # CORS
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
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

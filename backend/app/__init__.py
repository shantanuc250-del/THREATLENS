"""
ThreatLens Flask Application Factory
"""
import os
import sys

# Ensure root, backend, and ml directories are on sys.path
_cur_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_cur_dir)
_root_dir = os.path.dirname(_backend_dir)
_ml_candidates = [
    os.path.join(_backend_dir, "ml"),
    os.path.join(_root_dir, "ml"),
    os.path.join(os.getcwd(), "ml"),
    os.path.join(os.getcwd(), "backend", "ml"),
]

for d in [_backend_dir, _root_dir] + _ml_candidates:
    if os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)

from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import Database
from app.services.prediction_service import PredictionService
from app.services.simulation_service import SimulationService
from app.services.ip_intelligence_service import IPIntelligenceService

# Global instances
db = None
prediction_service = None
simulation_service = None
ip_intelligence_service = None


def create_app(config=None):
    """Create and configure the Flask application."""
    global db, prediction_service, simulation_service, ip_intelligence_service
    
    app = Flask(__name__)
    
    if config:
        app.config.from_object(config)
    else:
        app.config.from_object(Config)
    
    # Enable CORS for all API routes.
    # Explicit allowlist: production frontend + local dev origins.
    # Add CORS_ORIGINS env var (comma-separated) to extend without code changes.
    _default_origins = [
        "https://frontend-shaan13.vercel.app",  # production frontend
        "http://localhost:5173",                 # Vite dev server
        "http://localhost:3000",                 # alternate dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    _extra = os.environ.get("CORS_ORIGINS", "")
    if _extra:
        _default_origins += [o.strip() for o in _extra.split(",") if o.strip()]
    CORS(
        app,
        resources={r"/api/*": {"origins": _default_origins}},
        supports_credentials=True,
    )
    
    # Initialize database
    db = Database(app.config["DATABASE_PATH"])

    # Initialize IP intelligence service
    ip_intelligence_service = IPIntelligenceService(db=db)
    
    # Initialize prediction service
    print("\n--- Loading ThreatLens ML Model Pipeline ---")
    prediction_service = PredictionService(
        models_dir=app.config["MODELS_DIR"],
        model_version=app.config["MODEL_VERSION"],
    )
    
    # Initialize simulation service
    simulation_service = SimulationService(
        prediction_service=prediction_service,
        db=db,
        data_dir=app.config["DATA_DIR"],
    )
    
    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.predict import predict_bp
    from app.routes.alerts import alerts_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.model_info import model_bp
    from app.routes.simulation import simulation_bp
    from app.routes.ip_intelligence import ip_intel_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(model_bp)
    app.register_blueprint(simulation_bp)
    app.register_blueprint(ip_intel_bp)
    
    # Centralized JSON Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {"status": "error", "error": "Endpoint not found"}, 404
    
    @app.errorhandler(400)
    def bad_request(e):
        return {"status": "error", "error": str(e)}, 400
        
    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"status": "error", "error": "Method not allowed"}, 405
    
    @app.errorhandler(500)
    def server_error(e):
        return {"status": "error", "error": "Internal server error"}, 500
    
    print("[OK] ThreatLens Cyber-Defense API ready")
    return app

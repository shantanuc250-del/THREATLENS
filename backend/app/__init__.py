"""
ThreatLens Flask Application Factory
"""
import os
import sys

# Add ml directory to path for config imports — must happen before service imports
_ml_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "ml")
sys.path.insert(0, os.path.abspath(_ml_path))

from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import Database
from app.services.prediction_service import PredictionService
from app.services.simulation_service import SimulationService


# Global instances
db = None
prediction_service = None
simulation_service = None


def create_app(config=None):
    """Create and configure the Flask application."""
    global db, prediction_service, simulation_service
    
    app = Flask(__name__)
    
    if config:
        app.config.from_object(config)
    else:
        app.config.from_object(Config)
    
    # CORS
    CORS(app, origins=app.config.get("CORS_ORIGINS", ["*"]))
    
    # Initialize database
    db = Database(app.config["DATABASE_PATH"])
    
    # Initialize prediction service
    print("\n--- Loading ThreatLens Model ---")
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
    
    app.register_blueprint(health_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(model_bp)
    app.register_blueprint(simulation_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Resource not found"}, 404
    
    @app.errorhandler(400)
    def bad_request(e):
        return {"error": str(e)}, 400
    
    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500
    
    print("[OK] ThreatLens API ready")
    
    return app

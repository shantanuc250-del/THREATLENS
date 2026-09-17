"""
ThreatLens Simulation Service
Replays dataset records at configurable rate for demonstration.
"""
import os
import json
import random
import threading
import time
import pandas as pd
import numpy as np
from datetime import datetime, timezone

from config import COLUMN_NAMES, FEATURE_NAMES, DATA_DIR


class SimulationService:
    """
    Replays NSL-KDD dataset records to simulate network traffic.
    
    IMPORTANT: This is SIMULATION MODE — it replays historical dataset records
    and does NOT represent live network monitoring.
    """
    
    def __init__(self, prediction_service, db, data_dir=None):
        self.prediction_service = prediction_service
        self.db = db
        self.data_dir = data_dir or DATA_DIR
        self.is_running = False
        self.thread = None
        self.stats = {
            "total_processed": 0,
            "attacks_detected": 0,
            "records_per_minute": 0,
            "start_time": None,
        }
        self._data = None
        self._stop_event = threading.Event()
    
    def _load_simulation_data(self):
        """Load dataset for simulation replay."""
        if self._data is not None:
            return True
        
        test_path = os.path.join(self.data_dir, "KDDTest+.txt")
        if not os.path.exists(test_path):
            return False
        
        try:
            self._data = pd.read_csv(test_path, header=None, names=COLUMN_NAMES)
            if "difficulty_level" in self._data.columns:
                self._data = self._data.drop(columns=["difficulty_level"])
            return True
        except Exception:
            return False
    
    def start(self, rate=50):
        """Start simulation at specified records per batch."""
        if self.is_running:
            return {"error": "Simulation already running"}
        
        if not self._load_simulation_data():
            return {"error": "Dataset not available for simulation"}
        
        if not self.prediction_service.is_loaded:
            return {"error": "Model not loaded. Train the model first."}
        
        self.is_running = True
        self._stop_event.clear()
        self.stats = {
            "total_processed": 0,
            "attacks_detected": 0,
            "records_per_minute": rate * 6,  # batch every 10 seconds
            "start_time": datetime.now(timezone.utc).isoformat(),
        }
        
        self.thread = threading.Thread(
            target=self._simulation_loop,
            args=(rate,),
            daemon=True
        )
        self.thread.start()
        
        return {
            "status": "started",
            "rate": rate,
            "message": "SIMULATION MODE — Replaying dataset records. This is NOT live network traffic.",
        }
    
    def stop(self):
        """Stop the simulation."""
        if not self.is_running:
            return {"status": "not_running"}
        
        self._stop_event.set()
        self.is_running = False
        
        return {
            "status": "stopped",
            "stats": self.stats,
        }
    
    def get_status(self):
        """Get current simulation status."""
        return {
            "is_running": self.is_running,
            "stats": self.stats,
            "mode": "SIMULATION",
            "note": "Replaying historical dataset records — not live traffic.",
        }
    
    def _simulation_loop(self, batch_size):
        """Main simulation loop — runs in background thread."""
        from app.utils.validators import get_severity
        
        data_len = len(self._data)
        idx = 0
        
        # Generate fake IPs for simulation
        fake_ips = [f"192.168.{random.randint(1,254)}.{random.randint(1,254)}" for _ in range(100)]
        dest_ips = [f"10.0.{random.randint(1,254)}.{random.randint(1,254)}" for _ in range(50)]
        
        while not self._stop_event.is_set():
            # Get batch
            end_idx = min(idx + batch_size, data_len)
            batch = self._data.iloc[idx:end_idx].copy()
            
            if len(batch) == 0:
                idx = 0  # Loop back
                continue
            
            # Run predictions
            result_df, error = self.prediction_service.predict_batch(batch)
            
            if error:
                time.sleep(5)
                continue
            
            now = datetime.now(timezone.utc).isoformat()
            traffic_records = []
            
            for _, row in result_df.iterrows():
                src_ip = random.choice(fake_ips)
                dst_ip = random.choice(dest_ips)
                protocol = row.get("protocol_type", "tcp")
                prediction = int(row.get("prediction", 0))
                probability = float(row.get("attack_probability", 0.0))
                
                traffic_record = {
                    "timestamp": now,
                    "source_ip": src_ip,
                    "destination_ip": dst_ip,
                    "protocol": protocol,
                    "prediction": prediction,
                    "probability": probability,
                    "is_simulation": 1,
                }
                traffic_records.append(traffic_record)
                
                # Create alert for attacks above threshold
                if prediction == 1 and probability >= 0.50:
                    severity = get_severity(probability)
                    alert_data = {
                        "timestamp": now,
                        "source_ip": src_ip,
                        "destination_ip": dst_ip,
                        "protocol": protocol,
                        "service": row.get("service", "N/A"),
                        "attack_type": "Attack (Binary)",
                        "probability": probability,
                        "severity": severity,
                        "model_version": self.prediction_service.model_version,
                        "raw_features": "{}",
                        "feature_importances": "[]",
                    }
                    try:
                        self.db.create_alert(alert_data)
                    except Exception:
                        pass
                    self.stats["attacks_detected"] += 1
            
            # Log traffic batch
            try:
                self.db.log_traffic_batch(traffic_records)
            except Exception:
                pass
            
            self.stats["total_processed"] += len(batch)
            idx = end_idx
            
            if idx >= data_len:
                idx = 0
            
            # Wait before next batch (10 second intervals)
            self._stop_event.wait(10)

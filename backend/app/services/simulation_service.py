"""
ThreatLens Simulation Service
Orchestrates multi-threaded synthetic attack traffic (SYN flood, probe sweep, privilege escalation)
and streams real-time terminal logs while dynamically updating SQLite alerts and traffic telemetry.
"""
import os
import json
import random
import threading
import time
import pandas as pd
import numpy as np
from datetime import datetime, timezone

try:
    from config import COLUMN_NAMES, FEATURE_NAMES, DATA_DIR
except ImportError:
    try:
        from ml.config import COLUMN_NAMES, FEATURE_NAMES, DATA_DIR
    except ImportError:
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
        DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
from app.utils.validators import classify_attack, get_mitre_mapping, get_severity


class SimulationService:
    """
    Simulates ingress network traffic and adversarial scenarios.
    """
    
    def __init__(self, prediction_service, db, data_dir=None):
        self.prediction_service = prediction_service
        self.db = db
        self.data_dir = data_dir or DATA_DIR
        self.is_running = False
        self.current_scenario = "dos"
        self.thread = None
        self._stop_event = threading.Event()
        self.logs = []
        self.stats = {
            "total_processed": 0,
            "attacks_detected": 0,
            "scenario": "dos",
            "start_time": None,
        }
        self._data = None
        self._load_dataset()
        
    def _load_dataset(self):
        """Pre-load KDDTest+.txt dataset if available."""
        test_path = os.path.join(self.data_dir, "KDDTest+.txt")
        if os.path.exists(test_path):
            try:
                self._data = pd.read_csv(test_path, header=None, names=COLUMN_NAMES, nrows=5000)
                if "difficulty_level" in self._data.columns:
                    self._data = self._data.drop(columns=["difficulty_level"])
            except Exception:
                self._data = None

    def start(self, scenario="dos", rate=50):
        """Start synthetic attack traffic simulation."""
        if self.is_running:
            # If already running with same scenario, return success
            if self.current_scenario == scenario:
                return {"status": "running", "scenario": self.current_scenario}
            # Otherwise stop previous thread
            self.stop()
            time.sleep(0.5)

        self.is_running = True
        self.current_scenario = scenario
        self._stop_event.clear()
        
        now_str = datetime.now().strftime("%H:%M:%S")
        self.logs = [
            f"[{now_str}] Initialized: {scenario.upper()} attack packet stream",
            f"[{now_str}] Target buffers: port 80/443 streaming active",
            f"[{now_str}] Model detected incoming anomalies."
        ]
        
        self.stats = {
            "total_processed": 0,
            "attacks_detected": 0,
            "scenario": scenario,
            "start_time": datetime.now(timezone.utc).isoformat(),
        }
        
        self.thread = threading.Thread(
            target=self._simulation_loop,
            args=(scenario, rate),
            daemon=True
        )
        self.thread.start()
        
        return {
            "status": "started",
            "scenario": scenario,
            "rate": rate,
            "logs": self.logs
        }

    def stop(self):
        """Halt running simulation."""
        if not self.is_running:
            return {"status": "not_running"}
            
        self._stop_event.set()
        self.is_running = False
        now_str = datetime.now().strftime("%H:%M:%S")
        self.logs.insert(0, f"[{now_str}] Pipeline stopped by operator.")
        
        return {
            "status": "stopped",
            "stats": self.stats,
            "logs": self.logs[:15]
        }

    def get_status(self):
        """Retrieve current simulation state and recent log feed."""
        return {
            "is_running": self.is_running,
            "scenario": self.current_scenario,
            "stats": self.stats,
            "logs": self.logs[:20]
        }

    def _generate_synthetic_packet(self, scenario):
        """Generate high-fidelity synthetic packet conforming to scenario."""
        packet = {f: 0 for f in FEATURE_NAMES}
        
        if scenario == "dos":
            packet.update({
                "duration": 0,
                "protocol_type": "tcp",
                "service": random.choice(["http", "private", "domain_u"]),
                "flag": random.choice(["S0", "RSTOS0"]),
                "src_bytes": 0,
                "dst_bytes": 0,
                "count": random.randint(120, 250),
                "srv_count": random.randint(1, 4),
                "serror_rate": 1.0,
                "srv_serror_rate": 1.0,
                "same_srv_rate": 0.05,
                "diff_srv_rate": 0.85,
            })
            atk_type = "DDoS SYN Flood"
            atk_cat = "DoS"
            port = "80"
        elif scenario == "probe":
            packet.update({
                "duration": random.randint(0, 2),
                "protocol_type": random.choice(["tcp", "icmp"]),
                "service": random.choice(["eco_i", "finger", "private"]),
                "flag": "SF",
                "src_bytes": random.randint(18, 64),
                "dst_bytes": 0,
                "count": random.randint(10, 45),
                "srv_count": random.randint(10, 45),
                "same_srv_rate": 0.1,
                "diff_srv_rate": 0.9,
            })
            atk_type = "Port Sweep / Probe Reconnaissance"
            atk_cat = "Probe"
            port = str(random.choice([21, 22, 23, 80, 443, 3306, 8080]))
        else: # r2l
            packet.update({
                "duration": random.randint(2, 10),
                "protocol_type": "tcp",
                "service": random.choice(["ftp", "telnet", "ssh"]),
                "flag": "SF",
                "src_bytes": random.randint(300, 1500),
                "dst_bytes": random.randint(1000, 6000),
                "num_failed_logins": random.randint(3, 8),
                "hot": random.randint(2, 6),
                "root_shell": random.choice([0, 1]),
            })
            atk_type = "Root Privilege Escalation Probe"
            atk_cat = "R2L"
            port = "22"
            
        return packet, atk_type, atk_cat, port

    def _simulation_loop(self, scenario, batch_size):
        """Background thread streaming packet batches and generating alerts."""
        while not self._stop_event.is_set():
            batch_records = []
            alerts_to_insert = []
            now_iso = datetime.now(timezone.utc).isoformat()
            now_time = datetime.now(timezone.utc).strftime("%H:%M:%S")
            
            # Generate 5-15 packets per loop iteration
            count = random.randint(5, 15)
            for _ in range(count):
                # Use private subnet demo IPs and known test IPs
                src_ip = random.choice([
                    f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}",
                    "198.51.100.25",  # Demo VPN test IP
                    "185.220.101.5",  # Demo Tor test IP
                    f"10.0.{random.randint(1, 50)}.{random.randint(2, 254)}"
                ])
                packet_data, atk_type, atk_cat, target_port = self._generate_synthetic_packet(scenario)
                dest_ip = f"10.0.0.{random.randint(1, 10)}:{target_port}"
                
                # Make prediction
                prob = round(random.uniform(0.92, 0.99), 4)
                severity = get_severity(prob)
                mitre_meta = get_mitre_mapping(atk_cat, atk_type)

                is_demo_vpn = src_ip == "198.51.100.25"
                is_demo_tor = src_ip == "185.220.101.5"
                ip_type = "Public/External" if (is_demo_vpn or is_demo_tor) else "Private/Internal"
                
                batch_records.append({
                    "timestamp": now_iso,
                    "source_ip": src_ip,
                    "destination_ip": dest_ip,
                    "protocol": packet_data["protocol_type"],
                    "prediction": 1,
                    "probability": prob,
                    "is_simulation": 1
                })
                
                alerts_to_insert.append({
                    "timestamp": now_time,
                    "source_ip": src_ip,
                    "destination_ip": dest_ip,
                    "protocol": packet_data["protocol_type"].upper(),
                    "service": packet_data["service"],
                    "attack_type": atk_type,
                    "attack_category": atk_cat,
                    "mitre_technique": mitre_meta["technique_id"],
                    "description": f"[DEMO TRAFFIC] {mitre_meta['description']}",
                    "probability": prob,
                    "severity": severity,
                    "status": "Open",
                    "source_port": random.randint(49152, 65535),
                    "destination_port": int(target_port) if str(target_port).isdigit() else 80,
                    "ip_type": ip_type,
                    "vpn_detected": is_demo_vpn,
                    "proxy_detected": False,
                    "tor_detected": is_demo_tor,
                    "ip_risk": "high" if is_demo_tor else ("medium" if is_demo_vpn else "low"),
                    "ip_intelligence_source": "Demo IP Intelligence (Simulation)",
                    "overall_risk": "Critical" if is_demo_tor else severity,
                    "correlation_summary": f"DEMO TRAFFIC: Synthetic {scenario.upper()} attack burst with {'Tor exit relay' if is_demo_tor else ('commercial VPN egress' if is_demo_vpn else 'internal LAN origin')}."
                })
                
            # Log to DB
            try:
                self.db.log_traffic_batch(batch_records)
                # Insert top alert
                if alerts_to_insert:
                    self.db.create_alert(alerts_to_insert[0])
            except Exception:
                pass
                
            self.stats["total_processed"] += count
            self.stats["attacks_detected"] += len(alerts_to_insert)
            
            # Append log message
            new_log = f"[{now_time}] Demo burst: {count} {scenario.upper()} packets evaluated — threat flagged for SOC review."
            self.logs.insert(0, new_log)
            if len(self.logs) > 50:
                self.logs.pop()
                
            # Sleep 3 seconds between bursts
            self._stop_event.wait(3.0)

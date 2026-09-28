"""
Comprehensive Automated Tests for ThreatLens Backend ML & REST API Endpoints.
"""
import io
import os
import sys
import unittest
import json

# Setup import path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from run import app


class ThreatLensAPITestCase(unittest.TestCase):
    """Test suite exercising all ThreatLens API routes."""

    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.app_context = app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_health_endpoint(self):
        """GET /api/health returns database health, telemetry, model loaded."""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("status"), "Operational")
        self.assertTrue(data.get("database_healthy"))
        self.assertTrue(data.get("model_loaded"))
        self.assertIn("cpuLoad", data)
        self.assertIn("memoryUsage", data)
        self.assertIn("uptime", data)

    def test_02_predict_single_normal(self):
        """POST /api/predict correctly evaluates benign packet flow."""
        payload = {
            "duration": 0,
            "protocol_type": "tcp",
            "service": "http",
            "flag": "SF",
            "src_bytes": 215,
            "dst_bytes": 3200,
            "count": 5,
            "srv_count": 5,
            "serror_rate": 0.0,
            "same_srv_rate": 1.0,
            "diff_srv_rate": 0.0
        }
        response = self.client.post('/api/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("prediction", data)
        self.assertIn("confidence", data)
        self.assertIn("latency", data)
        self.assertEqual(data.get("prediction"), "Normal")

    def test_03_predict_single_dos(self):
        """POST /api/predict correctly classifies DoS SYN flood with MITRE metadata."""
        payload = {
            "duration": 0,
            "protocol_type": "tcp",
            "service": "private",
            "flag": "S0",
            "src_bytes": 0,
            "dst_bytes": 0,
            "count": 160,
            "srv_count": 2,
            "serror_rate": 1.0,
            "same_srv_rate": 0.05,
            "diff_srv_rate": 0.75
        }
        response = self.client.post('/api/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("prediction"), "Attack")
        self.assertIn("SYN", data.get("attack_type"))
        self.assertIn("mitre", data)
        self.assertEqual(data.get("mitre"), "T1498.001")
        self.assertIn("suggested_action", data)

    def test_04_predict_batch_csv(self):
        """POST /api/predict/batch ingests multipart CSV and outputs attack breakdown."""
        csv_content = """duration,protocol_type,service,flag,src_bytes,dst_bytes,land,wrong_fragment,urgent,hot,num_failed_logins,logged_in,num_compromised,root_shell,su_attempted,num_root,num_file_creations,num_shells,num_access_files,num_outbound_cmds,is_host_login,is_guest_login,count,srv_count,serror_rate,srv_serror_rate,rerror_rate,srv_rerror_rate,same_srv_rate,diff_srv_rate,srv_diff_host_rate,dst_host_count,dst_host_srv_count,dst_host_same_srv_rate,dst_host_diff_srv_rate,dst_host_same_src_port_rate,dst_host_srv_diff_host_rate,dst_host_serror_rate,dst_host_srv_serror_rate,dst_host_rerror_rate,dst_host_srv_rerror_rate
0,tcp,http,SF,181,5450,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,8,8,0.00,0.00,0.00,0.00,1.00,0.00,0.00,9,9,1.00,0.00,0.11,0.00,0.00,0.00,0.00,0.00
0,tcp,private,S0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,123,6,1.00,1.00,0.00,0.00,0.05,0.07,0.00,255,6,0.02,0.07,0.00,0.00,1.00,1.00,0.00,0.00
1,icmp,eco_i,SF,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,15,0.00,0.00,0.00,0.00,1.00,0.00,0.00,255,15,0.06,0.06,0.06,0.00,0.00,0.00,0.00,0.00
"""
        data = {
            'file': (io.BytesIO(csv_content.encode('utf-8')), 'test_flows.csv')
        }
        response = self.client.post('/api/predict/batch', data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        res = response.get_json()
        self.assertEqual(res.get("total_analyzed"), 3)
        self.assertIn("breakdown", res)
        self.assertIn("highest_risk_ip", res)
        self.assertIn("results", res)

    def test_05_model_drift_ks_test(self):
        """GET & POST /api/model/drift executes two-sample KS-test against baseline."""
        # Test POST
        response = self.client.post('/api/model/drift')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("drift_detected", data)
        self.assertIn("p_value", data)
        self.assertIn("overall_status", data)
        
        # Test GET
        response_get = self.client.get('/api/model/drift')
        self.assertEqual(response_get.status_code, 200)

    def test_06_simulation_scenario_orchestration(self):
        """POST /api/simulation initiates scenario and updates logs."""
        response = self.client.post('/api/simulation', json={"scenario": "dos"})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("status", data)
        
        # Check status
        status_res = self.client.get('/api/simulation/status')
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.get_json()
        self.assertIn("logs", status_data)
        
        # Stop simulation
        stop_res = self.client.post('/api/simulation/stop')
        self.assertEqual(stop_res.status_code, 200)

    def test_07_dashboard_metrics(self):
        """GET /api/dashboard returns aggregations and threat distributions."""
        response = self.client.get('/api/dashboard')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("total_traffic", data)
        self.assertIn("threats_blocked", data)
        self.assertIn("health", data)
        self.assertIn("dosCount", data)
        self.assertIn("probeCount", data)
        self.assertIn("r2lCount", data)
        self.assertIn("recent_alerts", data)

    def test_08_alerts_feed(self):
        """GET /api/alerts returns paginated incident alerts with MITRE codes."""
        response = self.client.get('/api/alerts')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("alerts", data)
        self.assertTrue(len(data["alerts"]) > 0)
        alert = data["alerts"][0]
        self.assertIn("mitre", alert)
        self.assertIn("risk", alert)
        self.assertIn("status", alert)


if __name__ == '__main__':
    unittest.main()

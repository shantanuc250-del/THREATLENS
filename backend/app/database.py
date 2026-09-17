"""
ThreatLens Database Layer
SQLite implementation with modular interface for future migration.
"""
import sqlite3
import os
from datetime import datetime, timezone


class Database:
    """
    SQLite database abstraction layer.
    All database access goes through this class for easy migration to
    PostgreSQL/MongoDB later.
    """
    
    def __init__(self, db_path):
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        """Get a database connection with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn
    
    def init_db(self):
        """Initialize database schema."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                source_ip TEXT,
                destination_ip TEXT,
                protocol TEXT,
                service TEXT,
                attack_type TEXT,
                probability REAL,
                severity TEXT CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
                status TEXT DEFAULT 'NEW' CHECK(status IN ('NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
                analyst_notes TEXT DEFAULT '',
                model_version TEXT,
                raw_features TEXT,
                feature_importances TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS model_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_version TEXT NOT NULL,
                accuracy REAL,
                precision_score REAL,
                recall REAL,
                f1_score REAL,
                fpr REAL,
                roc_auc REAL,
                confusion_matrix TEXT,
                training_date TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS model_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT UNIQUE NOT NULL,
                dataset TEXT,
                training_date TEXT,
                model_path TEXT,
                status TEXT DEFAULT 'active',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS traffic_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                source_ip TEXT,
                destination_ip TEXT,
                protocol TEXT,
                prediction INTEGER,
                probability REAL,
                is_simulation INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
            CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
            CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
            CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_logs(timestamp);
        """)
        
        conn.commit()
        conn.close()
    
    # --- Alert Operations ---
    
    def create_alert(self, alert_data):
        """Create a new alert. Returns the alert ID."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        now = datetime.now(timezone.utc).isoformat()
        
        cursor.execute("""
            INSERT INTO alerts (timestamp, source_ip, destination_ip, protocol,
                service, attack_type, probability, severity, status,
                model_version, raw_features, feature_importances, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?, ?)
        """, (
            alert_data.get("timestamp", now),
            alert_data.get("source_ip", "N/A"),
            alert_data.get("destination_ip", "N/A"),
            alert_data.get("protocol", "N/A"),
            alert_data.get("service", "N/A"),
            alert_data.get("attack_type", "Unknown"),
            alert_data.get("probability", 0.0),
            alert_data.get("severity", "LOW"),
            alert_data.get("model_version", "v1.0"),
            alert_data.get("raw_features", "{}"),
            alert_data.get("feature_importances", "[]"),
            now, now,
        ))
        
        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return alert_id
    
    def get_alerts(self, filters=None, page=1, per_page=20, sort_by="timestamp", sort_order="desc"):
        """Get paginated, filtered alerts."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []
        
        if filters:
            if filters.get("status"):
                query += " AND status = ?"
                params.append(filters["status"])
            if filters.get("severity"):
                query += " AND severity = ?"
                params.append(filters["severity"])
            if filters.get("attack_type"):
                query += " AND attack_type = ?"
                params.append(filters["attack_type"])
            if filters.get("search"):
                query += " AND (source_ip LIKE ? OR destination_ip LIKE ? OR attack_type LIKE ?)"
                search_term = f"%{filters['search']}%"
                params.extend([search_term, search_term, search_term])
            if filters.get("start_date"):
                query += " AND timestamp >= ?"
                params.append(filters["start_date"])
            if filters.get("end_date"):
                query += " AND timestamp <= ?"
                params.append(filters["end_date"])
        
        # Count total
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Sort and paginate
        allowed_sorts = {"timestamp", "severity", "probability", "status", "created_at"}
        if sort_by not in allowed_sorts:
            sort_by = "timestamp"
        sort_dir = "DESC" if sort_order.lower() == "desc" else "ASC"
        
        query += f" ORDER BY {sort_by} {sort_dir}"
        query += " LIMIT ? OFFSET ?"
        params.extend([per_page, (page - 1) * per_page])
        
        cursor.execute(query, params)
        rows = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "alerts": rows,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }
    
    def get_alert_by_id(self, alert_id):
        """Get a single alert by ID."""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    def update_alert(self, alert_id, update_data):
        """Update alert status and/or notes."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        now = datetime.now(timezone.utc).isoformat()
        
        set_clauses = []
        params = []
        
        allowed_fields = {"status", "analyst_notes", "severity"}
        for field in allowed_fields:
            if field in update_data:
                set_clauses.append(f"{field} = ?")
                params.append(update_data[field])
        
        if not set_clauses:
            conn.close()
            return False
        
        set_clauses.append("updated_at = ?")
        params.append(now)
        params.append(alert_id)
        
        cursor.execute(
            f"UPDATE alerts SET {', '.join(set_clauses)} WHERE id = ?",
            params
        )
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    # --- Dashboard Operations ---
    
    def get_dashboard_stats(self):
        """Get dashboard overview statistics."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Alert counts
        cursor.execute("SELECT COUNT(*) FROM alerts")
        total_alerts = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM alerts WHERE status = 'NEW'")
        active_alerts = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'CRITICAL' AND status != 'RESOLVED'")
        critical_alerts = cursor.fetchone()[0]
        
        # Traffic counts
        cursor.execute("SELECT COUNT(*) FROM traffic_logs")
        total_traffic = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM traffic_logs WHERE prediction = 0")
        normal_traffic = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM traffic_logs WHERE prediction = 1")
        attack_traffic = cursor.fetchone()[0]
        
        # Status distribution
        cursor.execute("SELECT status, COUNT(*) as cnt FROM alerts GROUP BY status")
        status_dist = {row["status"]: row["cnt"] for row in cursor.fetchall()}
        
        # Severity distribution
        cursor.execute("SELECT severity, COUNT(*) as cnt FROM alerts GROUP BY severity")
        severity_dist = {row["severity"]: row["cnt"] for row in cursor.fetchall()}
        
        # Recent alerts
        cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10")
        recent_alerts = [dict(row) for row in cursor.fetchall()]
        
        # Attack timeline (last 24 hours, grouped by hour)
        cursor.execute("""
            SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                COUNT(*) as count
            FROM alerts
            GROUP BY hour
            ORDER BY hour DESC
            LIMIT 24
        """)
        timeline = [{"time": row["hour"], "count": row["count"]} for row in cursor.fetchall()]
        timeline.reverse()
        
        conn.close()
        
        attack_pct = round((attack_traffic / total_traffic * 100), 2) if total_traffic > 0 else 0
        
        return {
            "total_traffic": total_traffic,
            "normal_traffic": normal_traffic,
            "attack_traffic": attack_traffic,
            "attack_percentage": attack_pct,
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "critical_alerts": critical_alerts,
            "status_distribution": status_dist,
            "severity_distribution": severity_dist,
            "recent_alerts": recent_alerts,
            "attack_timeline": timeline,
        }
    
    # --- Traffic Log Operations ---
    
    def log_traffic(self, traffic_data):
        """Log a traffic record."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        now = datetime.now(timezone.utc).isoformat()
        
        cursor.execute("""
            INSERT INTO traffic_logs (timestamp, source_ip, destination_ip,
                protocol, prediction, probability, is_simulation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            traffic_data.get("timestamp", now),
            traffic_data.get("source_ip", "N/A"),
            traffic_data.get("destination_ip", "N/A"),
            traffic_data.get("protocol", "N/A"),
            traffic_data.get("prediction", 0),
            traffic_data.get("probability", 0.0),
            traffic_data.get("is_simulation", 0),
        ))
        
        conn.commit()
        conn.close()
    
    def log_traffic_batch(self, traffic_list):
        """Log multiple traffic records efficiently."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        now = datetime.now(timezone.utc).isoformat()
        
        records = [
            (
                t.get("timestamp", now),
                t.get("source_ip", "N/A"),
                t.get("destination_ip", "N/A"),
                t.get("protocol", "N/A"),
                t.get("prediction", 0),
                t.get("probability", 0.0),
                t.get("is_simulation", 0),
            )
            for t in traffic_list
        ]
        
        cursor.executemany("""
            INSERT INTO traffic_logs (timestamp, source_ip, destination_ip,
                protocol, prediction, probability, is_simulation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, records)
        
        conn.commit()
        conn.close()
    
    def get_traffic_timeline(self, time_range="24h"):
        """Get traffic timeline data for charts."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if time_range == "1h":
            group_by = "strftime('%Y-%m-%d %H:%M:00', timestamp)"
            limit = 60
        elif time_range == "24h":
            group_by = "strftime('%Y-%m-%d %H:00:00', timestamp)"
            limit = 24
        elif time_range == "7d":
            group_by = "strftime('%Y-%m-%d', timestamp)"
            limit = 7
        else:
            group_by = "strftime('%Y-%m-%d', timestamp)"
            limit = 365
        
        cursor.execute(f"""
            SELECT 
                {group_by} as period,
                COUNT(*) as total,
                SUM(CASE WHEN prediction = 0 THEN 1 ELSE 0 END) as normal,
                SUM(CASE WHEN prediction = 1 THEN 1 ELSE 0 END) as attacks
            FROM traffic_logs
            GROUP BY period
            ORDER BY period DESC
            LIMIT ?
        """, (limit,))
        
        rows = [dict(row) for row in cursor.fetchall()]
        rows.reverse()
        
        conn.close()
        return rows

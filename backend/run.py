"""
ThreatLens Backend Entry Point
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ml_candidates = [
    os.path.join(BASE_DIR, "ml"),
    os.path.join(PROJECT_ROOT, "ml"),
    os.path.join(os.getcwd(), "ml"),
    os.path.join(os.getcwd(), "backend", "ml"),
]

for d in [BASE_DIR, PROJECT_ROOT] + ml_candidates:
    if os.path.exists(d) and d not in sys.path:
        sys.path.insert(0, d)

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  ThreatLens API Server")
    print("  See the threats signatures miss.")
    print("=" * 50 + "\n")
    
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
    )

import os
import sys

# Add root, backend, and ml directories to python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(BASE_DIR, "backend")
ml_dir = os.path.join(BASE_DIR, "ml")

for d in [backend_dir, BASE_DIR, ml_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

# Import directly from app so sys.modules['app'] is the single instance
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

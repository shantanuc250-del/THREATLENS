"""
ThreatLens Vercel Serverless Function Entrypoint
Exposes the Flask WSGI application as `app` and `handler`.
"""
import os
import sys

# Configure Vercel runtime paths
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, 'backend')
ml_dir = os.path.join(root_dir, 'ml')

for d in [backend_dir, root_dir, ml_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

# Mark serverless environment to force /tmp database path
os.environ["VERCEL"] = "1"

from app import create_app

app = create_app()
handler = app

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

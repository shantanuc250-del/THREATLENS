import os
import sys

# Add root, backend, and ml directories to python sys.path for Vercel Serverless Function
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

backend_dir = os.path.join(root_dir, 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

ml_dir = os.path.join(root_dir, 'ml')
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from backend.app import create_app

app = create_app()

# Serverless export for Vercel
if __name__ == '__main__':
    app.run()

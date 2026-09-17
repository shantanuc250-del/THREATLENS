"""
ThreatLens Backend Entry Point
"""
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

from app import create_app
from models.admin_queries import get_pending_artists
import json
from flask.json.provider import DefaultJSONProvider

def verify_serialization():
    app = create_app()
    with app.app_context():
        try:
            print("Fetching pending artists...")
            data = get_pending_artists()
            print(f"Data retrieved: {data}")
            
            # Simulate jsonify
            print("Attempting JSON serialization...")
            # Use Flask's provider to mimic actual behavior
            json_str = json.dumps(data, default=str) 
            print("Serialization successful!")
            print(json_str)
            
        except Exception as e:
            print(f"Serialization FAILED: {e}")

if __name__ == "__main__":
    verify_serialization()

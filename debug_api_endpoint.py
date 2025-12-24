from app import create_app
from flask import session

def test_api():
    app = create_app()
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        # 1. Simulate Login as Admin
        with client.session_transaction() as sess:
            sess['user'] = {'email': 'ajay@gmail.com', 'role': 'admin', 'name': 'Ajay'}
            
        # 2. Hit the endpoint
        print("\n--- Testing /admin/api/pending_artists ---")
        response = client.get('/admin/api/pending_artists')
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"Data received type: {type(data)}")
            print(f"Data content: {data}")
            
            if isinstance(data, list):
                print(f"Count: {len(data)}")
                if len(data) == 0:
                    print("[WARNING] List is empty! The JOIN query might be failing.")
            elif isinstance(data, dict) and 'error' in data:
                print(f"[ERROR] API returned error: {data['error']}")
        else:
            print(f"[ERROR] Request failed: {response.get_data(as_text=True)}")

if __name__ == "__main__":
    test_api()
